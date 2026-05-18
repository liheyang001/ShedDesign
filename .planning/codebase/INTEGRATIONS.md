# External Integrations

**Analysis Date:** 2026-05-18

## APIs & External Services

**Google Generative AI (Gemini Vision):**
- Service: Google Generative AI - Gemini 1.5 Flash model for image vision analysis
  - What it's used for: Analyzes uploaded garden images to extract structure, sunlight, terrain, and available space information
  - SDK/Client: `@google/generative-ai` 0.21.0
  - Auth: `GEMINI_API_KEY` environment variable
  - Implementation: `backend/src/services/imageAnalyzer.ts`
  - Model: `gemini-1.5-flash`
  - Endpoint: Google Cloud Generative AI API
  - Request format: Base64-encoded image + JSON analysis prompt
  - Fallback: If API key not set or API fails, returns mock `GardenAnalysis` data

## Data Storage

**Databases:**
- **Status:** Not yet implemented
- **Planned:** PostgreSQL database (optional connection configured via `DATABASE_URL`)
- **Current state:** `.env.example` includes `DATABASE_URL=postgresql://user:password@localhost:5432/sheddesign` as template
- **ORM/Client:** Not yet selected (planned for future phases)

**File Storage:**
- **Type:** Local filesystem only
- **Location:** `backend/uploads/` directory (referenced in controller logic)
- **Purpose:** Temporary storage of uploaded garden images
- **File naming:** UUID-based filenames to prevent collisions
- **Supported formats:** `.jpg`, `.jpeg`, `.png`, `.webp`
- **Upload middleware:** Multer with memory storage (5MB max file size)
- **File read:** `fs.readFileSync()` to convert to base64 for Gemini API

**Caching:**
- Not implemented
- No Redis or in-memory cache configured

## Authentication & Identity

**Auth Provider:**
- Custom implementation (planned for future phases)
- **Current state:** No authentication middleware in place
- Application is publicly accessible without credentials
- API endpoints do not require authentication tokens
- Future: Consider implementing user authentication for save/export features (Phase 10)

## Monitoring & Observability

**Error Tracking:**
- Not configured
- Future: Consider Sentry or similar service for production

**Logs:**
- **Approach:** Console logging (`console.log`, `console.warn`, `console.error`)
- **Format:** Plain text with emoji prefixes for visual clarity
- **Samples:**
  - `console.log('🚀 ShedDesign API Server 运行在 http://localhost:${config.port}')` - Server startup
  - `console.warn('⚠️ GEMINI_API_KEY 未设置，某些功能将不可用')` - Missing API key
  - `console.error('Error:', err)` - Error middleware
- **Structured logging:** Not implemented

## CI/CD & Deployment

**Hosting:**
- Not configured
- Targets: Local development or self-hosted deployment
- Frontend: Static site (requires web server or CDN)
- Backend: Node.js application server

**CI Pipeline:**
- Not configured
- Placeholder test script exists: `npm run test` (runs Vitest in both workspaces)

**Deployment artifacts:**
- Backend: Compiled TypeScript in `backend/dist/`
- Frontend: Vite build output in `frontend/dist/`

## Environment Configuration

**Required env vars (backend):**
- `GEMINI_API_KEY` - Google Generative AI API key (critical for image analysis)
- `PORT` - Server port (defaults to 5000)
- `NODE_ENV` - Environment mode (defaults to 'development')
- `API_URL` - Backend API base URL (defaults to http://localhost:5000)

**Optional env vars (backend):**
- `DATABASE_URL` - PostgreSQL connection string (for future database integration)

**Frontend env vars:**
- `VITE_API_URL` - Backend API base URL (defaults to http://localhost:5000)
- Must be prefixed with `VITE_` to be exposed to frontend bundle

**Secrets location:**
- `.env` file (not committed to git)
- Reference: `.env.example` shows all available variables
- Dev environment: Can use mock data without `GEMINI_API_KEY`
- Prod environment: Must provide valid API keys

## API Endpoints

**Backend REST API:**

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| POST | `/api/upload` | Upload garden image | multipart/form-data (field: "image") | `{imageId, filename, analysis}` |
| GET | `/api/image/:id` | Retrieve uploaded image | - | Image file binary |
| GET | `/health` | Health check | - | `{status: "ok", timestamp}` |
| GET | `/` | Root info | - | `{message, version}` |

**Planned endpoints (not yet implemented):**
- `POST /api/questionnaire` - Submit user questionnaire responses (Phase 6)
- `POST /api/generate-recommendation` - Generate AI shed design recommendation (Phase 7)

**Frontend API Client:**
- Location: `frontend/src/services/api.ts`
- Framework: Axios with 60-second timeout
- Base URL: Configured via `VITE_API_URL` or defaults to `http://localhost:5000/api`
- CORS: Enabled on backend via `cors()` middleware

## Webhooks & Callbacks

**Incoming:**
- Not implemented
- Future: Consider webhook receivers for third-party integrations (e.g., image processing services, email notifications)

**Outgoing:**
- Not implemented
- Future: Could send completion notifications or export triggers to external services

## Cross-Origin Configuration

**CORS:**
- Enabled globally on backend via `cors()` middleware
- No origin restrictions (accepts requests from any origin)
- Supports credentials: Default behavior

**Dev Server Proxy:**
- Frontend Vite dev server proxies `/api/*` requests to backend
- Configured in `frontend/vite.config.ts`
- Target: `VITE_API_URL` environment variable
- Purpose: Avoids CORS issues during local development

---

*Integration audit: 2026-05-18*
