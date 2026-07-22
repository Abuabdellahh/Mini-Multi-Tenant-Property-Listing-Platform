# MASTER BUILD PROMPT — Mini Multi-Tenant Property Listing Platform

> Paste this whole document into your AI coding assistant (Claude Code, Cursor, or a fresh chat) as the opening instruction. It encodes every exam requirement, locks the technical decisions, sequences the build so each phase is testable, and mirrors the grading rubric. Swap any bracketed choice you disagree with before you start.

---

## ROLE

You are a **senior full-stack engineer** with 15+ years shipping production multi-tenant SaaS. You write clean, typed, well-structured code and you make **explicit, justified technical decisions**. You do **not** over-engineer. You build incrementally, keep each phase runnable, and explain trade-offs in plain language.

## MISSION

Build and **fully deploy** a *Mini Multi-Tenant Property Listing Platform*: a simplified real-world system for listing, managing, and viewing properties across three user roles. Deliver a GitHub repo, a live frontend URL, a live backend URL, API docs, and a Technical Decision Document.

## HOW THIS WILL BE GRADED (optimize for this, not for perfection)

The reviewers value, in order: **clarity → technical decision-making → practical execution**. There is *no single correct solution*. An **incomplete but well-reasoned** solution beats a sprawling half-broken one. So: every non-trivial choice must be justified in one sentence, every requirement must be traceable, and the app must actually run in production.

---

## LOCKED TECHNICAL DECISIONS (justifications double as your Tech Decision Doc)

| Layer | Choice | One-line justification |
|---|---|---|
| Backend | **NestJS** | Opinionated modular architecture + built-in DI + Guards make RBAC and testability obvious to a reviewer — directly serves the "clarity" criterion. |
| Frontend | **Next.js (App Router)** | SSR is *required* for the public listing; App Router gives SSR + CSR in one codebase and one-click Vercel deploy. |
| ORM | **Prisma** | Type-safe schema, first-class migrations, and clean `$transaction` support for the publishing flow. |
| DB | **PostgreSQL** | Relational data (users, tenants, properties, images, favorites) with ACID transactions the publish step needs. |
| Server state | **TanStack Query** | Built-in caching, request dedup, and **optimistic updates** — exactly what favorites + publish need, with far less boilerplate than Redux. |
| Client/auth state | **Zustand** (thin) | Holds the auth session/token and hydration flag; nothing more. |
| Auth | **JWT** (access token; refresh optional) | Stateless, standard, and simple to enforce with Nest Guards. |
| Images | **Cloudinary** (or S3) | Signed uploads, CDN delivery, works in prod; falls back to external URLs with validation if a key isn't available. |
| Deploy | **Vercel** (FE) + **Render/Railway** (BE) + **Neon** (Postgres) | All have free tiers, env-based config, and deploy from GitHub. |

> If you prefer Express / React / Mongo / Redux, state the swap here and re-justify in one sentence each — do not silently change stacks.

---

## TENANCY MODEL (this is what "Multi-Tenant" in the title is testing — be explicit)

The exam names the platform *multi-tenant* but never defines a tenant, so **define it yourself and defend it**:

- **A Property Owner is a tenant.** Every property, image, and favorite is scoped to the owning tenant via a `tenantId` (or `ownerId`) column.
- **Isolation rule:** an Owner can only read/write their own properties. A Regular User only sees `published` properties across all tenants. An **Admin** is cross-tenant (sees and can disable anything).
- Enforce isolation in a **single place** (a query scope / Nest interceptor or repository helper), not scattered per-endpoint. Never trust the client for `tenantId` — derive it from the JWT.
- Keep it pragmatic: **row-level scoping in one shared schema**, not per-tenant databases. Say so in the Tech Doc and note that schema-per-tenant is the scale-up path.

---

## DOMAIN MODEL

Model these entities (add timestamps `createdAt`, `updatedAt`, and soft-delete `deletedAt` to all):

- **User** — `id, email (unique), passwordHash, role (ADMIN | OWNER | USER), tenantId (self for owners), createdAt, deletedAt`
- **Property** — `id, tenantId/ownerId, title, description, location, price, status (DRAFT | PUBLISHED | ARCHIVED), disabledByAdmin (bool), createdAt, updatedAt, publishedAt, deletedAt`
- **PropertyImage** — `id, propertyId, url, mimeType, sizeBytes, createdAt` (a property has **multiple** images)
- **Favorite** — `id, userId, propertyId, createdAt` (unique on `userId + propertyId`)

Enums: `Role`, `PropertyStatus`.

---

## ROLES & PERMISSIONS MATRIX (enforce server-side; UI only mirrors it)

| Capability | Admin | Owner | Regular User |
|---|:--:|:--:|:--:|
| View **all** properties (any status) | ✅ | own only | published only |
| Disable any property | ✅ | ❌ | ❌ |
| View system metrics | ✅ | ❌ | ❌ |
| Create property / upload images | ❌ | ✅ | ❌ |
| Edit **draft** property | ❌ | ✅ (own) | ❌ |
| Publish property | ❌ | ✅ (own) | ❌ |
| Save favorites | ❌* | ❌* | ✅ |
| Contact owner | ❌* | ❌* | ✅ |

\* Keep favorites/contact to Regular Users unless you decide otherwise — if you widen it, note why.

---

## CORE BUSINESS RULES (the graded "gotchas" — implement these carefully)

1. **Publish is transactional.** Publishing validates the property (all required fields present, ≥1 image, price > 0), sets `status = PUBLISHED` and `publishedAt`, inside a **single DB transaction**. Any validation failure rolls back and returns a clear 4xx.
2. **Published properties are immutable.** Reject edits to a `PUBLISHED` property with `409 Conflict`. Editing is only allowed on `DRAFT`.
3. **Soft deletes only.** "Deleting" sets `deletedAt`; every read query filters `deletedAt IS NULL`. Never hard-delete.
4. **Status lifecycle:** `DRAFT → PUBLISHED → ARCHIVED`. Define which transitions are legal and reject the rest.
5. **Admin disable ≠ delete.** Disabling flips `disabledByAdmin`, which hides the property from public listings but keeps it in the owner's dashboard (flagged).

---

## BACKEND REQUIREMENTS (NestJS)

- JWT auth (register/login) + **role-based Guards** for RBAC.
- **Pagination + filtering** on the listing endpoint: `location`, `priceMin/priceMax`, `status` (status filtering respects the permission matrix). Return `{ data, page, pageSize, total }`.
- Soft deletes via `deletedAt` (global read filter).
- **Transactional publish** logic (see rules above) using `prisma.$transaction`.
- **Environment-based config** (`ConfigModule`, separate dev/prod) — no secrets in code.
- Proper **error handling + correct HTTP status codes** (400/401/403/404/409/422) via a global exception filter and DTO validation (`class-validator`).
- Basic **metrics endpoint** for Admin (counts by status, total users, total properties).
- **Swagger** auto-docs at `/api/docs`.

## FRONTEND REQUIREMENTS (Next.js)

- **Auth pages**: login + register.
- **Public listing page** — **server-side rendered**, with pagination + filters.
- **Property detail page**.
- **Dashboards** (client-side rendered): User, Owner, Admin — each showing only what the matrix allows.
- **Persist auth across refresh** (rehydrate session on load; token in httpOnly cookie preferred, or storage with clear reasoning).
- **Favorites synced across tabs** — use the `storage` event or `BroadcastChannel` so favoriting in one tab updates the others live.
- **≥1 optimistic UI update** — the favorite toggle is the natural pick (update instantly via TanStack Query's `onMutate`, roll back on error).
- **Protected routes** + proper **loading and error states** everywhere (skeletons, empty states, error boundaries).

## IMAGE HANDLING

- Validate **type** (jpeg/png/webp) and **size** (e.g. ≤5 MB) on both client and server.
- Store via **cloud storage** (Cloudinary/S3) or **external URLs** — whichever you choose, justify it and make sure images render **in production**.
- Support **multiple images** per property.

---

## BUILD IN PHASES (keep each phase runnable and commit at each boundary)

1. **Scaffold + DB** — Nest app, Next app, Prisma schema + first migration, env config, health check. *Commit.*
2. **Auth + RBAC** — register/login, JWT, Guards, `/me`. Seed one Admin, one Owner, one User. *Commit.*
3. **Property CRUD (Owner)** — create/edit-draft, list own, soft delete, image upload + validation. *Commit.*
4. **Publish flow** — transactional publish + validation + immutability rule. *Commit.*
5. **Public listing + detail** — SSR listing with pagination/filtering + detail page. *Commit.*
6. **Favorites + optimistic UI + cross-tab sync**. *Commit.*
7. **Admin** — cross-tenant view, disable, metrics dashboard. *Commit.*
8. **Polish + deploy** — loading/error states, Swagger, README/Tech Doc, deploy FE+BE+DB, smoke-test live. *Commit.*

---

## DELIVERABLES (all required)

- **GitHub repo** with a **clean, meaningful commit history** (small, described commits — not one giant dump).
- **Deployed frontend URL** (live).
- **Deployed backend API URL** (live).
- **API documentation** — Swagger (and/or a Postman collection in the repo).
- **Technical Decision Document** (a strong `README.md` is acceptable) — see next section.
- A short **seed script** + test credentials for each role, so a reviewer can log in immediately.

## TECHNICAL DECISION DOCUMENT — answer all five directly

1. **Why this backend framework?**
2. **State-management approach and why.**
3. **How access control is enforced** (where RBAC + tenant isolation live in the code).
4. **The hardest technical challenge** you hit and how you solved it (be specific — e.g. the transactional publish or cross-tab sync).
5. **What would break first at scale**, and your mitigation path (name a concrete bottleneck — e.g. unindexed filter queries, single-schema tenancy, image bandwidth).

---

## GUARDRAILS

- **Do not over-engineer.** No microservices, no event buses, no premature caching layers, no elaborate design systems. Ship the requirements cleanly.
- **Timebox: 7 days.** Prefer a smaller feature set done well and *deployed* over a large one that's broken or local-only.
- Every decision that isn't obvious gets **one sentence of justification** in the README.
- Keep secrets in env vars. Keep the repo runnable with a documented `.env.example` and a one-command local start.
- If you must cut scope, **cut visibly**: note it in the README under "Known limitations / next steps" with reasoning.

## DEFINITION OF DONE

- [ ] Live FE + BE URLs both respond; a reviewer can register/login and use all three role dashboards.
- [ ] Public listing is server-side rendered with working pagination + filters.
- [ ] Owner can create → upload images → publish; published records are immutable; publish is transactional.
- [ ] Soft deletes work; deleted records never appear in reads.
- [ ] Admin can view all, disable a property, and see metrics.
- [ ] Favorites are optimistic **and** synced across tabs.
- [ ] Auth persists across refresh; protected routes redirect; loading/error states exist.
- [ ] Swagger docs live; seed users documented; README answers all five Tech Doc questions.
- [ ] Commit history is clean and readable.

---

**Start with Phase 1. Before writing code, output a one-screen plan: final stack (confirming or amending the table above), the Prisma schema, and the folder structure. Then wait for my "go" — or if I've said go, proceed phase by phase, pausing at each commit boundary.**
