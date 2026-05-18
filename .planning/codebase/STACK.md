# Technology Stack

**Analysis Date:** 2026-05-18

## Languages

**Primary:**
- TypeScript 5.3.3 - Full codebase (backend and frontend)
- JavaScript - Generated output and configuration files

**Secondary:**
- JSX/TSX - React components (`frontend/src/components/`, `frontend/src/pages/`)
- CSS - Component styling (`frontend/src/styles/`)

## Runtime

**Environment:**
- Node.js 20+ (inferred from `@types/node: ^20.10.0`)
- Browser - Chrome/Firefox/Safari (React 18 SPA via Vite)

**Package Manager:**
- npm 10+ (inferred from workspace configuration)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Express 4.18.2 - REST API server (`backend/src/`)
- React 18.2.0 - UI framework (`frontend/src/`)
- Vite 5.0.0 - Frontend build tool and dev server

**Build/Dev:**
- tsx 4.7.0 - TypeScript runner for Node (`backend/`)
- TypeScript 5.3.3 / 5.2.2 - Language and type checking
- @vitejs/plugin-react 4.2.0 - React integration for Vite

**Testing:**
- Vitest (configured in both workspaces via `"test": "vitest"`)

## Key Dependencies

**Critical:**
- @google/generative-ai 0.21.0 - Google Gemini Vision API client for image analysis (`backend/src/services/imageAnalyzer.ts`)
- react-hook-form 7.48.0 - Form state management for questionnaire (`frontend/src/`)
- axios 1.6.0 - HTTP client for API requests (`frontend/src/services/api.ts`)

**Infrastructure:**
- express 4.18.2 - Web server framework
- cors 2.8.5 - Cross-Origin Resource Sharing middleware
- multer 1.4.5-lts.1 - File upload middleware with memory storage (5MB limit) (`backend/src/routes/upload.ts`)
- uuid 9.0.1 - UUID generation for uploaded image filenames
- dotenv 16.3.1 - Environment variable loading from `.env` files

**3D Graphics:**
- three 0.158.0 - 3D graphics library for garden visualization
- @react-three/fiber 8.14.0 - React renderer for Three.js
- @react-three/drei 9.99.0 - Utilities and helpers for React Three Fiber

## Configuration

**Environment:**
- Backend: `.env` file (required fields: `GEMINI_API_KEY`, `PORT`, `NODE_ENV`, `API_URL`)
- Frontend: `VITE_API_URL` environment variable (defaults to `http://localhost:5000`)
- Reference template: `.env.example` (includes optional `DATABASE_URL` for future use)

**Backend Config:**
- `backend/src/config/env.ts` - Centralized environment variable loading and validation
- Warns if `GEMINI_API_KEY` is not set; API still functions with mock data fallback

**Frontend Config:**
- `frontend/vite.config.ts` - Vite configuration with React plugin, path alias (`@/`), dev server proxy to backend
- `frontend/tsconfig.json` - JSX support, strict mode enabled

**Backend Config:**
- `backend/tsconfig.json` - ES2020 target, module resolution for ESM, path alias (`@/`)
- Configured for Node ESM with `"type": "module"` in package.json

## Build Output

**Backend:**
- Output directory: `backend/dist/`
- Entry point: `dist/index.js` (from `backend/src/index.ts`)
- Build command: `tsc` (TypeScript compilation)
- Start command: `node dist/index.js`

**Frontend:**
- Output directory: `frontend/dist/`
- Build command: `tsc --noEmit && vite build`
- Preview command: `vite preview`

## Monorepo Structure

**Workspace Configuration:**
- Root `package.json` with npm workspaces at `frontend/` and `backend/`
- Both packages use `"type": "module"` for ESM support
- Shared scripts: `npm run dev` (starts both), `npm run build`, `npm run test`

**Backend package:** `sheddesign-backend`
- Location: `i:/AI/ShedDesign/backend/`
- Main entry: `backend/src/index.ts`

**Frontend package:** `sheddesign-frontend`
- Location: `i:/AI/ShedDesign/frontend/`
- Main entry: `frontend/src/App.tsx`

## Development Server

**Backend:**
- Port: 5000 (configurable via `PORT` env var)
- Watch mode: `tsx watch src/index.ts`
- Endpoints:
  - `GET /` - Root info endpoint
  - `GET /health` - Health check
  - `POST /api/upload` - Image upload endpoint (multipart/form-data)
  - `404` - Default 404 handler

**Frontend:**
- Port: 5173 (Vite default)
- Dev server proxy: `/api` routes proxy to backend at `VITE_API_URL`
- Hot module replacement (HMR) enabled by default

## Platform Requirements

**Development:**
- Node.js 20+ with npm 10+
- Modern browser (Chrome, Firefox, Safari, Edge)
- 2GB+ free disk space for node_modules

**Production:**
- Node.js 20+ runtime for backend
- Static hosting or CDN for frontend build output (`frontend/dist/`)
- Google Gemini API credentials (free tier available at Google AI Studio)
- Optional: PostgreSQL database (planned for future phases)

---

*Stack analysis: 2026-05-18*
