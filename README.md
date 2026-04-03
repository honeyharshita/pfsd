# MindfulAI Project

MindfulAI is a full-stack wellness platform with AI-assisted chat, mood tools, reports, and interactive self-help modules.

This repository includes:
- React frontend (Vite)
- Node/Express backend API
- Django support backend (auxiliary service)
- AI integrations with local-first LLM strategy (Ollama first, provider fallbacks)

## 1. Project Overview

The app is designed to support mental wellness workflows such as:
- Context-aware AI chat
- Mood tracking and analysis
- Trigger detection
- Weekly reports
- Study and focus support
- Positive feed and guided activities

The architecture is local-development friendly and supports graceful fallbacks when external providers are unavailable.

## 2. Repository Structure

- `backend/` - Main Express API server, chat logic, AI routing, sentiment and feature endpoints
- `pfsd/` - Frontend React app (Vite)
- `django-backend/` - Auxiliary Python/Django service components
- Root docs (`QUICK_START.md`, `SETUP_AND_FIX_GUIDE.md`, etc.) - Detailed implementation notes and setup references

## 3. Tech Stack

Frontend:
- React
- Vite
- Tailwind-based UI components
- Framer Motion

Backend:
- Node.js
- Express
- In-memory fallback storage
- Optional SurrealDB/Mongo paths depending on runtime availability

AI:
- Ollama (local model, preferred first)
- Gemini/OpenAI/provider adapters
- Rule-based and fallback generation for reliability

Auxiliary:
- Django service modules for extended AI schema/service functionality

## 4. Implementation Architecture

### 4.1 Frontend Layer

Main UI and pages are under `pfsd/src/`.

Key responsibilities:
- Collect user input from chat and tools
- Send requests to local backend client (`pfsd/src/api/localApiClient.js`)
- Render assistant responses, sentiment, and feature outputs
- Prevent request race conditions in chat flow

Chat page implementation (`pfsd/src/pages/Chat.jsx`) includes:
- Input + send handling
- Camera/mic helper features
- Serialized request handling to avoid message mismatch
- Typing state and response rendering

### 4.2 Backend Layer

Main API entrypoint:
- `backend/server.js`

Primary chat route:
- `backend/routes/chat.js`

Core chat behavior includes:
- Context window management
- Intent detection
- Follow-up resolution for short replies
- Sentiment and emotion mapping
- LLM generation attempt
- Deterministic fallback response when providers fail or output is generic

### 4.3 AI Provider Strategy

Provider logic is centralized in backend AI modules.

Runtime behavior:
1. Try local-first model path (Ollama)
2. Apply timeout for responsiveness
3. Try configured external providers
4. Use reliable fallback generation when needed

This design ensures the chatbot still responds meaningfully when cloud APIs are slow, unavailable, or quota-limited.

## 5. Chat Intelligence Implementation

The chat system is implemented with layered decision logic:

1. Input Validation
- Reject empty messages
- Crisis keyword detection path available

2. Context Building
- Use recent messages window
- Avoid unbounded history growth

3. Intent Detection
- Detect structured intent classes (game/study/support/general)
- Return direct responses for simple intent routes when appropriate

4. Follow-up Resolution
- Handle short user replies (`yes`, `2`, `first`, etc.) against the latest assistant context
- Continue the active conversation thread instead of resetting topic

5. LLM + Fallback
- Generate with provider pipeline
- Replace low-quality/generic replies with grounded fallback output
- Return normalized response payload to frontend

## 6. Sentiment and Emotion Flow

Sentiment analysis and emotion mapping are handled in backend utilities:
- Keyword + score-based detection
- Emotion categorization (`stress`, `sad`, `happy`, `neutral`, etc.)
- Context-aware suggestion shaping

Used by:
- Chat responses
- Insights and analysis features
- Report generation support

## 7. Feature Modules (Backend)

Routes include modules for:
- Chat
- Mood and analytics
- AI insights
- Forecasting
- Notifications
- Reports
- Decision helper
- Trigger analysis

Most modules are designed with fallback behavior so local development remains functional.

## 8. Local Development Setup

### 8.1 Prerequisites

Install:
- Node.js (LTS recommended)
- npm
- Ollama (optional but recommended for local AI)
- Python (for Django backend, optional in base frontend/backend run)

### 8.2 Install Dependencies

From repository root:

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd ../pfsd
npm install
```

Django backend (optional):
```bash
cd ../django-backend
pip install -r requirements.txt
```

### 8.3 Run Application

Terminal 1 (backend):
```bash
cd backend
npm start
```

Terminal 2 (frontend):
```bash
cd pfsd
npm run dev
```

Frontend URL:
- `http://localhost:5173`

Backend URL:
- `http://localhost:5000`

### 8.4 Ollama Setup (Recommended)

```bash
ollama pull llama3.2:1b
ollama serve
```

When available, backend prefers local Ollama before other providers.

## 9. Environment Configuration

Use backend environment settings for provider keys and runtime behavior.

Common variables (depending on enabled providers):
- `MONGODB_URI`
- `SURREALDB_URL`
- `SURREALDB_USER`
- `SURREALDB_PASS`
- `SURREALDB_NS`
- `SURREALDB_DB`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- Any other provider-specific keys in backend integrations

If keys are missing/unavailable, fallback paths still allow chat responses.

### 9.1 MongoDB Atlas Integration (Now Active)

Chat persistence is now connected to MongoDB Atlas through Mongoose.

Current behavior:
- Backend initializes MongoDB on startup.
- Chat messages are stored in `chat_conversations`.
- Session summaries are stored in `session_analytics`.
- `/api/health` reports real Mongo connection status.

Where to check in Atlas:
- Cluster: `shopverse`
- Database: `shopverse`
- Collections:
	- `chat_conversations`
	- `session_analytics`

### 9.2 SurrealDB Integration

SurrealDB remains configured as an optional store for app entities and alerts.

Current behavior:
- Backend attempts SurrealDB connection on startup.
- If unavailable, server automatically falls back to in-memory mode.
- `/api/health` reports SurrealDB connection and fallback status.

## 10. Reliability and Fallback Behavior

Expected runtime behavior:
- SurrealDB initialization may fail in local setups; server falls back to in-memory storage
- If cloud AI providers fail, chat still responds using deterministic fallback logic
- Chat follow-up handling keeps conversation coherent for short replies

## 11. Deployment Notes

For production hardening:
- Replace in-memory fallback with persistent production DB
- Add auth/user session controls if needed
- Add centralized logging/monitoring
- Configure provider secrets via secure env management
- Add rate limiting and API security middleware

## 12. Current State

Repository includes:
- Full frontend and backend implementation
- Chat reliability improvements
- Context/follow-up handling updates
- MongoDB Atlas-backed chat persistence
- Database health diagnostics in API health endpoint
- Documentation for quick start and setup

If you are starting fresh, read this file first, then use `QUICK_START.md` for a fast run path.
