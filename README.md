# 🏡 Estate — Mini Multi-Tenant Property Listing Platform

A full-stack, multi-tenant property marketplace where **owners** list and manage
properties, **regular users** browse and save favorites, and **admins** oversee
every tenant. Built as a single **Next.js 16** app (App Router) with a
**Prisma + PostgreSQL** backend, JWT auth, and role-based access control.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/Neon-Postgres-336791?logo=postgresql&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white">
</p>

---

## ✨ Features

### 👤 Roles & permissions
- **Regular User** — browse published listings, filter by location/price, and
  save favorites that sync **live across browser tabs**.
- **Owner (tenant)** — full CRUD over *their own* listings: create drafts, edit
  drafts, publish, archive, and delete. Each owner is an isolated tenant.
- **Admin** — cross-tenant oversight: platform metrics, every listing and
  account, and the ability to disable/re-enable any property.

### 🏘️ Domain & business rules
- **Transactional publish** — moving a listing `DRAFT → PUBLISHED` is atomic and
  stamps `publishedAt`.
- **Published listings are immutable** — edits to a published listing return
  **`409 Conflict`**.
- **Soft deletes** — records are flagged with `deletedAt`, never hard-deleted.
- **Admin disable ≠ delete** — admins hide a listing via `disabledByAdmin`
  without destroying the owner's data.
- **Tenant isolation** — owners can only ever read/mutate their own listings;
  enforced server-side, not just in the UI.

### 🎨 Experience
- Server-rendered, shareable public listing & detail pages (SSR).
- Role-aware dashboard with a responsive sidebar (desktop rail + mobile drawer).
- Optimistic favoriting with rollback on error.
- Light/dark theme, accessible components, toast feedback.

---

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, Route Handlers as the API) |
| Language | **TypeScript**, **React 19** |
| Database | **PostgreSQL** (Neon) via **Prisma 6** |
| Auth | **JWT** (`jose`) in an httpOnly cookie, **bcryptjs** hashing |
| Server state | **TanStack Query** (optimistic updates) |
| Client state | **Zustand** (thin auth store) |
| UI | **Base UI** components, **Tailwind CSS v4**, **lucide-react**, **sonner** |
| Validation | **Zod** (shared between client and API) |
| Tooling | **pnpm**, **Docker** + Docker Compose |

---

## 🚀 Getting started

### Prerequisites
- **Node.js 22+** and **pnpm 9+** (for local dev), or **Docker** (for containers).
- A **PostgreSQL** database — a free [Neon](https://neon.tech) project works great.

### Option A — Docker (recommended)

```bash
# 1. Create the runtime env file (see "Environment variables" below)
cp .env.example .env.docker   # then fill in your values

# 2. First run: push the schema + seed demo data, then start
RUN_DB_PUSH=true RUN_SEED=true docker compose up -d --build

# 3. Open the app
open http://localhost:3002
```

On subsequent runs, keep `RUN_DB_PUSH` and `RUN_SEED` set to `false` so restarts
are fast and never wipe data.

### Option B — Local dev

```bash
pnpm install                 # installs deps + generates the Prisma client
cp .env.example .env         # fill in DATABASE_URL, DATABASE_URL_UNPOOLED, JWT_SECRET

pnpm prisma db push          # create the schema
pnpm prisma db seed          # seed demo accounts + listings

pnpm dev                     # http://localhost:3000
```

---

## 🔐 Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | **Pooled** connection (runtime). For Neon use the `-pooler` host with `?sslmode=require&pgbouncer=true`. |
| `DATABASE_URL_UNPOOLED` | ✅ | **Direct** connection (Prisma `directUrl`, used by `db push`/migrations). Same host **without** `-pooler`. |
| `JWT_SECRET` | ✅ | Secret used to sign session JWTs. Generate with `openssl rand -base64 48`. |
| `SEED_PASSWORD` | ➖ | Overrides the seeded demo password (defaults to `Password123!`). |

> **Neon gotcha:** do **not** include `channel_binding=require` in the connection
> string — Prisma's engine doesn't support it and connections fail with a P1001
> "can't reach database" error. Use `pgbouncer=true` on the pooled URL instead.

---

## 🧪 Demo accounts

After seeding, sign in with any of these (password: **`Password123!`**):

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Owner | `owner@example.com` |
| Owner | `owner2@example.com` |
| User | `user@example.com` |

---

## 📡 API overview

All endpoints are App Router route handlers under `app/api/`. Auth is via the
`pp_session` httpOnly cookie; role checks are enforced in `lib/server/guards.ts`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Liveness + DB connectivity |
| `POST` | `/api/auth/register` | Public | Create an Owner or User account |
| `POST` | `/api/auth/login` | Public | Log in, set session cookie |
| `POST` | `/api/auth/logout` | Auth | Clear session |
| `GET` | `/api/auth/me` | Auth | Current user |
| `GET` | `/api/public/properties` | Public | Browse published listings (paginated, filterable) |
| `GET` | `/api/public/properties/[id]` | Public | Public listing detail |
| `GET` `POST` | `/api/properties` | Owner | List own / create draft |
| `GET` `PATCH` `DELETE` | `/api/properties/[id]` | Owner | Read / edit draft / soft-delete |
| `POST` | `/api/properties/[id]/publish` | Owner | Publish a draft (transactional) |
| `POST` | `/api/properties/[id]/archive` | Owner | Archive a published listing |
| `GET` | `/api/favorites` | User | List favorites |
| `POST` `DELETE` | `/api/favorites/[propertyId]` | User | Toggle a favorite |
| `GET` | `/api/admin/metrics` | Admin | Platform-wide metrics |
| `GET` | `/api/admin/properties` | Admin | Every listing across tenants |
| `POST` | `/api/admin/properties/[id]/disable` | Admin | Disable / re-enable a listing |

Errors map to correct HTTP codes: `400 / 401 / 403 / 404 / 409 / 422`.

---

## 🗂️ Project structure

```
app/
  api/                  # Route handlers = the backend
  dashboard/            # Role-gated dashboards (owner / admin / favorites)
    admin/properties/   # In-dashboard listing preview (keeps the sidebar)
  listings/             # Public SSR browse + detail
  login/ register/      # Auth pages
components/
  ui/                   # Base UI + Tailwind primitives
  dashboard-sidebar.tsx # Role-aware navigation
  property-*.tsx        # Cards, gallery, detail, form
lib/
  server/               # db, auth, guards, http, services (business logic)
  hooks/ stores/        # TanStack Query hooks, Zustand auth store
  validation.ts         # Shared Zod schemas
prisma/
  schema.prisma         # Data model
  seed.ts               # Demo accounts + listings
Dockerfile
docker-compose.yml
```

---

## ☁️ Deploying to Vercel

1. Import the repo on Vercel (framework auto-detected as **Next.js**, package
   manager as **pnpm**). Leave build/install commands on their defaults — the
   `build` script runs `prisma generate && next build`.
2. Add the environment variables above (**Production** scope), using the
   **pooled** `DATABASE_URL` (with `pgbouncer=true`, **no** `channel_binding`).
3. Deploy, then verify `https://<app>.vercel.app/api/health` returns
   `{"status":"ok","db":"connected"}`.

The schema is applied to your database via `prisma db push` (run once locally or
during first Docker boot); Vercel serves the app against that same database.

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm prisma db push` | Sync the schema to the database |
| `pnpm prisma db seed` | Seed demo data |

---

## 📝 License

Released for educational and demonstration purposes.
