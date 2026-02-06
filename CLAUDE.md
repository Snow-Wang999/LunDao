# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LunDao (论道) is a multi-model AI brainstorming chat application where multiple AI models discuss topics sequentially, with one model acting as a "recorder" to maintain discussion summaries. Models are called in series so each can see previous responses.

## Development Commands

### Frontend (client/)
```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript + Vite production build
```

### Backend (server/)
```bash
npm run dev       # Watch mode with tsx (port 3001)
npm run build     # TypeScript compilation
npm start         # Run compiled JavaScript
```

Run both terminals simultaneously for development. Frontend proxies `/api/*` to the backend.

## Architecture

### Sequential Model Execution
Models are called in series via async generators. Each model receives:
1. Compressed history (outline + last 5 rounds)
2. All previous responses in current round
3. User's message with any command injection

### Core Components

**Backend Services:**
- `router.ts` - Parses user commands (`@all`, `@深入`, `@挑战`, etc.) and determines model participation
- `orchestrator.ts` - Executes sequential model calls, yields SSE events
- `storage.ts` - File-based session persistence (sessions.json + Markdown files)

**Model Adapters (server/src/adapters/):**
- Abstract `BaseAdapter` class with `sendMessage()` returning `AsyncGenerator<string>`
- Implementations: ZhipuAdapter (GLM), KimiAdapter (Moonshot), QwenAdapter (Alibaba)
- All use OpenAI-compatible chat completions format

**Frontend Hooks:**
- `useChat.ts` - SSE connection management, manual stream parsing (not EventSource API)

### SSE Event Flow
```
POST /api/chat → model_start → model_chunk* → model_done → (repeat for each model) → round_done
```

### Context Compaction (Recorder Pattern)
After each round, recorder model (GLM by default) generates:
```typescript
interface DiscussionRecord {
  outline: { topic, keyDecisions[], openQuestions[], directionChanges[] };
  recentRounds: RoundSummary[];  // Last 5 rounds, older merged into outline
}
```

## Command System

| Command | Effect |
|---------|--------|
| `@all {content}` | Reset discussion, all models reply |
| `@深入 {content}` | Deep multi-dimensional analysis |
| `@挑战 {content}` | Critical/adversarial review |
| `@总结` | Recorder outputs full summary |
| `@跳过 {model}` | Exclude model from round |
| `@{model} {content}` | Only specified model replies |
| No prefix | All models reply (default) |

## Configuration

Environment variables in `server/.env`:
- `ZHIPU_API_KEY`, `MOONSHOT_API_KEY`, `DASHSCOPE_API_KEY` - Model API keys
- `RECORDER_MODEL` - Which model records summaries (default: glm)
- `DEFAULT_MODEL_ORDER` - Comma-separated model order

## Data Storage

- `server/data/sessions.json` - Session metadata
- `server/data/{sessionId}.md` - Full discussion transcripts

## Key Constraints

- Models must be called serially (not parallel) - later models need to see earlier responses
- max_tokens limited to ~1000 per model to control costs
- Single model failure should not block the round
- UI is primarily in Chinese
