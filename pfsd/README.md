# MindfulAI Frontend

Frontend for the MindfulAI wellness chatbot and AI insights platform.

## Local Setup

1. Go to the frontend folder:

```bash
cd pfsd
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Full App Run (Frontend + Backend)

Use two terminals from the repository root:

Terminal 1 (backend):

```bash
cd backend
npm install
npm start
```

Terminal 2 (frontend):

```bash
cd pfsd
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## Ollama Setup (Local LLM)

1. Install Ollama from https://ollama.com
2. Pull a model:

```bash
ollama pull llama3.2:1b
```

3. Run Ollama (if not already running):

```bash
ollama serve
```

The backend is configured to try Ollama first, then fallback providers.

## Notes

- If SurrealDB initialization fails, backend falls back to in-memory storage.
- For chat quality, keep backend and frontend both running before testing.
