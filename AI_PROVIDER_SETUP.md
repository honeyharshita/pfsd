# AI Provider Configuration Guide

Your chat is now working with **multi-provider fallback support**! Here's what's happening:

## Current Status

✅ **Chat is functional** with automatic fallback chain:
1. **OpenAI** (Primary) - Currently quota exceeded
2. **Groq** (Secondary) - Free, fast, generous limits
3. **Django GraphQL** (Tertiary) - Local Python backend
4. **Local Fallback** - Built-in response generator

---

## Option 1: Use Groq (Recommended - Free & Fast)

Groq is a free AI service with generous limits. Perfect for development!

### Setup Steps:

1. **Sign up for free:**
   - Visit https://console.groq.com/
   - Create a free account
   - Generate an API key

2. **Update `.env.local`:**
   ```bash
   # backend/.env.local
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

3. **Restart the backend:**
   ```bash
   cd backend
   npm start
   ```

**Features:**
- Free tier: 30 requests/minute
- Models: Mixtral-8x7b (fast), Llama 2 (accurate)
- No credit card required
- Instant responses

---

## Option 2: Use a New OpenAI API Key

If you prefer OpenAI:

1. **Get a new API key:**
   - Visit https://platform.openai.com/account/api-keys
   - Create a new secret key
   - Ensure billing is enabled and quota is available

2. **Update `.env.local`:**
   ```bash
   # backend/.env.local
   OPENAI_API_KEY=sk-proj-your-new-key-here
   ```

3. **Restart the backend:**
   ```bash
   cd backend
   npm start
   ```

---

## Option 3: Use Both (Recommended for Production)

Have both configured for maximum reliability:

```bash
# backend/.env.local
OPENAI_API_KEY=sk-proj-your-key-here
GROQ_API_KEY=gsk_your-groq-key-here
```

The system will try OpenAI first, then Groq if OpenAI fails.

---

## Testing Your Setup

### Test the chat API directly:

```bash
node -e "
const data = JSON.stringify({
  message: 'hello',
  conversationHistory: [],
  language: 'en'
});

fetch('http://localhost:5000/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: data
})
.then(r => r.json())
.then(json => console.log(JSON.stringify(json, null, 2)))
.catch(e => console.error('Error:', e.message));
"
```

### Expected output:
```json
{
  "success": true,
  "reply": {
    "response": "AI-generated response here...",
    "detected_sentiment": "neutral",
    "sentiment_score": 0.5
  }
}
```

---

## Fallback Chain Explanation

When you send a message:

1. **Try OpenAI** (if key is configured and valid)
   - ✅ Success → Use response
   - ❌ Quota exceeded/API error → Continue to step 2

2. **Try Groq** (if key is configured)
   - ✅ Success → Use response
   - ❌ API error → Continue to step 3

3. **Try Django GraphQL** (if available)
   - ✅ Success → Use response
   - ❌ Not available → Continue to step 4

4. **Use Local Fallback**
   - Always works
   - Generates friendly, context-aware responses
   - Based on keyword matching and sentiment analysis

---

## Recommended Setup

For the best experience during development:

```bash
# backend/.env.local
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE  # Optional, for primary
GROQ_API_KEY=gsk_XXXXXXXX              # Required, as free backup
```

**Why?**
- Groq is completely free with instant API access
- No waiting for OpenAI credits or quota reset
- Chat will always work (4-level fallback)
- Perfect for testing and development

---

## Troubleshooting

### Chat responses are generic?
→ No AI provider is configured. Set up Groq or OpenAI.

### "All AI providers failed" error?
→ All providers unavailable. Check internet connection and API credentials.

### Very slow responses?
→ Using fallback chain. Check if Groq/OpenAI is actually working.

### Backend logs showing "quota exceeded"?
→ Normal! OpenAI is out of quota. Groq fallback will handle requests.

---

## Free Tier Limits

| Provider | Free Requests/min | Speed | Accuracy |
|----------|------------------|-------|----------|
| Groq | 30 | ⚡ Very fast | ✅ Good |
| OpenAI | Pay per use | ✅ Fast | ✅✅ Excellent |
| Django | Unlimited* | ⏱️ Medium | ⚠️ Local |

*Depends on your Django backend if running locally

---

## Next Steps

1. Choose a provider (Groq recommended)
2. Get free API key
3. Update `.env.local`
4. Restart backend: `npm start`
5. Test chat in the UI
6. Enjoy! 🎉
