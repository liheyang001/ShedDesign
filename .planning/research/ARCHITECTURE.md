# Architecture Patterns

**Domain:** AI-powered SaaS — garden shed placement with 3D visualization
**Researched:** 2026-05-19
**Confidence:** HIGH (existing codebase read, stack confirmed, all libraries already installed)

---

## Recommended Full Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite, port 5173)                    │
│                                                                        │
│  Auth Layer         Core Pages           3D Scene                      │
│  LoginPage          UploadPage           <Canvas>                      │
│  SignupPage         QuestionnairePage      <PerspectiveCamera>         │
│  PasswordReset      ResultPage             <ambientLight>              │
│                                            <directionalLight>          │
│  Services                                  <OrbitControls>             │
│  api.ts (axios)                            <GardenPlane>               │
│  auth.ts (JWT)                             <ShedModel>                 │
│                                            <ShadowHelper>              │
│  Context                                 </Canvas>                     │
│  AuthContext (user, token, logout)                                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  HTTP + Bearer token
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   Express Backend (port 5000)                          │
│                                                                        │
│  Public Routes          Auth Middleware         Protected Routes       │
│  POST /api/auth/signup  verifyJWT()             POST /api/upload       │
│  POST /api/auth/login   (reads Authorization    POST /api/questionnaire│
│  POST /api/auth/refresh  header, validates      POST /api/recommend    │
│  POST /api/stripe/webhook  token, attaches      GET  /api/projects     │
│  (raw body, stripe sig)  req.user)              POST /api/projects     │
│                                                 GET  /api/projects/:id │
│  Controllers                                                           │
│  authController.ts       projectController.ts                          │
│  stripeController.ts     recommendController.ts                        │
│                                                                        │
│  Services                                                              │
│  authService.ts          stripeService.ts                              │
│  imageAnalyzer.ts        recommendationService.ts                      │
│  projectService.ts                                                     │
│                                                                        │
│  Database Layer                                                        │
│  db/schema.ts (Drizzle)  db/index.ts (pg pool)  db/migrations/        │
└─────────────────────────┬─────────────────────────────────────────────┘
                          │
          ┌───────────────┼──────────────────────┐
          ▼               ▼                      ▼
    PostgreSQL      Google Gemini           Stripe API
    (Drizzle ORM)   (1.5 Flash)             (webhooks)
```

---

## Component Responsibilities

| Component | Responsibility | Location |
|-----------|---------------|----------|
| `AuthContext` | Holds JWT token + user object in React context, exposes `login()`, `logout()`, `refreshToken()` | `frontend/src/context/AuthContext.tsx` |
| `ProtectedRoute` | HOC wrapper: redirects to `/login` if no valid token | `frontend/src/components/ProtectedRoute.tsx` |
| `authController` | Signup, login, refresh-token handlers; issues JWTs | `backend/src/controllers/authController.ts` |
| `verifyJWT` middleware | Reads `Authorization: Bearer <token>`, validates signature, attaches `req.user` | `backend/src/middleware/auth.ts` |
| `stripeController` | Checkout session creation, webhook handler (signature-verified) | `backend/src/controllers/stripeController.ts` |
| `db/schema.ts` | Drizzle table definitions: users, projects, subscriptions | `backend/src/db/schema.ts` |
| `db/index.ts` | Exports `db` instance (Drizzle + node-postgres pool) | `backend/src/db/index.ts` |
| `GardenScene` | Top-level 3D component: owns Canvas, passes scene props down | `frontend/src/components/3d/GardenScene.tsx` |
| `ShedModel` | Renders the shed geometry; receives `position`, `rotation`, `style` props | `frontend/src/components/3d/ShedModel.tsx` |
| `GardenPlane` | Ground plane + garden boundary overlay derived from `GardenAnalysis` | `frontend/src/components/3d/GardenPlane.tsx` |

---

## Auth Middleware: Where It Lives and How It Works

**Location:** `backend/src/middleware/auth.ts`

**Pattern:** JWT (jsonwebtoken) — stateless. No session store needed for v1.

```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; tier: 'free' | 'pro' };
}

export function verifyJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthRequest['user'];
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Protected routes:** Apply middleware at router level, not individually.

```typescript
// backend/src/routes/projects.ts
import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { listProjects, createProject } from '../controllers/projectController.js';

const router = Router();
router.use(verifyJWT);          // all routes in this file are protected
router.get('/', listProjects);
router.post('/', createProject);
export default router;
```

**Token strategy:**
- Access token: short-lived (15 min), stored in memory (React state / AuthContext)
- Refresh token: long-lived (7 days), stored in `httpOnly` cookie — NOT localStorage
- Refresh endpoint: `POST /api/auth/refresh` reads cookie, issues new access token

**Why not sessions?** The backend is stateless. No Redis or DB lookup on every request. Scales naturally when you add a second server later.

**Confidence:** HIGH — standard Express JWT pattern, jsonwebtoken is stable.

---

## Database Layer: Drizzle ORM

**Recommendation: Drizzle ORM with node-postgres (`pg`)**

**Why Drizzle over Prisma or Kysely:**

| Criterion | Drizzle | Prisma | Kysely |
|-----------|---------|--------|--------|
| ESM support | Native, zero issues | Requires `esm` shim config in v5+ | Native |
| TypeScript inference | Excellent — types from schema | Excellent | Excellent |
| Migration workflow | `drizzle-kit generate` + `drizzle-kit migrate` (SQL files you own) | Prisma Migrate (black box) | Manual or custom |
| Bundle size | ~7 KB minified | Heavy (Prisma client generated) | ~7 KB |
| Raw SQL escape hatch | First-class `sql` template tag | Supported but awkward | First-class |
| Learning curve | Low — schema is TypeScript | Medium — Prisma DSL | Low |
| Node ESM `.js` imports | Works without config | Needs extra `esm` setup | Works |

Drizzle is the clearest fit: it is TypeScript-first, ESM-native, has no code-generation step that conflicts with the `tsx watch` runtime, and gives you SQL files you can review and version.

**Schema structure:**

```typescript
// backend/src/db/schema.ts
import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  tier:         text('tier', { enum: ['free', 'pro'] }).notNull().default('free'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  imageId:    text('image_id'),
  analysis:   jsonb('analysis'),          // GardenAnalysis JSON blob
  preferences: jsonb('preferences'),      // UserPreferences JSON blob
  recommendation: jsonb('recommendation'), // DesignRecommendation JSON blob
  createdAt:  timestamp('created_at').notNull().defaultNow(),
  updatedAt:  timestamp('updated_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id),
  stripeCustomerId:   text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status:             text('status').notNull().default('inactive'),
  currentPeriodEnd:   timestamp('current_period_end'),
});
```

**DB instance:**

```typescript
// backend/src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

**Migration workflow:**

```
drizzle.config.ts at repo root (or backend/)
→ npx drizzle-kit generate   # produces SQL files in backend/src/db/migrations/
→ npx drizzle-kit migrate    # applies to DATABASE_URL
```

SQL migration files are committed to the repo — reviewable, reversible, no surprise changes.

**Confidence:** HIGH — Drizzle + node-postgres is the most common ESM TypeScript stack as of mid-2025. ESM compatibility is confirmed in Drizzle docs.

---

## Stripe Webhook Security Pattern

**The critical rule:** The webhook route MUST receive the raw request body (not parsed JSON). Express's `json()` middleware must NOT run before the Stripe webhook route.

**Implementation:**

```typescript
// backend/src/index.ts — order matters
import express from 'express';

const app = express();

// Stripe webhook FIRST — raw body required for signature verification
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// Then global JSON parser for all other routes
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
```

**Webhook handler:**

```typescript
// backend/src/controllers/stripeController.ts
import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,                    // Buffer — raw body
      sig,
      env.STRIPE_WEBHOOK_SECRET    // whsec_... from Stripe dashboard
    );
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle events idempotently (Stripe may retry)
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  res.json({ received: true });
}
```

**Key patterns:**
- Use `express.raw()` on the webhook route, not `express.json()`
- Always verify signature with `stripe.webhooks.constructEvent()` — never skip
- Handle events idempotently: Stripe retries failed webhooks; your handler may run twice
- Store `stripe_subscription_id` in your `subscriptions` table; look it up on every event
- Register `STRIPE_WEBHOOK_SECRET` from the Stripe CLI (`stripe listen --forward-to`) in dev, from Stripe dashboard in prod

**Confidence:** HIGH — this is Stripe's documented pattern, unchanged for years.

---

## React Three Fiber 3D Component Tree

Three.js, React Three Fiber (`@react-three/fiber`), and Drei (`@react-three/drei`) are already installed at versions `0.158.0`, `8.14.0`, and `9.99.0` respectively.

**Recommended component hierarchy:**

```
GardenScene.tsx
└── <Canvas shadows camera={{ fov: 45, position: [0, 8, 12] }}>
    ├── <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={45} />
    ├── <ambientLight intensity={0.4} />
    ├── <directionalLight
    │       position={[10, 20, 10]}
    │       intensity={1.2}
    │       castShadow
    │       shadow-mapSize={[2048, 2048]} />
    ├── <OrbitControls
    │       enablePan={false}
    │       minPolarAngle={0.2}
    │       maxPolarAngle={Math.PI / 2.2}
    │       target={[0, 0, 0]} />
    ├── <GardenPlane analysis={analysis} />
    │   └── <mesh receiveShadow rotation-x={-Math.PI / 2}>
    │           <planeGeometry args={[gardenWidth, gardenDepth]} />
    │           <meshStandardMaterial color="#4a7c3f" />
    │       </mesh>
    └── <ShedModel
            style={recommendation.shedStyle}
            position={recommendation.position}
            rotation={recommendation.rotation}
            dimensions={recommendation.dimensions}
            castShadow />
        └── <group position={position} rotation={rotation}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[w, h, d]} />
                  <meshStandardMaterial color={styleColor} />
                </mesh>
                <RoofMesh ... />
            </group>
```

**Component responsibilities:**

| Component | File | Props | Responsibility |
|-----------|------|-------|----------------|
| `GardenScene` | `3d/GardenScene.tsx` | `analysis`, `recommendation`, `onShedMove` | Owns Canvas, composes scene, exposes drag callbacks |
| `GardenPlane` | `3d/GardenPlane.tsx` | `analysis: GardenAnalysis` | Ground mesh sized from `analysis.size`, texture or color |
| `ShedModel` | `3d/ShedModel.tsx` | `style`, `position`, `rotation`, `dimensions` | Shed geometry group; `style` determines roof pitch and color |
| `ShedControls` | `3d/ShedControls.tsx` | `shed`, `onMove`, `onRotate` | Drag handles using `@react-three/drei`'s `DragControls` |
| `SceneLights` | `3d/SceneLights.tsx` | `sunDirection` from analysis | Ambient + directional light, shadow config |

**Key implementation notes:**
- Use `<Canvas shadows>` at the top level to enable shadow maps globally
- Use `<OrbitControls>` from `@react-three/drei` — it handles pointer events properly in R3F
- Restrict `maxPolarAngle` to prevent the camera going below ground
- `ShedModel` position is in world units (meters). Map `GardenAnalysis.size` meters → Three.js units 1:1 for simplicity
- For dragging: `@react-three/drei` provides `<DragControls>` that wraps mesh children with pointer event handlers. Disable `OrbitControls` while dragging via a shared `isDragging` ref

**Confidence:** HIGH — R3F 8.x API is stable. Drei 9.x `OrbitControls` and `DragControls` are well-established.

---

## Data Flow: Questionnaire → 3D Scene Configuration

This is the central data pipeline of the application.

```
GardenAnalysis (from Gemini Vision)         UserPreferences (from questionnaire)
  ├── size: { width, depth }                  ├── purpose: 'storage' | 'workshop' | 'studio'
  ├── orientation: 'north-facing' | ...        ├── preferredSize: 'small' | 'medium' | 'large'
  ├── sunlight: 'full-sun' | ...               ├── style: 'modern' | 'traditional' | 'barn'
  ├── structures: string[]                     ├── budget: number
  └── availableSpaces: SpaceCandidate[]        └── specialRequirements: string
          │                                             │
          └──────────────────┬──────────────────────────┘
                             │
                    POST /api/recommend
                    { imageId, analysisId, preferences }
                             │
                    recommendationService.ts
                    (Gemini Chat API)
                             │
                             ▼
                   DesignRecommendation
                     ├── position: { x, z }        → ShedModel position prop
                     ├── rotation: number           → ShedModel rotation-y prop
                     ├── dimensions: { w, h, d }    → ShedModel geometry args
                     ├── shedStyle: string          → ShedModel style prop
                     ├── reasoning: string          → displayed in ResultPage sidebar
                     └── warnings: string[]         → displayed as alert cards

                             │
                             ▼
                     App.tsx state
                  { step: 'result', recommendation }
                             │
                             ▼
                      ResultPage.tsx
                     ├── <GardenScene analysis={analysis} recommendation={recommendation} />
                     └── <RecommendationPanel recommendation={recommendation} />
```

**State management approach:**
- Keep App.tsx as the state machine owner for the three-step flow
- Pass `analysis` and `recommendation` as props — no global state library needed for v1
- `GardenScene` owns internal 3D drag state (`shedPosition`, `shedRotation`) via `useState`
- When user drags shed, call `onShedMove(newPosition)` callback to update App state for export

**Confidence:** HIGH — this is a direct extension of the existing App.tsx state machine pattern.

---

## File Storage: Local vs Cloud for v1

**Recommendation: Keep local `backend/uploads/` for v1**

**Rationale:**

| Factor | Local (`uploads/`) | S3 / Cloud |
|--------|--------------------|-----------|
| Setup complexity | Zero — already working | Requires AWS/GCS account, IAM, bucket policy, presigned URLs |
| Cost | Free | ~$0.023/GB/month + per-request charges |
| v1 scope | Single server, low volume | Necessary at scale |
| Risk | Files lost on server restart (Heroku, etc.) | Durable |
| Dev experience | Instant, no credentials | Extra env vars, mock setup |

**v1 constraint:** Deploy on a persistent-disk host (Railway, Render, VPS with volume mount) not Heroku ephemeral dynos. This avoids file loss without adding S3 complexity.

**Migration path:** When you outgrow local storage, add `S3_BUCKET` env var to `config/env.ts` and swap `uploadController.ts` to write via `@aws-sdk/client-s3`. The rest of the app is unchanged — controllers abstract the storage location.

**For images served to 3D scene:** The existing `GET /api/image/:imageId` endpoint already serves uploaded images. Use the image URL as a texture source in `GardenPlane` if photo-accurate texturing is desired.

**Confidence:** HIGH — this is a pragmatic v1 decision, not a technical constraint.

---

## Backend Directory Structure (target state)

```
backend/src/
├── config/
│   └── env.ts                    # Add: JWT_SECRET, STRIPE_SECRET_KEY,
│                                 #      STRIPE_WEBHOOK_SECRET, DATABASE_URL
├── db/
│   ├── index.ts                  # Drizzle db instance
│   ├── schema.ts                 # Table definitions (users, projects, subscriptions)
│   └── migrations/               # SQL files from drizzle-kit generate
├── middleware/
│   └── auth.ts                   # verifyJWT, AuthRequest type
├── routes/
│   ├── upload.ts                 # existing — add verifyJWT
│   ├── auth.ts                   # new
│   ├── projects.ts               # new — all routes use verifyJWT at router level
│   ├── stripe.ts                 # new — webhook uses express.raw()
│   └── recommend.ts              # new
├── controllers/
│   ├── uploadController.ts       # existing
│   ├── authController.ts         # new
│   ├── projectController.ts      # new
│   ├── stripeController.ts       # new
│   └── recommendController.ts    # new
├── services/
│   ├── imageAnalyzer.ts          # existing
│   ├── authService.ts            # new: bcrypt, jwt.sign/verify
│   ├── projectService.ts         # new: Drizzle queries
│   ├── stripeService.ts          # new: Stripe SDK calls
│   └── recommendationService.ts  # new: Gemini Chat for placement
└── types/
    └── garden.ts                 # existing — extend with auth types
```

## Frontend Directory Structure (target state)

```
frontend/src/
├── context/
│   └── AuthContext.tsx            # new
├── components/
│   ├── ImageUpload.tsx            # existing
│   ├── ProtectedRoute.tsx         # new
│   └── 3d/
│       ├── GardenScene.tsx        # new
│       ├── GardenPlane.tsx        # new
│       ├── ShedModel.tsx          # new
│       ├── ShedControls.tsx       # new
│       └── SceneLights.tsx        # new
├── pages/
│   ├── UploadPage.tsx             # existing
│   ├── QuestionnairePage.tsx      # new (uses react-hook-form already installed)
│   ├── ResultPage.tsx             # new
│   ├── LoginPage.tsx              # new
│   └── SignupPage.tsx             # new
├── services/
│   ├── api.ts                     # existing — add auth header injection
│   └── auth.ts                    # new: login/signup/refresh calls
└── types/
    └── garden.ts                  # existing — extend with auth types
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing JWT in localStorage

**What:** `localStorage.setItem('token', jwt)` in the frontend.
**Why bad:** XSS vulnerability — any injected script can read and exfiltrate the token.
**Instead:** Store access token in React memory (AuthContext state). Store refresh token in `httpOnly` cookie. On page refresh, call `/api/auth/refresh` to get a new access token from the cookie.

### Anti-Pattern 2: Parsing request body before Stripe webhook

**What:** Placing `app.use(express.json())` before the `/api/stripe/webhook` route.
**Why bad:** `express.json()` consumes the raw body stream. Stripe's `constructEvent()` requires the raw bytes to verify the HMAC signature. Putting JSON parsing first causes `stripe.webhooks.constructEvent()` to throw for every webhook.
**Instead:** Register the Stripe webhook route before `app.use(express.json())`, using `express.raw({ type: 'application/json' })` on that route only.

### Anti-Pattern 3: Applying verifyJWT globally

**What:** `app.use(verifyJWT)` at the app level.
**Why bad:** Blocks `/api/auth/login`, `/api/auth/signup`, and `/api/stripe/webhook` — all routes that must be public.
**Instead:** Apply `verifyJWT` at the router level in files for protected resources (projects, recommendations).

### Anti-Pattern 4: Putting GardenAnalysis + DesignRecommendation into Zustand or Redux

**What:** Lifting 3D scene state into a global store from day one.
**Why bad:** The app has a linear three-step flow. Prop drilling two levels is trivially manageable. Global state adds indirection and boilerplate for no gain in v1.
**Instead:** Keep App.tsx as the state machine. Only extract to context if prop-drilling exceeds three levels or components are siblings without a common ancestor.

### Anti-Pattern 5: One giant ShedModel component

**What:** A single `ShedModel.tsx` that handles geometry, textures, drag events, and resize handles.
**Why bad:** 3D component code grows fast. Entangled event handling and geometry makes adding shed styles painful.
**Instead:** Separate `ShedGeometry` (pure geometry from props), `ShedControls` (drag/resize event handlers), and a `ShedModel` wrapper that composes them.

---

## Scalability Considerations

| Concern | v1 (single server) | v2 (scale out) |
|---------|-------------------|----------------|
| File storage | `backend/uploads/` on persistent volume | S3 + presigned URLs |
| DB | Single PostgreSQL instance | Read replica for dashboards |
| Auth | JWT (stateless) | Same — no change needed |
| Sessions | None (JWT) | None |
| 3D rendering | Client-side (Three.js) | Same — offload to browser |
| Gemini calls | Direct from backend | Add rate-limiting + queue |

---

## Sources

- Existing codebase: `backend/src/` and `frontend/src/` (read directly — HIGH confidence)
- Drizzle ORM documentation: https://orm.drizzle.team/docs/overview (HIGH confidence — stable library)
- React Three Fiber documentation: https://r3f.pmnd.rs (HIGH confidence — R3F 8.x stable)
- Stripe webhook best practices: https://stripe.com/docs/webhooks (HIGH confidence — official Stripe docs)
- Express JWT middleware pattern: https://expressjs.com (HIGH confidence — standard Express pattern)
- Note: WebFetch/WebSearch/Bash were unavailable in this environment. All findings draw on training data (cutoff August 2025) for established, stable libraries. Stack versions confirmed from codebase read.
