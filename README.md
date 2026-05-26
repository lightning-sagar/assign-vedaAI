# VedaAI Assessment Creator

An AI-powered assessment creator inspired by the supplied VedaAI Figma screens. Teachers can configure an assignment, queue AI generation, watch real-time progress, review the structured paper, regenerate it, and download a formatted PDF.

## Tech Stack

- Frontend: Next.js, TypeScript, Zustand, WebSocket client
- Backend: Node.js, Express, TypeScript
- Storage: MongoDB for assignments and generated papers
- Jobs: Redis + BullMQ for AI generation and PDF export
- AI: Groq-backed structured prompt builder with schema-safe generation and a deterministic fallback

## Architecture

1. The teacher submits assignment details from the Next.js UI.
2. Express validates the request and stores a pending assignment in MongoDB.
3. A BullMQ generation job is queued in Redis.
4. The worker converts teacher input into a structured prompt, calls Groq when `GROQ_API_KEY` is available, parses the result into the app schema, and stores the generated paper.
5. WebSocket events push `queued`, `processing`, `completed`, and `failed` states to the frontend.
6. The output page renders the paper from structured JSON, never raw LLM text.

## Run Locally

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000`

MongoDB and Redis run through Docker Compose:

```bash
docker compose up -d
docker compose down
```

The backend still starts with in-memory fallbacks if MongoDB or Redis are unavailable, so the UI can be reviewed quickly.

Set `GROQ_API_KEY` in `.env` to enable live AI generation. Without it, the backend uses the deterministic fallback generator.

## Useful Scripts

```bash
npm run typecheck
npm run build
npm run lint
```

## Implementation Notes

- Validation prevents empty titles, missing due dates, and negative question or mark values.
- Zustand owns the assignment form, generated result, and WebSocket lifecycle.
- Question sections are grouped by type and difficulty with exam-paper styling.
- PDF download is generated server-side through a queue-backed endpoint instead of printing raw HTML.
