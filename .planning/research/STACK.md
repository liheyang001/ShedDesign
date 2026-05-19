# STACK.md — Technology Recommendations
**Date:** 2026-05-19
**Project:** ShedDesign — AI-powered garden shed planning SaaS
**Scope:** Extending existing React 18 + Express + Gemini stack with auth, billing, 3D, and persistence

---

## Current Stack (Locked)

These are installed and in production use. Do not replace.

| Layer | Package | Installed Version | Notes |
|-------|---------|-------------------|-------|
| Frontend framework | react + react-dom | ^18.2.0 | React 18 — see 3D section for version constraint impact |
| Build tool | vite + @vitejs/plugin-react | ^5.0.0 | Stay on Vite 5 |
| Language | typescript | ^5.2–5.3 | Both workspaces |
| HTTP client | axios | ^1.6.0 | Frontend API calls |
| Form library | react-hook-form | ^7.48.0 | Already installed, use for questionnaire |
| Backend framework | express | ^4.18.2 | Node ESM, tsx watch |
| AI vision | @google/generative-ai | ^0.21.0 | Gemini 1.5 Flash, locked in |
| File upload | multer | ^1.4.5-lts.1 | memoryStorage, 5MB limit |
| 3D renderer (installed) | @react-three/fiber | ^8.14.0 | Must stay on v8 — see 3D section |
| 3D helpers (installed) | @react-three/drei | ^9.99.0 | Compatible with RTF v8 |
| 3D engine (installed) | three | ^0.158.0 | Pin at 0.158 to match RTF v8 peer |

**Critical ESM constraint:** All backend imports require `.js` extensions even for `.ts` sources. All new backend files must follow this pattern.

---

## Authentication Layer

**Recommendation: jsonwebtoken + bcrypt, hand-rolled middleware, no auth framework**

Using a full auth framework (Passport.js, Auth.js) introduces unnecessary abstraction for a custom Express ESM backend. Hand-rolled JWT middleware is 60 lines, fully typeable, and has no magic.

### Strategy: Dual-token JWT (access + refresh)

- **Access token:** Short-lived (15 min), stateless, sent in `Authorization: Bearer` header
- **Refresh token:** Long-lived (7 days), stored in `HttpOnly` cookie (not localStorage — prevents XSS theft), rotated on each use
- **Password hashing:** bcrypt with cost factor 12 (industry standard, ~250ms on modern hardware)
- **No sessions:** Stateless access tokens avoid session store dependency; refresh token rotation provides revocation capability without Redis

### Packages

| Package | Version (npm latest) | Purpose | Install target |
|---------|---------------------|---------|----------------|
| jsonwebtoken | 9.0.3 | JWT sign/verify | backend |
| @types/jsonwebtoken | 9.0.10 | TypeScript types | backend devDep |
| bcrypt | 6.0.0 | Password hashing (native, faster than bcryptjs) | backend |
| @types/bcrypt | 5.0.x | TypeScript types | backend devDep |
| helmet | 8.1.0 | Security headers (XSS, HSTS, CSP) | backend |
| cookie-parser | 1.4.7 | Parse HttpOnly refresh token cookie | backend |
| express-validator | 7.3.2 | Request validation for auth routes | backend |

### Why bcrypt (native) over bcryptjs

bcryptjs is pure JS (no native binaries, easier CI). bcrypt uses native C++ bindings and is ~3x faster. For a SaaS where every login incurs hashing cost, the native version is worth the minor build complexity. Node 20+ has good native module support.

### Why NOT Passport.js

Passport's strategy pattern adds indirection without benefit for simple email/password + JWT. It has poor ESM support and requires shimming in tsx/Node ESM environments. The added complexity is net negative for a team that wants to understand the auth flow.

### Refresh Token Storage

Store refresh tokens hashed in the database (one row per session per user). This enables:
- Token revocation on logout
- "Log out all devices" functionality
- Detection of refresh token reuse (rotation attack detection)

### Auth Routes Pattern (backend)

```
POST /api/auth/register    → hash password → insert user → return tokens
POST /api/auth/login       → verify password → return tokens
POST /api/auth/refresh     → verify refresh token → rotate → return new access token
POST /api/auth/logout      → revoke refresh token → clear cookie
GET  /api/auth/me          → protected route returning current user
```

---

## Database

**Recommendation: PostgreSQL + Drizzle ORM**

### Why PostgreSQL over alternatives

| Option | Verdict | Reason |
|--------|---------|--------|
| PostgreSQL | **Recommended** | Best fit for relational user/project data; free tier available on Supabase/Railway/Neon |
| SQLite (better-sqlite3) | Dev only | Zero infra for local dev; not suitable for multi-instance production SaaS |
| MongoDB | No | Document store adds no value here; user/project data is naturally relational |
| PlanetScale (MySQL) | No | MySQL lacks some Postgres features; PlanetScale removed free tier |

### Why Drizzle ORM over Prisma

| Criterion | Drizzle | Prisma |
|-----------|---------|--------|
| ESM support | Native, no shim needed | Requires `prisma generate` + engine binary |
| Schema definition | TypeScript-first, co-located | Separate `.prisma` DSL file |
| Bundle size | Tiny (~100KB) | Large (engine binary + client ~20MB) |
| Migrations | SQL-based, predictable | Prisma Migrate (opinionated) |
| Type safety | Full inferred types | Full inferred types |
| Raw SQL escape hatch | Easy | More verbose |

Drizzle's TypeScript-first schema integrates naturally with the existing ESM + tsx monorepo. Prisma's code generation step adds friction to the `tsx watch` dev workflow.

### Packages

| Package | Version (npm latest) | Purpose | Install target |
|---------|---------------------|---------|----------------|
| drizzle-orm | 0.45.2 | ORM + query builder | backend |
| drizzle-kit | 0.31.10 | Migration CLI | backend devDep |
| pg | 8.21.0 | PostgreSQL client (node-postgres) | backend |
| @types/pg | ~8.11.x | TypeScript types for pg | backend devDep |

### Schema Shape

```
users              id, email, passwordHash, createdAt, updatedAt, tier (free|pro)
refresh_tokens     id, userId, tokenHash, expiresAt, createdAt, revokedAt
projects           id, userId, name, imageId, analysis(jsonb), questionnaire(jsonb),
                   recommendation(jsonb), createdAt, updatedAt
```

The `analysis`, `questionnaire`, and `recommendation` columns store as JSONB. PostgreSQL's JSONB is queryable and indexed, avoiding a separate document store. This matches the existing `GardenAnalysis` / `DesignRecommendation` TypeScript interfaces directly.

### Dev Workflow

Use SQLite (better-sqlite3 12.10.0) locally with Drizzle's SQLite driver for zero-setup local development. Switch to PostgreSQL (pg driver) in staging/production via `DATABASE_URL` env var. Drizzle supports both with the same schema file — only the driver import changes.

---

## Billing (Stripe)

**Recommendation: Stripe Subscriptions + Stripe Billing Portal + webhook-driven state sync**

### Package

| Package | Version (npm latest) | Install target |
|---------|---------------------|----------------|
| stripe | 22.1.1 | backend (server-side only) |
| @stripe/stripe-js | ~5.x | frontend (Stripe.js for Payment Element) |
| @stripe/react-stripe-js | ~3.x | frontend (React components for payment form) |

### Architecture Pattern

**Never handle payment logic on the frontend.** Frontend calls your backend, backend calls Stripe.

```
Frontend                  Backend                    Stripe
────────                  ───────                    ──────
Click "Upgrade"  ──────→  POST /api/billing/checkout
                          creates Checkout Session ──→ Stripe hosted page
                  ←──────  returns { url }
Redirect to url  ──────────────────────────────────→ Stripe Checkout
User pays                                             Stripe processes
                          POST /api/webhooks/stripe ←─ webhook: checkout.session.completed
                          update users.tier = 'pro'
                          ←────────── 200 OK
```

### Subscription Plans

Define two plans (monthly + annual) in Stripe Dashboard. Store `stripeCustomerId` and `stripeSubscriptionId` on the user row. Do NOT store plan state locally beyond the `tier` enum — let webhooks keep it in sync.

### Webhook Handling (critical pattern)

```typescript
// backend/src/routes/webhooks.ts
// MUST use express.raw() middleware for webhook route, NOT express.json()
// Stripe signature verification requires the raw body buffer

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  // handle event.type: 'checkout.session.completed', 'customer.subscription.deleted', etc.
});
```

**The most common Stripe webhook mistake:** applying `express.json()` globally before the webhook route. The raw body buffer is consumed and signature verification fails. Mount the raw body middleware specifically on the webhook route before the global JSON middleware.

### Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `users.tier = 'pro'`, store `stripeSubscriptionId` |
| `customer.subscription.updated` | Update tier if plan changed |
| `customer.subscription.deleted` | Downgrade to `tier = 'free'` |
| `invoice.payment_failed` | Email user, keep pro for grace period (7 days) |

### Billing Portal

Use Stripe's hosted Billing Portal for subscription management (upgrade, downgrade, cancel, update payment method). One API call creates a portal session — no need to build custom UI.

---

## 3D Visualization

**Recommendation: Stay on React Three Fiber v8 + @react-three/drei v9 + three.js 0.158; use procedural geometry for shed models**

### Version Constraint (CRITICAL)

`@react-three/fiber` v9 (npm latest: 9.6.1) requires **React 19** (`react: >=19 <19.3`). This project uses React 18. Upgrading React to 19 is a significant breaking change affecting the entire frontend.

**Decision: Stay on RTF v8.** The latest React 18-compatible release is `@react-three/fiber@8.18.0`. The latest `@react-three/drei` v9 (9.122.0) explicitly lists `react: "^18"` and `@react-three/fiber: "^8"` as peer dependencies — so the full v8 + v9 combination remains supported and receives updates.

The project already has `@react-three/fiber@^8.14.0` and `@react-three/drei@^9.99.0` installed. Bump to latest patch versions; do not upgrade to RTF v9.

### Recommended Versions

| Package | Recommended Version | React Compat | Notes |
|---------|---------------------|--------------|-------|
| @react-three/fiber | 8.18.0 | React 18 | Latest React 18-compatible |
| @react-three/drei | 9.122.0 | React 18 + RTF 8 | Latest, explicitly supports RTF v8 |
| three | 0.158.0 — 0.184.0 | n/a | RTF v8 supports `>=0.133`; pin to installed 0.158 or upgrade to latest if needed |
| @types/three | match three version | n/a | Keep in sync with three version |

### Shed Model Approach: Procedural Geometry (not GLTF)

**Why procedural over GLTF:**
- No external asset pipeline (no Blender, no GLTF conversion step)
- Models are parameterized by user questionnaire (width, depth, height, roof pitch, style)
- Dimensions can be driven directly from `DesignRecommendation` data
- Easier to implement resize handles and real-time dimension changes
- 3 shed styles (gable, lean-to, barn) are all achievable with BoxGeometry + custom roof shapes

**Why GLTF is wrong here:**
- Static GLTF models cannot respond to dimension parameters without complex morph targets
- Adds asset hosting, loading, and format concerns for no benefit
- Overkill for simple architectural primitive shapes

### Key drei Components for This Project

| Component | Use |
|-----------|-----|
| `<OrbitControls>` | Camera orbit around the garden scene |
| `<TransformControls>` | Drag-to-reposition and resize the shed object |
| `<Html>` | Overlay dimension labels on the 3D scene |
| `<Grid>` | Ground plane grid for the garden |
| `<Shadow>` | Soft shadows for visual realism |
| `<useGLTF>` | Future use if GLTF assets are introduced |

### Scene Structure

```
<Canvas>
  <GardenScene>           // ground plane, lighting, sky color
    <ShedModel            // procedural mesh driven by DesignRecommendation props
      width={rec.width}
      depth={rec.depth}
      height={rec.height}
      style={rec.style}   // 'gable' | 'lean-to' | 'barn'
      position={shedPos}
    />
    <OrbitControls />
    <TransformControls object={shedRef} mode="translate" />
  </GardenScene>
</Canvas>
```

---

## Export

**Recommendation: html2canvas + jsPDF for PNG/PDF export**

### Comparison

| Option | Bundle Size | SSR/Worker Required | Quality | Complexity |
|--------|-------------|---------------------|---------|------------|
| html2canvas + jsPDF | ~400KB | No | Good for static DOM | Low |
| @react-pdf/renderer | ~350KB | No | Excellent PDF layout | Medium |
| Puppeteer | ~200MB binary | Yes (Node server-side) | Perfect | High |

### Decision

Use `html2canvas` for PNG screenshot of the 3D Canvas + recommendation text, then `jsPDF` to assemble into a PDF. This runs entirely client-side with no server involvement.

For the PDF summary page (text recommendations, dimensions, notes), `@react-pdf/renderer` produces better-looking PDFs than jsPDF's text layout engine. Combine both: jsPDF assembles the final document, with the 3D screenshot as an embedded image and `@react-pdf/renderer` used to generate the structured summary section.

**Simpler alternative if combined approach is over-engineered:** Use `@react-pdf/renderer` exclusively. It cannot capture a WebGL canvas (three.js), but it can include a PNG screenshot taken via `renderer.domElement.toDataURL()` (three.js's built-in method) without needing html2canvas at all.

**Recommended production path:**
1. Capture 3D canvas: `gl.domElement.toDataURL('image/png')` (RTF `useThree` hook provides `gl`)
2. Assemble PDF: `@react-pdf/renderer` with the canvas screenshot embedded as an `<Image>` + structured recommendation text

This avoids html2canvas entirely (which has known issues rendering WebGL canvases) and produces clean PDF output.

### Packages

| Package | Version (npm latest) | Purpose | Install target |
|---------|---------------------|---------|----------------|
| @react-pdf/renderer | 4.5.1 | PDF assembly with embedded 3D screenshot | frontend |
| jspdf | 4.2.1 | Alternative/fallback PDF generation | frontend (if needed) |

---

## Supporting Libraries (New Additions Summary)

### Backend additions

```bash
npm install -w backend jsonwebtoken bcrypt helmet cookie-parser express-validator stripe drizzle-orm pg
npm install -w backend -D @types/jsonwebtoken @types/bcrypt @types/cookie-parser @types/pg drizzle-kit
```

### Frontend additions

```bash
npm install -w frontend stripe @stripe/stripe-js @stripe/react-stripe-js @react-pdf/renderer
# Upgrade existing 3D packages to latest React-18-compatible versions:
npm install -w frontend @react-three/fiber@8.18.0 @react-three/drei@9.122.0
```

---

## Confidence Levels

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| RTF v8 vs v9 React version constraint | HIGH | npm registry peer deps verified | v9 requires React 19; v8.18.0 is latest React 18-compatible |
| drei v9.122.0 supports RTF v8 | HIGH | npm registry peer deps verified | Explicitly `@react-three/fiber: "^8"` |
| jsonwebtoken 9.0.3 | HIGH | npm registry | Stable, widely used |
| bcrypt 6.0.0 | HIGH | npm registry | Latest |
| Stripe 22.1.1 | HIGH | npm registry | Latest |
| Drizzle ORM 0.45.2 | HIGH | npm registry | Latest, ESM-native |
| Webhook raw body pattern | HIGH | Known Stripe requirement, verified in Stripe docs | Critical correctness issue |
| Procedural vs GLTF shed models | MEDIUM | Engineering analysis of requirements | Based on parameterization needs; team should validate |
| @react-pdf/renderer for export | MEDIUM | npm registry version confirmed; canvas capture pattern from RTF docs | canvas.toDataURL approach standard for three.js |
| SQLite for local dev with Drizzle | MEDIUM | Drizzle docs support confirmed | Requires different driver import per environment |

---

## Alternatives Considered

| Category | Recommended | Alternative Rejected | Reason |
|----------|-------------|---------------------|--------|
| Auth framework | Hand-rolled JWT | Passport.js | Poor ESM support; unnecessary abstraction |
| Auth framework | Hand-rolled JWT | Auth.js (NextAuth) | Designed for Next.js; awkward in Express |
| ORM | Drizzle | Prisma | Binary engine incompatible with tsx ESM workflow |
| Database | PostgreSQL | MongoDB | Relational data doesn't benefit from document store |
| Database | PostgreSQL | PlanetScale/MySQL | MySQL feature gap; PlanetScale removed free tier |
| 3D version | RTF v8 | RTF v9 | v9 requires React 19; upgrade cost not justified |
| 3D models | Procedural | GLTF | Procedural supports parameterization from AI recommendations |
| PDF export | @react-pdf/renderer + canvas.toDataURL | html2canvas + jsPDF | html2canvas fails on WebGL canvas; native canvas capture is simpler |
| PDF export | @react-pdf/renderer + canvas.toDataURL | Puppeteer | Server-side binary dependency; massive overhead for a simple export |
