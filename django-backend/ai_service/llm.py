import os
import json
import time
import requests
from openai import OpenAI


class LLMError(Exception):
    pass


def _openai_client():
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise LLMError("OPENAI_API_KEY is missing")
    return OpenAI(api_key=key)


def _call_openai(prompt, temperature=0.4):
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    client = _openai_client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a precise AI backend assistant. Return practical, grounded responses."},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=900,
    )
    return resp.choices[0].message.content or ""


def _call_ollama(prompt):
    base = os.getenv("OLLAMA_BASE_URL", "").strip()
    if not base:
        raise LLMError("OLLAMA_BASE_URL is not configured")
    model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    timeout_seconds = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "180"))
    max_tokens = int(os.getenv("OLLAMA_MAX_TOKENS", "220"))
    url = f"{base.rstrip('/')}/api/generate"
    res = requests.post(
        url,
        json={
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": max_tokens},
        },
        timeout=timeout_seconds,
    )
    res.raise_for_status()
    data = res.json()
    return data.get("response", "")


def run_llm(prompt, temperature=0.4):
    preferred = os.getenv("AI_PREFERRED_PROVIDER", "ollama").strip().lower()

    if preferred == "ollama":
        try:
            return _call_ollama(prompt), "ollama"
        except Exception as ollama_exc:
            try:
                return _call_openai(prompt, temperature=temperature), "openai"
            except Exception as openai_exc:
                raise LLMError(
                    f"AI providers unavailable: ollama_error={ollama_exc}; openai_error={openai_exc}"
                ) from ollama_exc

    openai_error = None

    # Retry OpenAI once for transient transport failures.
    for attempt in range(2):
        try:
            return _call_openai(prompt, temperature=temperature), "openai"
        except Exception as exc:
            openai_error = exc
            msg = str(exc).lower()
            is_quota_or_auth = "429" in msg or "insufficient_quota" in msg or "invalid api key" in msg
            if is_quota_or_auth:
                break
            if attempt == 0:
                time.sleep(0.4)

    # Fallback path for quota (429) or temporary OpenAI issues.
    try:
        return _call_ollama(prompt), "ollama"
    except Exception as ollama_exc:
        raise LLMError(
            f"AI providers unavailable: openai_error={openai_error}; ollama_error={ollama_exc}"
        ) from openai_error


def run_structured(prompt, required_keys):
    shaped_prompt = (
        f"{prompt}\n\n"
        "Return ONLY valid JSON object with keys: "
        + ", ".join(required_keys)
    )
    text, provider = run_llm(shaped_prompt, temperature=0.3)
    text = text.strip()
    parsed = None
    try:
        parsed = json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            parsed = json.loads(text[start : end + 1])

    if not isinstance(parsed, dict):
        raise LLMError("Model did not return valid JSON")

    for key in required_keys:
        parsed.setdefault(key, None)
    parsed["provider"] = provider
    return parsed
