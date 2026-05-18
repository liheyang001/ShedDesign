# ShedDesign

## What This Is

ShedDesign is an AI-powered web app for English-speaking homeowners and contractors who want to plan garden shed placement. Users upload a photo of their garden, answer a short questionnaire, and receive AI-generated placement recommendations with an interactive 3D scene they can edit. The product is simple enough for first-time DIYers yet detailed enough for professional contractors presenting to clients.

## Core Value

See your shed in your actual garden in 3D — not a generic diagram, but your real space — so you can confidently commit before breaking ground.

## Requirements

### Validated

- ✓ Image upload to backend (multer, 5MB limit, memory storage) — Phase 4
- ✓ Gemini 1.5 Flash vision analysis of garden photos — Phase 4
- ✓ Mock analysis fallback when `GEMINI_API_KEY` unset — Phase 4
- ✓ React SPA with upload flow and analysis display — Phase 5
- ✓ npm workspaces monorepo (frontend + backend, both ESM TypeScript) — Phase 1-3

### Active

- [ ] User authentication — email/password signup, login, JWT sessions, password reset
- [ ] Cloud project persistence — save, load, list user's design projects
- [ ] Stripe subscription billing — monthly/annual plans, usage-gated features
- [ ] Questionnaire form — shed purpose, preferred size, style, budget, special requirements (React Hook Form)
- [ ] AI recommendation engine — Gemini Chat API generates shed placement + sizing based on analysis + questionnaire
- [ ] 3D interactive garden scene — React Three Fiber, drag to reposition shed, resize handles, camera orbit
- [ ] 3D shed models — at least 3 styles matching questionnaire selection
- [ ] Design export — PNG screenshot + PDF summary with recommendations
- [ ] Responsive UI for desktop and tablet (primary), mobile (read-only)
- [ ] Professional tier — multi-project dashboard, client-shareable links

### Out of Scope

- Mobile native app — web first; mobile browser read-only is acceptable initially
- Multi-language UI — English market only for v1 (US/UK/AU)
- BIM / CAD / DXF export — too niche for v1, adds complexity without core value
- AR camera overlay — interesting but requires native app; deferred
- Contractor marketplace / lead generation — separate product idea
- AI-generated photorealistic renders — Gemini Vision is sufficient; Stable Diffusion adds cost and latency
- Offline mode — cloud-dependent product by design

## Context

**Existing codebase state (Phases 1-5 complete):**
- Backend: `src/routes/upload.ts` → `controllers/uploadController.ts` → `services/imageAnalyzer.ts`
- Frontend: `App.tsx` state machine (`upload → questionnaire → result`), `pages/UploadPage.tsx`, `components/ImageUpload.tsx`
- Types: `GardenAnalysis`, `UserPreferences`, `DesignRecommendation` defined in both `backend/src/types/garden.ts` and `frontend/src/types/garden.ts` (manually kept in sync)
- `backend/uploads/` stores images by UUID filename

**Technical context:**
- Backend runs with `tsx watch` (not ts-node); requires `.js` extensions on all imports
- Gemini API key loaded from `backend/.env` via `config/env.ts`
- Frontend reads `VITE_API_URL` (defaults to `http://localhost:5000`)
- `react-hook-form` already installed in frontend

**User research context:**
- Target: homeowners who want a shed but don't know where to put it; contractors who want to show clients a visualization
- Key pain point with existing tools: too technical, require manual measurement input
- Differentiators: (1) AI reads the photo so no manual measurements needed, (2) accessible to non-professionals

## Constraints

- **Tech stack**: Google Gemini (locked in, API already integrated) — switching would require rewriting analysis pipeline
- **Runtime**: Node ESM with `.js` import extensions required — all new backend files must follow this pattern
- **Market**: English-language UI only for v1 — copy/i18n not a concern yet
- **Budget**: API costs (Gemini + Stripe) must be covered by subscription revenue — no free unlimited tier

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google Gemini 1.5 Flash for vision | Fast, multimodal, cost-effective; already integrated | — Pending |
| React Three Fiber for 3D | Best-in-class React 3D, good ecosystem, team familiar with React | — Pending |
| Stripe for billing | Industry standard, excellent DX, webhook-driven subscription model | — Pending |
| Accounts required (no anonymous pay) | Subscription model requires user identity; project saving adds core retention | — Pending |
| npm workspaces monorepo | Single repo for frontend+backend simplifies dev workflow | ✓ Good |
| ESM modules throughout | Modern Node.js pattern; required for tsx watch compatibility | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-19 after initialization*
