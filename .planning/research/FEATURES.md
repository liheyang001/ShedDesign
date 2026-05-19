# Feature Landscape

**Domain:** AI-powered garden shed planning SaaS (homeowners + contractors)
**Researched:** 2026-05-19
**Confidence note:** WebSearch and WebFetch were unavailable during this research session. All findings are drawn from training knowledge (cutoff August 2025) of the tools named. Confidence levels reflect this limitation. Treat MEDIUM and LOW items as needing live verification before roadmap commitments.

---

## Competitor Feature Audit

### Tools Surveyed

| Tool | Target | Primary Value | Pricing Model |
|------|--------|---------------|---------------|
| Planner5D | Homeowners, semi-pros | 2D/3D floor plan editor, furniture drag-and-drop | Freemium (free plan + Pro ~$7–$15/mo) |
| RoomSketcher | Homeowners, agents, small contractors | Floor plan + 3D walkthrough + snapshot export | Freemium (free plan + Basic $49/yr + Pro $99/yr) |
| Homestyler | Homeowners | Room decoration drag-and-drop | Free (ad-supported) |
| SketchUp Free | Hobbyists, students | General 3D modeler, web-based | Free web / Go $119/yr / Pro $349/yr |
| ShedBuilder / iLevel shed tools | Shed retailer configurators | Shed style/size picker + basic visualizer | Free (lead-gen for sales, not SaaS) |
| Houzz / Chief Architect | Professionals | Full-room design suite | Pro-only, $50–$200+/mo |

**Confidence:** MEDIUM — based on training data knowledge of these products as of mid-2025. Pricing subject to change.

---

## Table Stakes

Features users expect in any home-design planning tool. Absence causes abandonment or refusal to pay.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visual output before committing | Core trust-building: "show me before I build" | Low — render what you have | Even a flat top-down plan satisfies this minimally |
| Drag-to-reposition the shed | Users expect direct manipulation, not form fields | Medium — Three.js pointer events | Planner5D and RoomSketcher both gate this behind free tiers |
| Multiple shed size/style options | A single shed model feels like a demo, not a tool | Low-Medium — model assets | At least 3 styles (apex, pent, log cabin) expected |
| Mobile-readable result | Result must be legible on phone even if editing is desktop | Low — responsive CSS | Read-only mobile is acceptable for v1 per PROJECT.md |
| Save / resume project | Users don't complete in one session | Medium — auth + persistence | Single biggest driver of account creation |
| Export / share result | Show spouse, contractor, council | Medium — PNG screenshot + PDF | PDF adds significant trust for paid tier |
| Undo / redo | Any editor without undo frustrates users immediately | Low-Medium — command history | Minimum: undo last action |
| Clear questionnaire onboarding | Non-technical users need guided input, not blank canvas | Low — form UX | This is ShedDesign's entry wedge vs blank-canvas competitors |
| Error handling on upload | Bad photo, wrong format, server error — needs clear feedback | Low | Missing this kills the AI photo feature for a large % of users |
| Progress indicator for AI analysis | Gemini takes 2–8s; silent wait = "is it broken?" | Low | Spinner + status text minimum |

**Confidence:** HIGH — these are observed across all surveyed tools and consistently cited in home-design SaaS user research.

---

## Differentiators

Features that set this product apart. Not expected by users arriving from competitors; valued when discovered.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI photo analysis (no manual measurements) | Biggest friction in all competitors is manual dimension entry; this removes it entirely | Done (Phase 4) | Core differentiator — protect and double down on this in UX copy |
| "Your actual garden" framing | Users see their real garden, not a generic template | Medium — overlay 3D on photo plane | Even a rough camera-matched plane adds huge perceived value |
| AI placement recommendations | Tells non-experts where to put it, not just shows a blank canvas | Done (Phase 7 pending) | Second biggest differentiator — competitors require users to know what they want |
| Questionnaire-driven scoping | Guides novice users; reduces "what do I do now?" paralysis | Done (Phase 6 pending) | Planner5D and SketchUp throw users at blank canvas — this is explicitly better |
| Client-shareable link (contractor tier) | Contractors need to email results to clients; link > PDF for mobile viewing | Low-Medium | Key upsell hook for professional tier |
| Sun/shadow awareness | AI noting north-facing wall, shadow patterns on garden photo | Medium — derive from Gemini analysis | Meaningful differentiator for placement (where shed = all-day shadow on garden) |
| Boundary / permit awareness | Noting proximity to fences, property lines visible in photo | Medium — confidence calibration needed | High value for UK/AU market where boundary rules are strict |
| Design history / version comparison | Compare "Shed A in corner" vs "Shed B against fence" | Medium | Strong retention feature; deferred to post-MVP |

**Confidence:** MEDIUM-HIGH — core differentiators (AI photo, guided flow) are well-evidenced by the project's own positioning. Sun/shadow and boundary features are based on analysis of homeowner pain points, not verified competitor gaps.

---

## What Drives Subscription Conversion in Home Design Tools

Evidence from training knowledge of Planner5D, RoomSketcher, and similar tools (MEDIUM confidence):

**Primary conversion triggers:**
1. **Export gates** — Free tier lets you design; saving or exporting (PDF, high-res PNG) requires paid. This is the single most consistent conversion mechanism across the category.
2. **Project save/load gates** — Free lets you use the tool once; saving multiple projects requires account + paid. Drives email capture first, then conversion.
3. **3D view gates** — Some tools (RoomSketcher) put 3D walkthrough / snapshot behind paid while keeping 2D free. Works because 3D is the "wow" moment.
4. **Model library gates** — Basic shapes free, premium shed styles or furniture packs paid.
5. **Collaboration / share gates** — Client-shareable links or team seats behind Pro tier.

**For ShedDesign specifically:**
- Gate: PDF export (full recommendation summary with dimensions) — high willingness to pay for something you hand to a contractor or show to a partner
- Gate: Multiple saved projects (homeowners do one; contractors do many)
- Gate: Client-shareable link (contractor tier)
- Free: The full AI analysis + 3D view — let users reach the "wow" moment before asking for payment

**Confidence:** MEDIUM — pattern inferred from multiple tools; no direct conversion rate data available.

---

## Minimum Viable Feature Set to Charge For

These are the features that together constitute a payable product (not just a demo):

1. AI photo analysis of their actual garden (already done)
2. Guided questionnaire (Phase 6)
3. AI placement recommendation with rationale (Phase 7)
4. 3D scene showing shed in garden (Phase 8)
5. At least 2 shed style options in 3D (Phase 8)
6. Drag to reposition shed in 3D (Phase 9)
7. Export: PNG screenshot (Phase 10)
8. Save project (requires auth — Phase after current)

Missing any of items 3, 4, or 8 makes the product feel like a prototype.

**Confidence:** HIGH — this maps directly to the core value statement in PROJECT.md and matches the minimum bar observed in comparable tools.

---

## Onboarding Patterns for Non-Technical Homeowners

Based on analysis of successful home-design tools targeting non-professionals:

| Pattern | What It Is | Why It Works |
|---------|-----------|--------------|
| Wizard flow (not blank canvas) | Step-by-step guided entry: upload → questions → result | Non-experts have no mental model for "start from scratch" — this product already uses this pattern |
| Progress bar / step indicator | "Step 2 of 3" visible throughout | Reduces abandonment; users know how much effort is left |
| Sensible defaults | Pre-select most common shed size (8x6), most popular style (apex) | Decision fatigue causes drop-off; defaults = safe choices to accept or change |
| Inline help text | Tooltip on "shed purpose" explaining why it matters to the AI | Reduces "why are you asking this?" friction |
| Immediate visual feedback | Show 3D result as soon as questionnaire completes, don't make user click through | The payoff must be immediate to justify effort |
| Skip path | Allow skipping optional questionnaire fields | Power users and re-users resent being forced through full flow |
| Mobile-first readability of result | Result page must be shareable via text/WhatsApp — homeowners share with partners | Mobile sharing is how homeowners get spousal buy-in |

**Anti-pattern to avoid:** Blank canvas start (SketchUp, early Planner5D) — users abandon when they don't know the first step.

**Confidence:** MEDIUM-HIGH — these patterns are well-established in UX literature and observed across the surveyed tools.

---

## Anti-Features

Features to explicitly NOT build for v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Manual dimension entry / floor plan drawing | Defeats the entire AI photo angle; also where competitors are weakest | Let Gemini infer dimensions; show ranges (e.g., "approx 8m x 12m garden") |
| Materials / cost estimator | Deep complexity, requires supplier data, varies by region — becomes a product in itself | Link to generic cost guidance in export PDF, no live pricing |
| AR camera overlay (live preview) | Requires native mobile app; WebXR has poor device support for this use case | 3D scene with photo backdrop achieves 80% of the value at 10% of the cost |
| Multiplayer / real-time collaboration | Adds websocket infrastructure, conflict resolution, presence UI | Shareable read-only link (contractor tier) satisfies the collaboration need |
| Social sharing / community gallery | Requires moderation, engagement loops, separate product surface | One-click "export to PNG" + user shares manually |
| BIM / DXF / IFC export | CAD professionals have dedicated tools; this target market doesn't need it | PDF summary export is sufficient |
| AI photorealistic render (Stable Diffusion) | High API cost (~$0.04–0.10/render), latency, inconsistent results | Three.js 3D scene looks predictable and interactive, which is more useful |
| Permit / council application generator | Jurisdiction complexity is enormous (US + UK + AU all differ) | Note in recommendation that permits may be required; link to gov resource |
| Contractor marketplace | Separate product; adds trust/safety/legal complexity | Out of scope in PROJECT.md; keep it that way |
| Offline mode | Cloud-dependent product by design; Gemini API requires network | Acknowledged in PROJECT.md |

**Confidence:** HIGH — these exclusions are directly supported by PROJECT.md out-of-scope decisions plus standard v1 scope discipline.

---

## Feature Dependencies

```
User auth / accounts
  → Project save/load (requires identity)
    → Professional tier (requires saved projects to manage)
      → Client-shareable links (requires professional tier projects)
      → Multi-project dashboard (requires professional tier)

AI photo analysis (done)
  → Questionnaire (needs analysis output to pre-populate context)
    → AI recommendation engine (needs analysis + questionnaire answers)
      → 3D scene (needs recommendation for shed placement coordinates)
        → Drag-to-reposition (needs 3D scene)
          → Export / save (needs final scene state)
```

**Key insight:** Auth/accounts is a prerequisite for project save, which is a prerequisite for the professional tier. This means auth should be built before or alongside the questionnaire phase, not after the 3D scene.

---

## Homeowner vs Professional Feature Split

| Feature | Homeowner Need | Contractor Need | Tier Recommendation |
|---------|---------------|-----------------|---------------------|
| AI photo analysis | Yes — their own garden | Yes — client's garden | Both tiers |
| Guided questionnaire | Critical — novice user | Optional — knows what they want | Both tiers; pros get skip option |
| 3D scene | Yes — personal decision | Yes — client presentation | Both tiers |
| PNG export | Yes — share with partner | Yes — initial proposal | Both tiers |
| PDF summary with spec sheet | Nice-to-have | Required — hand to client/contractor | Free: basic PNG; Pro: full PDF |
| Multiple saved projects | Rarely (1 shed) | Always (many clients) | Pro gate: >1 project |
| Client-shareable link | No | Yes — primary delivery method | Pro only |
| Company branding on exports | No | Yes — looks professional | Pro only |
| Multi-user / team seat | No | Sometimes (small firm) | Pro only; v2 |

---

## MVP Recommendation

**Must ship to charge money (Phase 6–10):**
1. Questionnaire (React Hook Form, 5–7 questions, sensible defaults)
2. AI recommendation (Gemini Chat, structured output with placement rationale)
3. 3D garden scene (React Three Fiber, shed placed at recommended position)
4. 2–3 shed style options in 3D
5. Drag-to-reposition + resize in 3D
6. PNG export
7. User auth + single project save

**Defer without guilt:**
- PDF export: Add in the first paid-tier release after MVP, not before
- Multiple projects: Gate behind paid tier — drives conversion
- Client-shareable link: Pro tier, post-MVP
- Company branding: Pro tier, post-MVP
- Sun/shadow analysis: Add as a differentiating detail in Phase 7 AI prompt, costs nothing extra
- Undo/redo: Minimum viable = undo last drag action only

**Free tier definition:**
- Full AI analysis + questionnaire + 3D view: free (the "wow" moment must be free)
- Save project: requires account (email capture gate)
- Export PNG: requires account (second gate)
- Additional projects beyond 1: paid
- PDF export: paid
- Shareable link: paid

---

## Sources

- Competitor feature knowledge: training data (Planner5D, RoomSketcher, SketchUp Free, Homestyler, ShedBuilder) — MEDIUM confidence, knowledge cutoff August 2025
- Project requirements and positioning: `I:/AI/ShedDesign/.planning/PROJECT.md` — HIGH confidence (primary source)
- Onboarding and conversion patterns: UX literature + product analysis from training data — MEDIUM confidence
- Feature dependency ordering: derived from PROJECT.md implementation status and architectural analysis — HIGH confidence

**Note:** Live competitor verification via WebFetch/WebSearch was unavailable during this research session. Pricing figures, free-tier boundaries, and specific feature gates should be verified against live competitor sites before making roadmap commitments that depend on competitive positioning.
