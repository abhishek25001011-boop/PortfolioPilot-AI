# PortfolioPilot AI

Turn a short personal introduction into an editable, recruiter-ready developer portfolio. PortfolioPilot is a React + TypeScript + Vite frontend with a FastAPI backend and an Ollama model adapter. Qwen Coder (`qwen-coder:latest`) is the default Ollama model; choose another installed Ollama model with `OLLAMA_MODEL`.

## Features

- Natural-language profile generation with JSON schema constrained responses and a strict no-fabrication prompt.
- Editable profile sections and project cards, section-specific regeneration, recruiter view, and a live preview.
- Five template directions, accent color controls, light/dark mode, completeness score, and browser draft persistence.
- ZIP export with static HTML, CSS, JavaScript, and deployment notes.
- Demo profile available immediately; reset it from the workspace.

## Requirements

- Node.js 20 or newer
- Python 3.10 or newer
- [Ollama](https://ollama.com/download)

## Setup

1. Install frontend dependencies: `npm install`
2. Copy `.env.example` to `.env` and adjust values if needed.
3. Pull the default model if it is not already installed: `ollama pull qwen-coder:latest`
4. Start Ollama (the desktop app normally keeps the local service running).
5. In one terminal, start the API:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   uvicorn backend.main:app --reload --port 8000
   ```

6. In another terminal, start the frontend: `npm run dev`
7. Open the Vite URL shown in the terminal. The frontend proxies `/api` calls to FastAPI.

On macOS/Linux, activate the environment with `source .venv/bin/activate`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server endpoint |
| `OLLAMA_MODEL` | `qwen-coder:latest` | Any installed Ollama model supporting chat |
| `OLLAMA_TIMEOUT_SECONDS` | `180` | Generation request timeout |
| `CORS_ORIGINS` | local Vite origins | Comma-separated browser origins allowed by FastAPI |
| `VITE_API_BASE_URL` | empty | Optional FastAPI origin for a separately hosted frontend build |

The frontend only calls the configured FastAPI service. No model credentials or API keys are sent to the browser. When generation is unavailable, the UI reports the failure and makes a conservative local draft from text the user supplied; it does not silently present that draft as AI output.

## Architecture

```text
React workspace (Vite) ── POST /api/generate ── FastAPI
        │                                      │
        ├─ localStorage draft                  ├─ validates request/profile with Pydantic
        ├─ live editable preview                ├─ sends JSON schema to Ollama /api/chat
        └─ static ZIP export                    └─ validates model response before returning
                                                       │
                                                Qwen Coder (`qwen-coder:latest`, default)
```

The provider boundary is `backend/main.py`: model name, endpoint, timeout, message construction, and Ollama transport are kept in one module. The response model uses `Profile` and `Project` Pydantic schemas, passed to Ollama as a constrained JSON schema. Add a provider adapter there to switch runtimes without changing the frontend contract. Generation instructions explicitly forbid adding unsupported facts; empty fields stay empty. Always review AI-assisted copy before publishing it.

## Deployment

### Render single-service deployment

The generated ZIP includes `index.html`, `styles.css`, and `script.js` and has no build step. Upload the extracted files to Netlify, deploy the repository root with Vercel, or enable GitHub Pages for a repository containing the files.

To deploy PortfolioPilot itself as one Render web service:

1. Push the `deployment` branch to your Git provider and create a Render Blueprint from the repository, or create a Docker web service using the included `Dockerfile`.
2. Render builds the Vite frontend into `dist/`, installs the FastAPI requirements, and runs both from the same service. The container start command binds Uvicorn to Render's `$PORT`; `/api/health` is the configured health check.
3. Keep `VITE_API_BASE_URL` unset so the frontend sends `/api/*` requests to the same service. FastAPI serves the built assets and falls back to the React entry page for client-side routes.
4. For live AI generation on Render, set `OLLAMA_BASE_URL` to an Ollama server reachable from the Render service. The local-development default `http://localhost:11434` expects Ollama on the same machine and is not reachable from a Render container. `OLLAMA_MODEL` defaults to `qwen-coder:latest`; install that model on the Ollama host. Do not put credentials in the repository; configure any required private endpoint credentials through Render environment settings.

Local development remains unchanged: start Ollama on the development machine, then run FastAPI and Vite as described in Setup. The Vite dev server continues proxying `/api` to `localhost:8000`.

## Built with Open-Source AI

Qwen Coder is an open-weight model available to run locally through Ollama. Ollama provides the local model runner and HTTP API, so the default workflow can keep portfolio prompts and drafts on your device. The adapter is model configurable and does not require a hosted AI API key.
