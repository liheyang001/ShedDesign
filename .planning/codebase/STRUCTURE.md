# Codebase Structure

**Analysis Date:** 2026-05-18

## Directory Layout

```
sheddesign/                          # Monorepo root
├── backend/                         # Express REST API (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts                 # App entry, server bootstrap
│   │   ├── config/
│   │   │   └── env.ts               # Environment config (dotenv)
│   │   ├── routes/
│   │   │   └── upload.ts            # Route definitions + multer setup
│   │   ├── controllers/
│   │   │   └── uploadController.ts  # Request handlers (file save + orchestration)
│   │   ├── services/
│   │   │   └── imageAnalyzer.ts     # Gemini Vision API integration
│   │   └── types/
│   │       └── garden.ts            # Data contracts (GardenAnalysis, etc.)
│   ├── uploads/                     # (Generated) Uploaded image storage
│   ├── dist/                        # (Generated) Compiled JavaScript output
│   ├── package.json                 # Backend dependencies + scripts
│   └── tsconfig.json                # TypeScript configuration

├── frontend/                        # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── index.tsx                # React entry, DOM mount
│   │   ├── App.tsx                  # Top-level component (state machine)
│   │   ├── App.css                  # Global styles
│   │   ├── pages/
│   │   │   └── UploadPage.tsx       # Upload flow page wrapper
│   │   ├── components/
│   │   │   └── ImageUpload.tsx      # File picker + preview component
│   │   ├── services/
│   │   │   └── api.ts               # Axios HTTP client + endpoints
│   │   ├── styles/
│   │   │   ├── ImageUpload.css      # ImageUpload component styles
│   │   │   └── UploadPage.css       # UploadPage component styles
│   │   └── types/
│   │       └── garden.ts            # Type definitions (mirrors backend)
│   ├── public/                      # Static assets (favicon, etc.)
│   ├── dist/                        # (Generated) Vite build output
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies + scripts
│   ├── tsconfig.json                # TypeScript configuration
│   └── tsconfig.node.json           # Vite config TypeScript

├── .planning/
│   └── codebase/                    # (This directory) Analysis documents
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md

├── docs/                            # Project documentation
├── package.json                     # Monorepo workspace config
├── package-lock.json                # Dependency lockfile
├── node_modules/                    # Root workspace dependencies

└── .git/                            # Git repository
```

## Directory Purposes

**backend/src/**
- Purpose: Express backend application source code
- Contains: REST API routes, request handlers, business logic, type definitions
- Key files: `index.ts` (server), `routes/upload.ts` (endpoints), `controllers/uploadController.ts` (logic), `services/imageAnalyzer.ts` (AI integration)

**backend/src/config/**
- Purpose: Application configuration management
- Contains: Environment variable loading via dotenv
- Key files: `env.ts` (centralizes PORT, GEMINI_API_KEY, NODE_ENV, etc.)

**backend/src/routes/**
- Purpose: Express route definitions and middleware setup
- Contains: Router creation, multer middleware configuration, route handlers
- Key files: `upload.ts` (POST /api/upload, GET /api/image/:imageId)

**backend/src/controllers/**
- Purpose: HTTP request handlers and orchestration
- Contains: Request/response logic, file I/O, service invocation
- Key files: `uploadController.ts` (handles image upload and analysis requests)

**backend/src/services/**
- Purpose: Business logic and external API integration
- Contains: Gemini Vision API calls, image processing, analysis logic
- Key files: `imageAnalyzer.ts` (calls gemini-1.5-flash, parses response, fallback mock data)

**backend/src/types/**
- Purpose: TypeScript data contracts and interfaces
- Contains: Shared interface definitions (duplicated in frontend)
- Key files: `garden.ts` (GardenAnalysis, UploadResponse, UserPreferences, DesignRecommendation)

**backend/uploads/**
- Purpose: Runtime storage for uploaded images
- Contains: Image files saved with UUID filenames ({imageId}.{ext})
- Generated: Yes (created on first upload)
- Committed: No (.gitignore'd)

**backend/dist/**
- Purpose: Compiled JavaScript output
- Contains: Transpiled `.js` files and source maps
- Generated: Yes (`npm run build`)
- Committed: No

**frontend/src/**
- Purpose: React application source code
- Contains: Components, pages, services, styles, types
- Key files: `App.tsx` (app state machine), `pages/UploadPage.tsx` (upload flow), `components/ImageUpload.tsx` (file picker)

**frontend/src/pages/**
- Purpose: Full-page components representing app screens
- Contains: Page-level logic, component composition
- Key files: `UploadPage.tsx` (upload & analysis display screen)

**frontend/src/components/**
- Purpose: Reusable UI components
- Contains: Interactive components, form elements
- Key files: `ImageUpload.tsx` (file picker, preview, upload form)

**frontend/src/services/**
- Purpose: HTTP API client and utility functions
- Contains: Axios configuration, API endpoint functions
- Key files: `api.ts` (uploadGardenImage, getImageUrl functions)

**frontend/src/styles/**
- Purpose: Component-scoped CSS stylesheets
- Contains: Imported directly in corresponding component files
- Key files: `ImageUpload.css`, `UploadPage.css`, `App.css` (global)

**frontend/src/types/**
- Purpose: TypeScript type definitions
- Contains: Interface definitions (mirrored from backend)
- Key files: `garden.ts` (GardenAnalysis, UploadState interfaces)

**frontend/dist/**
- Purpose: Built frontend assets
- Contains: HTML, bundled JavaScript, CSS
- Generated: Yes (`npm run build`)
- Committed: No

## Key File Locations

**Entry Points:**
- `backend/src/index.ts`: Express server startup (listens on PORT, mounts routes)
- `frontend/src/index.tsx`: React app mount (renders App component into DOM)
- `frontend/index.html`: HTML template that references React entry point

**Configuration:**
- `backend/src/config/env.ts`: Centralized environment variables (PORT, GEMINI_API_KEY, NODE_ENV)
- `backend/.env`: (Not tracked) Environment file with secrets—copy from `.env.example`
- `frontend/.env`: (Optional) Frontend-only env vars like VITE_API_URL
- `backend/tsconfig.json`: TypeScript compiler options for backend (ESM, bundler resolution)
- `frontend/tsconfig.json`: TypeScript options for frontend (React JSX, DOM lib)

**Core Logic:**
- `backend/src/routes/upload.ts`: Route definitions (POST /api/upload, GET /api/image/:id)
- `backend/src/controllers/uploadController.ts`: Request handlers (uploadImage, getImage functions)
- `backend/src/services/imageAnalyzer.ts`: Gemini Vision API integration (analyzeGardenImage function)
- `frontend/src/App.tsx`: App-level state machine (step progression: upload → questionnaire → result)

**Testing:**
- Currently no test files present (Phase 6+)

**API Endpoints:**
- POST `/api/upload` — Multipart image upload, returns { imageId, filename, analysis }
- GET `/api/image/:imageId` — Retrieve uploaded image file
- GET `/health` — Server health check, returns { status, timestamp }
- GET `/` — API info, returns { message, version }

## Naming Conventions

**Files:**

- **Backend:**
  - Controllers: `{resource}Controller.ts` (e.g., `uploadController.ts`)
  - Services: `{resource}.ts` (e.g., `imageAnalyzer.ts`)
  - Routes: `{resource}.ts` (e.g., `upload.ts`)
  - Config: descriptive name (e.g., `env.ts`)
  - Types: `{domain}.ts` (e.g., `garden.ts`)

- **Frontend:**
  - Pages: `{PageName}.tsx` (PascalCase, e.g., `UploadPage.tsx`)
  - Components: `{ComponentName}.tsx` (PascalCase, e.g., `ImageUpload.tsx`)
  - Services: `{service}.ts` (camelCase, e.g., `api.ts`)
  - Styles: `{ComponentName}.css` (matches component name)
  - Types: `{domain}.ts` (e.g., `garden.ts`)

**Directories:**

- `src/` — Source code root
- `{feature}/` — Feature-based grouping (e.g., `routes/`, `controllers/`, `services/`, `types/`, `pages/`, `components/`, `styles/`)
- camelCase for utility/service directories (e.g., `services/`, `config/`)
- PascalCase not used for directories (only files)

**Functions:**

- camelCase: `uploadImage()`, `handleFileChange()`, `analyzeGardenImage()`
- Async functions end with action verb: `uploadImage()`, `analyzeGardenImage()`
- Handlers prefixed with `handle`: `handleFileChange()`, `handleUpload()`, `handleAnalysisComplete()`
- Callbacks prefixed with `on`: `onUploadSuccess()`, `onAnalysisComplete()`

**Variables:**

- camelCase: `isLoading`, `imageId`, `analysisData`, `fileRef`
- Boolean prefixed with `is`/`has`: `isLoading`, `hasError`
- State vars: descriptive camelCase `uploadedImageId`, `analysisData`

**Types:**

- PascalCase interfaces: `GardenAnalysis`, `UploadResponse`, `UserPreferences`, `DesignRecommendation`
- Union types lowercase with hyphens: `'full-sun' | 'partial-sun' | 'partial-shade' | 'shade'`

## Where to Add New Code

**New Feature (Questionnaire form — Phase 6):**
- Component: `frontend/src/pages/QuestionnairePage.tsx` (new file)
- Form component: `frontend/src/components/PreferenceForm.tsx` (new file)
- Styles: `frontend/src/styles/QuestionnairePage.css`, `frontend/src/styles/PreferenceForm.css`
- API: Add `postQuestionnaire()` function to `frontend/src/services/api.ts`
- Route: Add POST `/api/questionnaire` handler to `backend/src/routes/upload.ts` (or create `backend/src/routes/questionnaire.ts`)
- Controller: `backend/src/controllers/questionnaireController.ts` (new file)
- Integration: Import QuestionnairePage in `frontend/src/App.tsx`, add step handling

**New API Endpoint:**
- Route definition: Add to `backend/src/routes/` (or create new file if major feature)
- Controller handler: Add or create in `backend/src/controllers/`
- Service logic: Add to existing `backend/src/services/*.ts` or create new service file
- Types: Add interfaces to `backend/src/types/garden.ts` or new domain file

**New UI Component:**
- Single component: `frontend/src/components/{ComponentName}.tsx`
- Component styles: `frontend/src/styles/{ComponentName}.css`
- Export from containing page if not reusable, or from component index if highly reusable

**Utilities/Helpers:**
- Shared utilities: `frontend/src/services/` (e.g., `validation.ts`, `formatting.ts`)
- Backend utilities: `backend/src/services/` (business logic) or new `utils/` directory if not service-level

**Database Models (Phase 10+):**
- Create `backend/src/models/` directory
- One file per model: `backend/src/models/garden.ts`, `backend/src/models/project.ts`
- Export from `backend/src/models/index.ts` for convenient imports

**3D Scene (Phase 8-9):**
- New page: `frontend/src/pages/DesignPage.tsx`
- 3D components: `frontend/src/components/GardenScene.tsx` (React Three Fiber wrapper)
- Three.js utilities: `frontend/src/services/three/` (geometry builders, materials, etc.)
- Styles: `frontend/src/styles/DesignPage.css`

## Special Directories

**backend/uploads/:**
- Purpose: Runtime image storage
- Generated: Yes (created on first upload)
- Committed: No (.gitignore'd)
- Cleanup: Requires manual deletion or Phase 10 cleanup task

**backend/dist/:**
- Purpose: Compiled JavaScript output (production build)
- Generated: Yes (`npm run build`)
- Committed: No

**frontend/dist/:**
- Purpose: Built frontend assets (production bundle)
- Generated: Yes (`npm run build`)
- Committed: No

**node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes (`npm install`)
- Committed: No
- Workspace dependency: Root `node_modules/` serves both backend and frontend via monorepo

**.planning/codebase/:**
- Purpose: Project analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md (as generated)
- Committed: Yes (Git-tracked)

---

*Structure analysis: 2026-05-18*
