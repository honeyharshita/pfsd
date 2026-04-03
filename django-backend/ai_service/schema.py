import graphene
from graphene.types.generic import GenericScalar
from .llm import run_llm, run_structured, LLMError
from .db import get_mongo, get_surreal


def _err_payload(message):
    return {"success": False, "error": message}


def _ok_payload(data):
    return {"success": True, **data}


class Query(graphene.ObjectType):
    invoke_llm = GenericScalar(prompt=graphene.String(required=True), language=graphene.String())
    chat = GenericScalar(message=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    mood_forecast = GenericScalar(data=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    trigger_analysis = GenericScalar(input=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    weekly_report = GenericScalar(user_id=graphene.String(required=True), language=graphene.String())
    decision_helper = GenericScalar(context=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    camera_mood = GenericScalar(image_base64=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    emotion_story = GenericScalar(prompt=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    color_therapy = GenericScalar(mood=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    study_helper = GenericScalar(subjects=graphene.String(required=True), user_id=graphene.String(), language=graphene.String())
    positivity_feed = GenericScalar(user_id=graphene.String(), language=graphene.String())
    dashboard_stats = GenericScalar(user_id=graphene.String())

    def resolve_invoke_llm(self, _info, prompt, language='en'):
        try:
            text, provider = run_llm(f"Language: {language}. {prompt}")
            return _ok_payload({"response": text, "provider": provider})
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_chat(self, _info, message, user_id="anonymous", language="en"):
        try:
            mongo = get_mongo()
            prompt = (
                f"Language: {language}.\n"
                "You are an empathetic but practical assistant.\n"
                f"User message: {message}\n"
                "Return concise and relevant answer in 1-2 short sentences (max 60 words)."
            )
            text, provider = run_llm(prompt)
            mongo.append_chat(user_id, message, text, language)
            return _ok_payload({"response": text, "provider": provider})
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_mood_forecast(self, _info, data, user_id="anonymous", language="en"):
        try:
            mongo = get_mongo()
            surreal = get_surreal()
            result = run_structured(
                (
                    f"Language: {language}. Analyze mood trends from this data: {data}. "
                    "Predict short-term mood for next 3 days and suggest coping actions."
                ),
                ["forecast", "risk_level", "actions"],
            )
            mongo.add_mood_log(user_id, {"input": data, "forecast": result})
            surreal.write_metric(user_id, "mood_risk", 1 if (result.get("risk_level") or "").lower() in {"high", "critical"} else 0)
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_trigger_analysis(self, _info, input, user_id="anonymous", language="en"):
        try:
            result = run_structured(
                (
                    f"Language: {language}. Analyze emotional triggers in this text: {input}. "
                    "Identify top triggers, likely emotion, intensity 0-10, and advice."
                ),
                ["triggers", "emotion", "intensity", "advice"],
            )
            get_surreal().write_metric(user_id, "trigger_intensity", float(result.get("intensity") or 0))
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_weekly_report(self, _info, user_id, language="en"):
        try:
            mongo = get_mongo()
            chats = list(mongo.db.chat_logs.find({"user_id": user_id}, {"message": 1, "response": 1, "_id": 0}).sort("created_at", -1).limit(20))
            moods = list(mongo.db.mood_logs.find({"user_id": user_id}, {"payload": 1, "_id": 0}).sort("created_at", -1).limit(20))
            prompt = (
                f"Language: {language}. Build weekly mental wellness report from chats={chats} moods={moods}. "
                "Include summary, positives, concerns, and next week plan."
            )
            result = run_structured(prompt, ["summary", "positives", "concerns", "plan"])
            mongo.add_report(user_id, "weekly", result)
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_decision_helper(self, _info, context, user_id="anonymous", language="en"):
        try:
            result = run_structured(
                (
                    f"Language: {language}. Decision context: {context}. "
                    "Provide options, pros_cons, recommendation, and first_step."
                ),
                ["options", "pros_cons", "recommendation", "first_step"],
            )
            get_surreal().write_metric(user_id, "decisions", 1)
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_camera_mood(self, _info, image_base64, user_id="anonymous", language="en"):
        try:
            # Text-only models are handled gracefully with structured interpretation prompt.
            result = run_structured(
                (
                    f"Language: {language}. Interpret mood from provided image metadata payload length={len(image_base64)}. "
                    "Return detected_mood, confidence, observation, recommendation."
                ),
                ["detected_mood", "confidence", "observation", "recommendation"],
            )
            get_surreal().write_metric(user_id, "camera_mood_confidence", float(result.get("confidence") or 0))
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_emotion_story(self, _info, prompt, user_id="anonymous", language="en"):
        try:
            result = run_structured(
                f"Language: {language}. Create supportive short story from this emotional prompt: {prompt}.",
                ["title", "story", "takeaway"],
            )
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_color_therapy(self, _info, mood, user_id="anonymous", language="en"):
        try:
            result = run_structured(
                f"Language: {language}. Suggest color therapy for mood='{mood}'.",
                ["palette", "why", "exercise"],
            )
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_study_helper(self, _info, subjects, user_id="anonymous", language="en"):
        try:
            result = run_structured(
                (
                    f"Language: {language}. Build a personalized study plan for subjects: {subjects}. "
                    "Include schedule, techniques, and revision checklist."
                ),
                ["schedule", "techniques", "checklist"],
            )
            get_surreal().write_metric(user_id, "study_plans", 1)
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_positivity_feed(self, _info, user_id="anonymous", language="en"):
        try:
            mongo = get_mongo()
            samples = mongo.positivity_samples(limit=8)
            result = run_structured(
                (
                    f"Language: {language}. Generate uplifting affirmations using these context samples: {samples}. "
                    "Return a list of affirmations with short rationale."
                ),
                ["affirmations", "rationale"],
            )
            return _ok_payload(result)
        except Exception as exc:
            return _err_payload(str(exc))

    def resolve_dashboard_stats(self, _info, user_id="anonymous"):
        try:
            surreal = get_surreal()
            rows = surreal.dashboard_stats(user_id=user_id)
            return _ok_payload({"stats": rows})
        except Exception as exc:
            return _err_payload(str(exc))


class RunHealthCheck(graphene.Mutation):
    Output = GenericScalar

    def mutate(self, _info):
        details = {"mongo": False, "surreal": False, "llm": False}
        try:
            get_mongo().ping()
            details["mongo"] = True
        except Exception:
            pass
        try:
            get_surreal().connect()
            details["surreal"] = True
        except Exception:
            pass
        try:
            run_llm("Return JSON: {\"ok\": true}")
            details["llm"] = True
        except LLMError:
            pass
        return {"success": all(details.values()), "checks": details}


class Mutation(graphene.ObjectType):
    run_health_check = RunHealthCheck.Field()
