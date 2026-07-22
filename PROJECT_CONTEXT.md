# Analytify — Project Context (paste this into a new chat to resume)

## What this is
A productivity/focus-tracking SaaS being built up from a Pomodoro timer app into a full analytics + community product. Backend: Node/Express + TypeScript + Prisma + Postgres (Neon) + Redis (Upstash) + BullMQ. Frontend: React 19 + Vite + Tailwind 4 + MUI icons (still JavaScript, not yet converted to TS).

## Stack (current, as of this doc)
- **Backend**: Express 5, TypeScript (strict mode), Prisma 7 ORM
- **Database**: PostgreSQL hosted on **Neon** (migrated off MongoDB/Mongoose)
- **Cache/Queue**: Redis hosted on **Upstash** (migrated off local Redis), BullMQ for async analytics processing
- **Auth**: JWT (jsonwebtoken + bcryptjs), 7-day expiry
- **Frontend**: React 19, Vite, Tailwind 4, Recharts, Framer Motion, React Router 7, Axios, `@mui/icons-material` — **still plain JS**, not TypeScript
- **Deployment**: nothing currently deployed correctly — `frontend/.env` used to point at a stale Render backend; now pointed at `http://localhost:5000/api` for local dev. **Render deployment needs redoing** once ready to ship (old deploy predates the Postgres/TS migration).

## Repo layout
```
AnalyticsAllrounder/
├── docker-compose.yml       # Redis only now (Postgres removed — using hosted Neon)
├── backend/
│   ├── .env                 # DATABASE_URL, DIRECT_URL (Neon), REDIS_URL (Upstash), JWT_SECRET, LOG_LEVEL
│   ├── prisma/schema.prisma # source of truth for DB schema
│   ├── prisma.config.ts     # Prisma 7: connection URLs live here, NOT in schema.prisma
│   └── src/
│       ├── server.ts, app.ts
│       ├── config/          # prisma.ts, redis.ts
│       ├── middleware/      # auth, admin, tier, error, requestLogger
│       ├── utils/           # httpError.ts (AppError + subclasses), asyncHandler.ts, logger.ts (pino)
│       ├── types/express.d.ts  # req.user / req.billing augmentation
│       ├── modules/         # auth, billing, profile, public, tasks, pomodoro, analytics,
│       │                    # export, nudges, streaks, distractions
│       └── jobs/            # queues, workers, processors (BullMQ analytics pipeline)
└── frontend/
    └── src/
        ├── api/             # api.js (axios+JWT interceptor), analyticsApi, profileApi, publicApi,
        │                    # exportApi, nudgesApi, distractionsApi
        ├── features/        # auth/, pomodoro/, tasks/, streaks/ — each has api/ + hooks/
        ├── components/      # Heatmap, ShareProfileCard, ExportButton, BurnoutNudgeBanner,
        │                    # DistractionPrompt, DistractionReportCard, ProtectedRoute, StatsCard(stub)
        └── pages/            # Landing, Login, Register, Dashboard, Focus, PublicProfile
```

## Data model (Prisma / Postgres) — 8 models, 7 enums
- **User**: id (uuid), name, email (unique), password (bcrypt hash), loginCount, emailVerified, isAdmin, username (nullable unique — public profile handle), isPublic, burnoutNudgeDismissedAt/Score, freezeTokens (capped 3)
- **Billing** (1:1 with User, own table): tier (free|premium), subscriptionStatus, provider (stripe|razorpay, nullable), customerId, subscriptionId, currentPeriodEnd — **every User is guaranteed a Billing row**, created atomically at registration
- **Task**: userId, title, status (active|completed|archived), completedPomodoroCount (denormalized counter)
- **PomodoroSession**: userId, taskId (nullable), startTime, endTime, duration (minutes), status (created|running|paused|completed|abandoned|expired), pausedAt, totalPausedDuration (ms), lastResumedAt
- **LifecycleEvent** (1:many with PomodoroSession): type (created|started|paused|resumed|completed|abandoned|expired), timestamp
- **StreakFreeze**: userId, coveredDate ("YYYY-MM-DD" UTC), spentAt — auditable log of which missed days were bridged by a freeze token; unique on (userId, coveredDate)
- **DistractionLog**: userId, sessionId, category (phone|social_media|noise|people|hunger_thirst|fatigue|other), note (optional, ≤280 chars), createdAt

## Backend modules (all TypeScript, repository → service → controller → routes pattern)
1. **auth** — register/login, JWT issuance (payload: `{id, tier}`), password hashing. Same "Invalid email or password" for both unknown-email and wrong-password (no user enumeration).
2. **billing** — tier/subscription state. `billing.service.ts` has **stub** `createCheckoutSession`/`handleProviderWebhook` that throw "not configured" — no real payment provider wired in yet (deliberately deferred). Admin-only manual tier override: `POST /api/billing/admin/set-tier`.
3. **profile** — username claiming + public/private visibility toggle.
4. **public** — unauthenticated `GET /api/public/:username`, returns heatmap/streak/consistency for opted-in users. Redis-cached 5min. Same "not found" whether user doesn't exist or is private.
5. **tasks** — CRUD, ownership-checked, status active|completed|archived.
6. **pomodoro** — the core session lifecycle state machine (created→running→paused→completed/abandoned). Optional Task link; completing credits `Task.completedPomodoroCount`. Recovery endpoint (`GET /pomodoro/active-session`) computes `secondsLeft` server-side. On completion, also triggers streak-freeze consume/award (see `streaks` module) — all non-fatal side effects.
7. **analytics** — consistency score, focus streaks (now freeze-aware — see below), peak productivity hours, 365-day heatmap, burnout risk (7-day vs 7-day comparison), Deep Work Score (40% length/30% interruption/30% consistency, last 30 days). Dashboard endpoint Redis-cached (10min TTL), invalidated on session complete/abandon, warmed async via BullMQ.
8. **export** — `GET /api/export/sessions.csv`, premium-gated (`requireTier`), streams full session history as CSV with RFC 4180 field escaping.
9. **nudges** — `GET /api/nudges/burnout` decides whether to show a burnout banner (elevated risk + not recently dismissed near this score); `POST /api/nudges/burnout/dismiss` records dismissal at the server-computed score (never trusts client input). Dismissal only stays silenced until the score climbs >15 points further.
10. **streaks** — freeze-token mechanics. `maybeConsumeFreezeToken` (checks if yesterday was a genuine gap by querying raw session data directly — NOT by reading `calculateFocusStreak`'s output, which can't distinguish "gap" from "no gap" once today's session already exists — see bug note below) and `maybeAwardFreezeToken` (+1 token per 7-day streak milestone, capped at 3 via atomic `LEAST()` SQL). `GET /api/streaks/freeze-tokens` for the balance.
11. **distractions** — `POST /api/distractions` logs one against a specific session (ownership-checked); `GET /api/distractions/weekly-report` returns last-7-days top categories via Prisma `groupBy`.

`analytics.service.ts`'s `calculateFocusStreak` now merges `StreakFreeze` covered dates into its gap-detection set — a frozen day counts exactly like a real completed-session day. Returns `{ currentStreak, longestStreak, freezesApplied }`.

## Middleware
- `authMiddleware` — verifies JWT, sets `req.user = {id}`
- `requireAdmin` — re-checks `isAdmin` from DB (not JWT)
- `requireTier(minTier)` — re-checks billing tier from DB (not JWT) — gates premium features (currently: CSV export)
- `errorHandler` — centralized, typed `AppError` subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`)
- `requestLogger` — logs every request via pino

## Features implemented (all live-tested end-to-end against real Neon + Upstash, not just typechecked)
1. **Billing/tier foundation** — no payment provider yet (deliberate), admin override works.
2. **Public shareable profile** — `/u/:username`, opt-in toggle, `Heatmap.jsx` takes `title`/`subtitle` props now.
3. **Task-to-Pomodoro linking** — task picker + quick-add in Focus page, completion credits the task.
4. **Deep Work Score** — new metric + dashboard card + route.
5. **Full MongoDB → PostgreSQL (Neon) migration** — Billing and LifecycleEvent became real tables; Mongo aggregations rewritten as Prisma `groupBy` or raw parameterized SQL (`$queryRaw` + `Prisma.sql`) where grouping by a derived value (hour-of-day, date-truncation) has no Prisma equivalent.
6. **Full JS → TypeScript migration (backend only)** — 0 typecheck errors project-wide, verified via `tsx` dev and compiled `dist/` build against live infra. Heavy teaching comments throughout.
7. **Redis migrated to Upstash** — `REDIS_URL` (rediss://), BullMQ's required `maxRetriesPerRequest: null`.
8. **Material icons everywhere** — all literal SVGs and emoji-as-icons replaced with `@mui/icons-material` across Dashboard/Login/Register/Focus/PublicProfile.
9. **CSV export** — premium-gated, RFC 4180-correct escaping, verified 403 (free) → 200 (premium) live.
10. **Burnout nudge** — dismissible banner using the already-computed burnout detector, score-based resurfacing (not just time-based).
11. **Streak freeze tokens** — auto-earned at 7-day milestones (cap 3), auto-spent to bridge a single missed day. **A real bug was caught and fixed during live testing**: the first implementation checked the wrong signal (streak's own output, which can't tell "gap" from "no gap" once today is already saved) — fixed by checking yesterday's raw session data directly.
12. **Distraction logging** — skippable prompt after Pause/Abandon, weekly top-triggers report on Dashboard via `groupBy`.

Phase 1 (from the original roadmap doc) is now **fully complete**.

## Known issues / things to watch
- **Frontend is still plain JavaScript** — not yet converted to TypeScript.
- **`frontend/.env`** points to `localhost:5000` for dev; needs a real redeploy decision (Render or elsewhere) before production use.
- **No payment provider wired in** — billing is admin-managed only until Stripe/Razorpay is chosen (stub throws clearly, contract ready).
- **`StatsCard.jsx`** is a stub component, unused dead code.
- Neon connection string was pasted in plaintext in chat once — user acknowledged, said they'd rotate it "later." **Still not done as of this doc** — nag before real user data lands in the DB.
- `nodemon` devDependency is unused (replaced by `tsx watch`), harmless leftover.
- **Orphaned background dev-server processes repeatedly caused false "it's broken" signals this session** — a stray `tsx` process squatting on port 5000 silently absorbed requests meant for a freshly-started server, at least 3 separate times. Always run `netstat -ano | grep :5000` (Windows) and kill stale listeners before trusting a "nothing happened" result during local testing.
- After any `prisma migrate dev`, **always run `npx prisma generate` explicitly** — it did not reliably auto-regenerate the client in this environment, causing stale-type typecheck errors that looked like real bugs until `generate` was re-run.

## Product roadmap (phased)
**Phase 1 — Strengthen the Core**: ✅ **COMPLETE** (Task-Pomodoro linking, Deep Work Score, unified dashboard, CSV export, streaks + freeze tokens, distraction logging).

**Phase 2 — Differentiation for Devs & Students** (not started, GitHub explicitly deferred to last per latest instruction): GitHub/GitLab integration, LeetCode/Codeforces tracker, DSA weak-topic detection, reading tracker. Planned pattern: one shared `Integration` model (`{userId, provider, accessToken, refreshToken, lastSyncedAt}`) + one BullMQ job pattern per provider. GitHub specifically needs an OAuth App (client ID/secret) registered on GitHub's side before backend work can start — that's a manual step for the user.

**Phase 3 — AI Layer** (not started): AI Weekly Review, AI Daily Check-in, habit stacking, goal decomposition. Needs 4-8 weeks of accumulated user data to be worthwhile.

**Phase 4 — Gamification & Retention** (not started): XP/Levels, Achievements, Boss Battles, Friends/Accountability/squad real-time presence (needs new WebSocket infra — none exists yet).

**Phase 5 — Premium/Career Layer** (not started): AI Career Coach, Resume Improvement, Interview Progress Tracker, AI Daily Planning, auto time-blocking.

### Additional feature ideas discussed (not in original doc, not started)
- Context-switch cost tracker
- Calendar-vs-reality diff
- Focus "debt" ledger
- Real-time squad/focus-room presence (needs WebSocket infra)
- Public build-in-public profile — ✅ already built, is the core growth loop

## Immediate next steps
1. GitHub integration — deferred to last; needs user to register a GitHub OAuth App first
2. Frontend → TypeScript conversion (mirrors the backend migration)
3. Choose and wire a real payment provider (Stripe vs Razorpay undecided)
4. Rotate the Neon DB password (still flagged, still not done)
5. Decide on redeployment target (Render or elsewhere) before shipping publicly

## How to run locally
```bash
# backend
cd backend
npm install
npm run dev        # tsx watch src/server.ts — http://localhost:5000

# frontend (separate terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```
Other backend scripts: `npm run build` (tsc → dist/), `npm start` (run compiled dist/server.js), `npm run typecheck` (tsc --noEmit, no output means clean).

Requires `backend/.env` populated with `DATABASE_URL`, `DIRECT_URL` (both Neon), `REDIS_URL` (Upstash), `JWT_SECRET`, `LOG_LEVEL=debug`.

If a request seems to vanish/nothing logs: check `netstat -ano | grep :5000` for a stray process before assuming code is broken (see Known Issues above).
