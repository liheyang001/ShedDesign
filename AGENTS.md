# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

ShedDesign is an AI-powered web app where users upload a garden photo/blueprint, answer a questionnaire, and receive AI-generated shed placement recommendations with 3D visualization.

**Three-step user flow:** Upload & Analyze → Questionnaire → 3D Design Result

## Commands

### Development (run both simultaneously)
```bash
# From repo root — starts frontend (port 5173) and backend (port 5000)
npm run dev

# Or individually:
cd backend && npm run dev    # tsx watch src/index.ts
cd frontend && npm run dev   # vite
```

### Type checking
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

### Build
```bash
npm run build   # builds both workspaces
```

## Architecture

This is an **npm workspaces monorepo** with `frontend/` and `backend/` as workspace packages. Both use **ESM modules** (`"type": "module"` in package.json).

### Backend (`backend/src/`)

Express REST API with a flat `routes → controllers → services` pattern:

- `config/env.ts` — all env vars (`PORT`, `GEMINI_API_KEY`, etc.) loaded from dotenv
- `types/garden.ts` — shared TypeScript interfaces: `GardenAnalysis`, `UserPreferences`, `DesignRecommendation`, `UploadResponse`
- `routes/upload.ts` — multer middleware (memoryStorage, 5MB limit) + route definitions
- `controllers/uploadController.ts` — saves image to `backend/uploads/` with UUID filename, calls analyzer
- `services/imageAnalyzer.ts` — calls `gemini-1.5-flash` with base64 image; falls back to mock data if `GEMINI_API_KEY` is unset

**Critical:** Backend imports must use `.js` extensions (e.g., `import foo from './foo.js'`) even for `.ts` source files — this is required by Node ESM with `"moduleResolution": "bundler"`. The backend runs with `tsx watch` (not ts-node).

### Frontend (`frontend/src/`)

React 18 + Vite + TypeScript SPA:

- `App.tsx` — top-level state machine with `AppStep = 'upload' | 'questionnaire' | 'result'`. Holds `imageId` and `analysis` after upload completes.
- `pages/UploadPage.tsx` — wraps `ImageUpload` component, displays `GardenAnalysis` results, fires `onAnalysisComplete`
- `components/ImageUpload.tsx` — file picker with preview, calls `uploadGardenImage()` API
- `services/api.ts` — axios instance with `VITE_API_URL` base URL (default `http://localhost:5000`)
- `types/garden.ts` — mirrors backend types (maintained in sync manually)

Styles live in `frontend/src/styles/` as per-component CSS files imported directly into components.

### Data Flow

```
User uploads image
  → POST /api/upload (multipart/form-data, field: "image")
  → backend saves to uploads/, calls Gemini Vision
  → returns { imageId, filename, analysis: GardenAnalysis }
  → App.tsx transitions to 'questionnaire' step

User completes questionnaire (Phase 6 — not yet built)
  → POST /api/questionnaire
  → POST /api/generate-recommendation
  → returns DesignRecommendation
  → App.tsx transitions to 'result' step

Result page renders 3D scene (Phase 8-9 — not yet built)
  → Three.js + React Three Fiber
```

## Environment Setup

Copy `.env.example` to `backend/.env` and set:
```
GEMINI_API_KEY=your_key_here   # Get from Google AI Studio
PORT=5000
NODE_ENV=development
```

Frontend reads `VITE_API_URL` from `frontend/.env` (defaults to `http://localhost:5000` if unset).

Without `GEMINI_API_KEY`, the backend returns hardcoded mock `GardenAnalysis` data — the app is fully functional for UI development without an API key.

## Implementation Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1-3 | Project scaffold, frontend/backend init | ✅ Done |
| 4 | Backend: image upload + Gemini analysis | ✅ Done |
| 5 | Frontend: upload UI + analysis display | ✅ Done |
| 6 | Questionnaire form (React Hook Form) | 🔲 Next |
| 7 | AI recommendation engine (Gemini Chat) | 🔲 Pending |
| 8 | Three.js 3D garden scene | 🔲 Pending |
| 9 | 3D interactive editing | 🔲 Pending |
| 10 | Project save/export | 🔲 Pending |

## Key Type Interfaces

`GardenAnalysis` (from Gemini Vision) and `DesignRecommendation` (from Gemini Chat) are the core data contracts. Both are defined in `backend/src/types/garden.ts` and duplicated in `frontend/src/types/garden.ts`. Keep them in sync when modifying.
