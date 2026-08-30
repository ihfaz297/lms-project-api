# lms-project-api

A learning-management system with a real payment loop, built as three independently-running services: a React frontend, an Express LMS backend, and a **simulated bank API** that money actually moves through.

The bank is the point. Rather than stubbing payments behind a mock, enrollments trigger a genuine HTTP transfer between account records with balance checks, secrets, and transaction IDs — and instructor payouts are gated behind a two-phase validate step. It's a payment-integration exercise wearing an LMS as clothing.

---

## Architecture

```
┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│  lms-frontend  │  HTTP  │  lms-backend   │  HTTP  │    bank-api    │
│  Vite + React  │ ─────► │    Express     │ ─────► │    Express     │
│    :8080       │        │     :3001      │        │     :3002      │
└────────────────┘        └───────┬────────┘        └───────┬────────┘
                                  │                         │
                             ┌────▼────┐               ┌────▼────┐
                             │ MongoDB │               │ MongoDB │
                             │  /lms   │               │  /bank  │
                             └─────────┘               └─────────┘
```

The two databases are deliberately separate. The LMS knows a `bankTransactionId`; it does not know a balance. Every monetary fact lives on the bank side and is reached only over the wire — the same boundary you'd have with a real payment processor.

**Stack:** Node/Express · MongoDB (Mongoose) · JWT (`jwt-simple`) · bcryptjs · axios · React 18 · TypeScript · Vite · Tailwind · shadcn/ui · Vitest

---

## Repository layout

```
lms-project-api/
├── lms-backend/           Express API — auth, courses, enrollment, payouts (:3001)
│   ├── middleware/auth.js JWT verification + role guards
│   ├── models/            User, Course, CourseMaterial, Enrollment, Transaction, Certificate
│   └── routes/            auth, courses, bank, instructor
├── bank-api/              Simulated bank — accounts and transfers (:3002)
│   ├── models/            BankAccount, BankTransaction
│   └── routes/            accounts, transactions
├── lms-frontend/          Vite + React + shadcn/ui (:8080)
│   └── src/
│       ├── pages/         Landing, Login, Register, Dashboard, Courses,
│       │                  CourseDetail, BankSetup, Index, NotFound
│       ├── components/    ui/ (shadcn), layout/, courses/
│       ├── contexts/      AuthContext
│       └── lib/api.ts     API client — base URL lives here
├── ARCHITECTURE.md        Transaction flow diagrams, service responsibilities
├── QUICKSTART.md          MongoDB setup (Atlas / Docker / local) + Codespaces
├── IMPLEMENTATION_GUIDE.md
└── MANUAL_TESTING_GUIDE.md
```

---

## Quick start

**Prerequisites:** Node 18+, npm, and a MongoDB instance. `QUICKSTART.md` covers Atlas, Docker, and local installs — Atlas is the fastest path.

```bash
git clone https://github.com/ihfaz297/lms-project-api.git
cd lms-project-api
```

Install each service:

```bash
cd bank-api      && npm install && cp .env.example .env && cd ..
cd lms-backend   && npm install && cp .env.example .env && cd ..
cd lms-frontend  && npm install && cd ..
```

Fill in `MONGODB_URI` and `JWT_SECRET` in the two `.env` files, then run all three in separate terminals:

```bash
cd bank-api     && npm run dev    # :3002 — start this first
cd lms-backend  && npm run dev    # :3001
cd lms-frontend && npm run dev    # :8080
```

Start the bank first. The LMS backend calls it at enrollment time, and a transfer against a service that isn't listening surfaces as a `402 Payment failed`.

Open http://localhost:8080. Register as an instructor and as a learner (separate accounts), run **Bank Setup** for each to open an account, then publish a course from the instructor side and enroll from the learner side to exercise the full loop.

### Environment

**`lms-backend/.env`**

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | LMS database connection string |
| `PORT` | Default `3001` |
| `JWT_SECRET` | Token signing key — change this |
| `BANK_API_URL` | Bank base URL, default `http://localhost:3002/api` |
| `LMS_BANK_ACCOUNT` | Master account that receives learner payments |
| `LMS_BANK_SECRET` | Secret authorizing transfers out of the master account |
| `COURSE_UPLOAD_BONUS` | Instructor payout for publishing a course |
| `MATERIAL_UPLOAD_BONUS` | Instructor payout per uploaded material |

**`bank-api/.env`** — `MONGODB_URI`, `PORT` (default `3002`).

The frontend's API base is hardcoded at `lms-frontend/src/lib/api.ts:6`. Change it there if your backend isn't on `localhost:3001`.

---

## The money path

Enrollment is two-phase, and the split is the most interesting thing in the codebase.

**Phase 1 — learner pays (`POST /api/courses/:id/enroll`).** The backend confirms the course exists, confirms the learner isn't already enrolled, confirms bank setup is done, then calls the bank to transfer `course.price` from the learner's account to `LMS_BANK_ACCOUNT`. The bank verifies the account secret and available balance, moves the money, and returns a `transactionId`. Only then does the LMS write an `Enrollment` and a `Transaction` with `status: 'pending'`.

Note the ordering: **the bank call happens before any local write.** A failed transfer returns `402` and leaves no orphaned enrollment behind.

**Phase 2 — instructor collects.** Funds sit in the LMS master account as a pending transaction. The instructor validates it, and the payout transfers from the master account to the instructor's — money out only after money in, so the LMS never fronts a payout it hasn't collected.

Course creation and material uploads pay instructors separately, from `COURSE_UPLOAD_BONUS` and `MATERIAL_UPLOAD_BONUS`.

---

## API reference

All LMS routes are mounted under `/api`. Protected routes expect `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create a learner or instructor account |
| POST | `/login` | — | Exchange credentials for a JWT |
| GET | `/profile` | ✔ | Current user |
| GET | `/certificates` | ✔ | Certificates earned by the current user |

### Courses — `/api/courses`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | List all courses |
| GET | `/enrolled` | ✔ | Courses the current learner is enrolled in |
| GET | `/:id` | optional | Course detail |
| POST | `/` | instructor | Create a course (pays the upload bonus) |
| GET | `/:id/materials` | — | Materials for a course |
| POST | `/:id/materials` | instructor | Upload material (pays the material bonus) |
| POST | `/:id/enroll` | learner | **Triggers the payment flow** |
| POST | `/:id/complete` | learner | Mark complete and issue a certificate |

### Bank bridge — `/api/bank`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/setup` | ✔ | Open a bank account and link it to the user |
| GET | `/balance` | ✔ | Current balance, proxied from the bank |
| POST | `/pay` | ✔ | Initiate a payment |
| POST | `/transactions/:transactionId/validate` | ✔ | Validate a pending transaction |
| GET | `/transactions` | ✔ | Transaction history |

### Instructor — `/api/instructor`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/courses` | instructor | Courses authored by the current instructor |
| GET | `/earnings` | instructor | Earnings summary |
| POST | `/withdraw/:transactionId` | instructor | Withdraw a validated payout |

### Bank service (port 3002)

| Method | Path | Description |
|---|---|---|
| POST | `/api/accounts/setup` | Open an account — seeds a balance of 10,000 |
| GET | `/api/accounts/:accountNumber/balance` | Balance lookup |
| POST | `/api/transactions/transfer` | Move funds; verifies secret and balance |
| GET | `/api/transactions/:transactionId` | Transaction detail |
| POST | `/api/transactions/:transactionId/validate` | Mark a transaction validated |

---

## Data model

**LMS** — `User` (name, email, bcrypt password, `role: learner|instructor`, linked `bankAccount`/`bankSecret`, `hasBankSetup`) · `Course` (title, description, price, instructor ref, thumbnail, duration, `level: beginner|intermediate|advanced`) · `CourseMaterial` (`type: video|text|audio|mcq`, content, order) · `Enrollment` (learner, course, `isPaid`, `progress` 0–100, `completed`) · `Transaction` (`type: payment|payout`, `status: pending|completed|failed|validated`, `bankTransactionId`) · `Certificate` (learner, course, denormalized names, `issuedAt`)

**Bank** — `BankAccount` (`accountNumber` unique, `secret`, `balance` default 10000, `type: learner|instructor|lms_org`, LMS `userId`) · `BankTransaction` (UUID `transactionId`, from/to, amount, `status`, `reason`)

Passwords are hashed by a `pre('save')` hook on the user schema, so they're never written in plaintext.

---

## Testing

```bash
cd lms-frontend && npm test        # Vitest
```

`MANUAL_TESTING_GUIDE.md` walks the payment loop end to end by hand, which is currently the only coverage the two backends have. The root `package.json` has no test script.

---

## Status and caveats

This is coursework, not production software. Known and intentional shortcuts:

- **Bank secrets are stored in plaintext** on the `User` document and passed in transfer request bodies. A real integration would use tokenized credentials the LMS never holds.
- **`jwt-simple`** doesn't enforce expiry the way `jsonwebtoken` does. Tokens are effectively long-lived.
- **Transfers aren't atomic.** The bank debits and credits in sequence with no transaction wrapper, so a crash mid-transfer can lose money. MongoDB sessions would fix this.
- Several route handlers still carry their scaffolding `// TODO` comments above working implementations.
- Account balances seed at 10,000 on creation — there's no deposit endpoint.

---

## Documentation

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | Service responsibilities and full transaction-flow diagrams |
| `QUICKSTART.md` | MongoDB options and Codespaces setup |
| `IMPLEMENTATION_GUIDE.md` | Build order and route-by-route notes |
| `MANUAL_TESTING_GUIDE.md` | End-to-end manual test script |
