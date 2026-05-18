<!-- refreshed: 2026-05-18 -->
# Architecture

**Analysis Date:** 2026-05-18

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│           Port 5173 - User-facing web application            │
├───────────────────────┬─────────────────────────────────────┤
│  Pages & Components   │       Services & Types              │
│ - UploadPage.tsx      │  - api.ts (axios client)            │
│ - ImageUpload.tsx     │  - types/garden.ts (interfaces)     │
│ - App.tsx (state)     │                                      │
└───────────────┬───────┴──────────────────┬───────────────────┘
                │                          │
                │   HTTP (multipart, JSON) │
                │   POST /api/upload       │
                │   GET /api/image/:id     │
                ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│          Express Backend (Node.js + TypeScript)              │
│            Port 5000 - REST API server                       │
├──────────────────────┬────────────────────────────────────┤
│ Routes (upload.ts)   │ Controllers (uploadController.ts)   │
│ - POST /api/upload   │ - File storage (UUID filename)      │
│ - GET /api/image/:id │ - Orchestration                     │
└──────────────┬───────┴────────────┬────────────────────────┘
               │                    │
               │                    ▼
               │            Services Layer
               │       (imageAnalyzer.ts)
               │  - Gemini Vision API call
               │  - JSON parsing
               │  - Fallback mock data
               │
               ▼
         ┌─────────────────────────────┐
         │  External Dependencies       │
         ├─────────────────────────────┤
         │  Google Generative AI SDK    │
         │  (gemini-1.5-flash model)    │
         │                              │
         │  Local File System           │
         │  (backend/uploads/)          │
         └─────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App (React) | Top-level state machine managing flow (upload → questionnaire → result) | `frontend/src/App.tsx` |
| UploadPage | Upload UI wrapper, displays analysis results, transitions flow | `frontend/src/pages/UploadPage.tsx` |
| ImageUpload | File picker component, preview, error handling | `frontend/src/components/ImageUpload.tsx` |
| api service | Axios HTTP client, upload and image retrieval endpoints | `frontend/src/services/api.ts` |
| upload routes | Express route definitions, multer middleware | `backend/src/routes/upload.ts` |
| uploadController | Request handler, file storage, orchestrates image analysis | `backend/src/controllers/uploadController.ts` |
| imageAnalyzer | Gemini Vision API integration, JSON extraction, fallback mock data | `backend/src/services/imageAnalyzer.ts` |
| config | Environment variable loading and validation | `backend/src/config/env.ts` |
| types (shared) | Data contracts: GardenAnalysis, UploadResponse, UserPreferences, DesignRecommendation | `backend/src/types/garden.ts`, `frontend/src/types/garden.ts` |

## Pattern Overview

**Overall:** Monorepo with npm workspaces. Full-stack TypeScript. React frontend consuming REST API from Express backend. Frontend manages UI state machine; backend handles image processing and external AI API calls.

**Key Characteristics:**
- ESM modules throughout (`.js` extensions required in backend imports)
- Stateless backend (each request independent)
- Client-driven state machine (frontend controls flow progression)
- Single entry point per workspace (backend: `/api`, frontend: `/`)
- Graceful fallback: returns mock analysis if Gemini API key absent

## Layers

**Frontend Presentation Layer:**
- Purpose: React components rendering user interface, file upload flow, analysis display
- Location: `frontend/src/`
- Contains: `.tsx` components, `.css` styles, React hooks
- Depends on: axios client, shared type interfaces
- Used by: End users (web browsers)

**Frontend Service Layer:**
- Purpose: HTTP API communication via axios
- Location: `frontend/src/services/api.ts`
- Contains: API client configuration, endpoint functions
- Depends on: axios, environment variables (VITE_API_URL)
- Used by: Components (via import statements)

**Frontend Type Definitions:**
- Purpose: TypeScript interfaces mirroring backend contracts
- Location: `frontend/src/types/garden.ts`
- Contains: GardenAnalysis, UploadState (partial duplication of backend types)
- Depends on: Nothing
- Used by: All frontend components and services

**Backend Route Layer:**
- Purpose: HTTP routing, request validation, multer middleware
- Location: `backend/src/routes/upload.ts`
- Contains: Express Router, multer configuration (5MB limit, memory storage)
- Depends on: controllers
- Used by: Express app entry point

**Backend Controller Layer:**
- Purpose: Request/response handling, file I/O orchestration
- Location: `backend/src/controllers/uploadController.ts`
- Contains: uploadImage handler (file save + analysis invocation), getImage handler (file retrieval)
- Depends on: services, Node.js fs/path modules
- Used by: routes

**Backend Service Layer:**
- Purpose: Business logic (AI analysis, external API integration)
- Location: `backend/src/services/imageAnalyzer.ts`
- Contains: Gemini Vision API call, base64 encoding, JSON extraction, mock fallback
- Depends on: Google Generative AI SDK, config
- Used by: controllers

**Backend Configuration:**
- Purpose: Centralized environment variable loading
- Location: `backend/src/config/env.ts`
- Contains: dotenv setup, PORT, NODE_ENV, GEMINI_API_KEY, DATABASE_URL
- Depends on: dotenv package
- Used by: imageAnalyzer, index.ts (app bootstrap)

**Backend Type Definitions:**
- Purpose: Data contracts shared with frontend
- Location: `backend/src/types/garden.ts`
- Contains: GardenAnalysis (Gemini output), UploadResponse, UserPreferences (future), DesignRecommendation (future)
- Depends on: Nothing
- Used by: Controllers, services, and exported to frontend

## Data Flow

### Primary Request Path: Image Upload & Analysis

1. **User selects image** (`frontend/src/components/ImageUpload.tsx:16-24`)
   - File picked via HTML input, preview rendered
   
2. **User submits upload** (`frontend/src/components/ImageUpload.tsx:27-46`)
   - Form submission calls `uploadGardenImage(file)` from api service
   
3. **HTTP POST multipart** (`frontend/src/services/api.ts:11-24`)
   - Axios POSTs to `http://localhost:5000/api/upload` with FormData containing image file
   - Timeout: 60 seconds
   
4. **Backend receives request** (`backend/src/routes/upload.ts:19`)
   - Multer middleware validates file (5MB max, image/* mimetype only)
   - Route handler invokes `uploadImage` controller
   
5. **File storage** (`backend/src/controllers/uploadController.ts:13-35`)
   - Generates UUID filename
   - Writes file buffer to `backend/uploads/{UUID}.{ext}`
   - Calls `analyzeGardenImage(filePath)`
   
6. **AI Analysis via Gemini** (`backend/src/services/imageAnalyzer.ts:46-79`)
   - Reads image file from disk, encodes as base64
   - Determines MIME type from file extension
   - Calls `gemini-1.5-flash` model with base64 image + analysis prompt
   - Extracts JSON from response text (regex match on `{...}`)
   - Returns parsed `GardenAnalysis` object
   - **Fallback:** If GEMINI_API_KEY unset, returns hardcoded mock analysis
   
7. **Backend returns response** (`backend/src/controllers/uploadController.ts:29`)
   - Responds with JSON: `{ imageId, filename, analysis }`
   
8. **Frontend updates state** (`frontend/src/pages/UploadPage.tsx:14-17`)
   - Receives response, stores imageId and analysis
   - Displays analysis preview (size, orientation, terrain, sunlight, structures)
   - User can click "Continue" to proceed to questionnaire step

### Secondary Flow: Image Retrieval

1. User/app requests image: GET `/api/image/{imageId}`
2. Backend searches `uploads/` directory by imageId prefix
3. Returns file via `res.sendFile()`

### State Management

**Frontend:**
- App.tsx maintains `AppState`: `{ step, imageId, analysis }`
- Transitions via `handleAnalysisComplete()` callback from UploadPage
- Step values: `'upload' | 'questionnaire' | 'result'`
- Currently only 'upload' and 'questionnaire' (placeholder) implemented

**Backend:**
- Stateless request/response model
- No session/auth (Phase 6+ feature)
- config module loads env vars once at startup

## Key Abstractions

**GardenAnalysis:**
- Purpose: Standardized garden data structure from Gemini Vision analysis
- Examples: `backend/src/types/garden.ts`, `frontend/src/types/garden.ts`
- Pattern: TypeScript interface defining garden metrics (size, orientation, sunlight, structures, available spaces, terrain, drainage)
- Used to communicate analysis results between backend and frontend

**UploadResponse:**
- Purpose: HTTP response structure for POST /api/upload
- Examples: `backend/src/types/garden.ts`
- Pattern: Object containing imageId, filename, analysis
- Mirrors HTTP response body sent to frontend

**AppState (React):**
- Purpose: Frontend application state machine
- Examples: `frontend/src/App.tsx:8-12`
- Pattern: useState hook managing step, imageId, analysis
- Determines which page/component renders

## Entry Points

**Backend:**
- Location: `backend/src/index.ts`
- Triggers: `npm run dev` (via tsx watch) or `node dist/index.js` (production)
- Responsibilities: Express app setup (CORS, JSON parser, routes), error middleware, server bootstrap on configured PORT
- Health check: GET `/health` returns `{ status, timestamp }`
- Root: GET `/` returns API version info

**Frontend:**
- Location: `frontend/src/index.tsx`
- Triggers: `npm run dev` (via Vite) or `npm run build` + serve dist/
- Responsibilities: React app mount to DOM, App component initialization
- Entry component: `App.tsx` - manages app-level state machine

**API Routes:**
- POST `/api/upload` - Image upload + Gemini analysis
- GET `/api/image/:imageId` - File retrieval
- (Future) POST `/api/questionnaire` - User preferences submission
- (Future) POST `/api/generate-recommendation` - AI design generation

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. Multer streams image to memory (5MB limit). No worker threads used.
- **Global state:** 
  - `config` module (backend/src/config/env.ts) loads environment once at startup - effectively a singleton
  - No shared mutable state beyond Express app instance
- **Circular imports:** None detected. Routes → Controllers → Services → Config → no reverse dependencies
- **Type synchronization:** `GardenAnalysis` defined in both `backend/src/types/garden.ts` and `frontend/src/types/garden.ts` - must be kept in sync manually
- **Module system:** ESM throughout. Backend requires `.js` extensions in imports (TypeScript transpiles `.ts` → `.js`, Node resolution requires explicit extension with `"moduleResolution": "bundler"`)
- **File storage:** Uses local filesystem (`backend/uploads/`). No cloud storage (planned for Phase 10)
- **External API dependency:** Gemini API key required for analysis. Application functions with mock data if key absent - graceful degradation

## Anti-Patterns

### Duplicate Type Definitions

**What happens:** `GardenAnalysis` interface defined in both `backend/src/types/garden.ts` and `frontend/src/types/garden.ts`

**Why it's wrong:** Manual sync required; changes in one file create inconsistency risk. Violates DRY principle.

**Do this instead:** In future phases, consider:
1. Monorepo shared types package (`packages/types/`) imported by both
2. Or generate frontend types from backend via TypeScript compiler API
3. Reference: Move shared types to `frontend/src/types/shared.ts` and import in both workspaces if monorepo linking is available

### Mock Data Hardcoded in Service

**What happens:** `imageAnalyzer.ts:30-44` contains hardcoded fallback analysis array

**Why it's wrong:** Mutable test data lives in production code; difficult to update fixtures across phases

**Do this instead:** 
1. Move mock data to separate file: `backend/src/services/mockData.ts`
2. Separate development-only mocks from core service logic
3. Reference: `backend/src/services/imageAnalyzer.ts:30` imports from separate fixture

### Weak Type Contract Between Frontend & Backend

**What happens:** Frontend `GardenAnalysis` uses `string` for sunlight values; backend uses union type `'full-sun' | 'partial-sun' | 'partial-shade' | 'shade'`

**Why it's wrong:** Frontend cannot validate Gemini responses; accepts any string, runtime errors possible

**Do this instead:**
1. Keep strict union types in shared `GardenAnalysis`
2. Add validation layer in uploadController: `validateGardenAnalysis(parsed)` before response
3. Reference: `backend/src/services/imageAnalyzer.ts:78` returns typed object—extend to controller

## Error Handling

**Strategy:** Try-catch at handler level; error middleware at app level.

**Patterns:**
- Controllers wrap async operations in try-catch (`backend/src/controllers/uploadController.ts:13-35`)
- Express error middleware catches uncaught errors, responds with 500 + development env details (`backend/src/index.ts:25-30`)
- Multer fileFilter pre-validates mimetype; unsupported files rejected before handler
- Frontend catches upload errors via axios, displays user-friendly message (`frontend/src/components/ImageUpload.tsx:40-42`)
- Graceful fallback: Missing GEMINI_API_KEY triggers console warning + returns mock data (no error thrown)

**Gap:** No validation of Gemini response JSON structure—if API response malformed, JSON.parse() throws unhandled error

## Cross-Cutting Concerns

**Logging:** 
- Backend: console.log/warn/error throughout (no structured logger)
- Example: `backend/src/config/env.ts:15` warns if GEMINI_API_KEY absent
- Example: `backend/src/index.ts:39-40` logs startup info
- No centralized log aggregation

**Validation:**
- Multer validates file type (image/*) and size (5MB max)
- No schema validation on Gemini response JSON (accepts any parsed object matching rough shape)
- Frontend validates file presence before upload
- No formal request body schema validation

**Authentication:**
- Not implemented (Phase 6+ feature)
- No middleware guards on endpoints
- All routes publicly accessible

---

*Architecture analysis: 2026-05-18*
