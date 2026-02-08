# LMS Backend Architecture & Transaction Flow

## 📁 Project Structure

```
lms-project-api/
├── lms-frontend/          (✅ Already complete - Vite + React + shadcn/ui)
├── lms-backend/           (🔨 Build this - Express API for LMS)
│   ├── server.js          (Main entry point)
│   ├── package.json       (Dependencies)
│   ├── .env.example       (Environment variables template)
│   ├── middleware/
│   │   └── auth.js        (JWT authentication)
│   ├── models/
│   │   ├── User.js        (Learner/Instructor users)
│   │   ├── Course.js      (Course info)
│   │   ├── CourseMaterial.js
│   │   ├── Enrollment.js  (Learner enrollment status)
│   │   ├── Transaction.js (Payment records)
│   │   └── Certificate.js (Course completion certs)
│   └── routes/
│       ├── auth.js        (Login/Register)
│       ├── courses.js     (Course management)
│       ├── bank.js        (Bank interactions)
│       └── instructor.js  (Instructor dashboard)
│
└── bank-api/              (🔨 Build this - Simulated bank service)
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── models/
    │   ├── BankAccount.js (Account data + balance)
    │   └── BankTransaction.js (Transfer records)
    └── routes/
        ├── accounts.js    (Account setup/balance)
        └── transactions.js (Money transfers)
```

---

## 💰 Transaction Flow Diagram

### Use Case 1: Learner Enrolls in Course (Pays for it)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. LEARNER INITIATES PURCHASE                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (React)                                                        │
│  ├─ Learner clicks "Enroll in Course"                                    │
│  ├─ POST /api/courses/:courseId/enroll                                   │
│  └─ Sends: { courseId, learnerId (from JWT) }                            │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. LMS BACKEND VALIDATES & INITIATES PAYMENT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LMS Backend (lms-backend/routes/courses.js)                             │
│  ├─ Verify learner not already enrolled                                  │
│  ├─ Fetch course details (price, instructorId)                           │
│  ├─ Get learner bank account from DB                                     │
│  ├─ Call Bank API to TRANSFER money                                      │
│  │  POST /api/transactions/transfer                                      │
│  │  Body: {                                                              │
│  │    fromAccount: learnerAccount,                                       │
│  │    toAccount: lmsOrgAccount,    ← Master LMS account                  │
│  │    amount: coursePrize,                                               │
│  │    secret: learnerSecret,                                             │
│  │    reason: "course_enrollment"                                        │
│  │  }                                                                     │
│  └─ Get transactionId back from Bank                                     │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. BANK PROCESSES PAYMENT                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bank API (bank-api/routes/transactions.js)                              │
│  ├─ Verify fromAccount exists & secret is correct                        │
│  ├─ Check balance >= amount                                              │
│  ├─ Deduct amount from learner account                                   │
│  ├─ Add amount to LMS org account                                        │
│  ├─ Create transaction record (status: COMPLETED)                        │
│  └─ Return { transactionId, status: "completed" }                        │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. LMS RECORDS PAYMENT & CREATES INSTRUCTOR PAYOUT                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LMS Backend                                                             │
│  ├─ Store in DB:                                                         │
│  │  ├─ Enrollment { learnerId, courseId, status: "pending" }             │
│  │  └─ Transaction { learnerId, courseId, instructorId,                  │
│  │                    amount, status: "PENDING",                         │
│  │                    bankTransactionId: from Bank API }                 │
│  │                                                                       │
│  ├─ Return to Frontend:                                                  │
│  │  { message: "Payment successful! Awaiting course unlock..." }         │
│  │                                                                       │
│  └─ Frontend shows message: "Your payment is being processed"            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Use Case 2: Instructor Validates & Collects Payment

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. INSTRUCTOR SEES PENDING TRANSACTION                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (Instructor Dashboard)                                         │
│  ├─ Shows: "Pending Payout: $49.99" (from course enrollment)             │
│  ├─ Button: "Validate & Withdraw"                                        │
│  └─ POST /api/instructor/withdraw/:transactionId                         │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. LMS VALIDATES TRANSACTION WITH BANK                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LMS Backend (routes/instructor.js)                                      │
│  ├─ Find transaction record by ID                                        │
│  ├─ Verify instructor owns it                                            │
│  ├─ Call Bank API to validate                                            │
│  │  POST /api/transactions/:transactionId/validate                       │
│  └─ Bank confirms payment was processed                                  │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. BANK TRANSFERS MONEY TO INSTRUCTOR                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bank API                                                                │
│  ├─ Verify transaction exists & status is "completed"                    │
│  ├─ Transfer from LMS org account → Instructor account                   │
│  │  (This is a second transfer, separate from learner payment)           │
│  ├─ Update transaction status to "VALIDATED"                             │
│  └─ Return { status: "validated", confirmed: true }                      │
│                                                                          │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. COURSE UNLOCKED FOR LEARNER                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LMS Backend                                                             │
│  ├─ Update Transaction status: "COMPLETED"                               │
│  ├─ Update Enrollment: status = "active"                                 │
│  ├─ Return: { message: "Course access granted!" }                        │
│  │                                                                       │
│  └─ Learner can now:                                                     │
│     ├─ View course materials                                             │
│     ├─ Complete lessons                                                  │
│     └─ Get certificate upon completion                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Data Models

### Transaction States

```
┌─────────────┐
│   PENDING   │ ◄─── Learner paid, waiting for instructor validation
└────────┬────┘
         │
         ▼
┌─────────────────┐
│   VALIDATED     │ ◄─── Bank confirmed instructor got paid
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   COMPLETED     │ ◄─── Course unlocked, learner can access
└─────────────────┘
```

### Enrollment Lifecycle

```
Learner selects course
        ▼
    Clicks "Enroll"
        ▼
    Payment processed (transaction PENDING)
        ▼
    Instructor validates
        ▼
    Transaction COMPLETED
        ▼
    Enrollment status = ACTIVE
        ▼
    Learner accesses materials
        ▼
    Learner completes all materials
        ▼
    Certificate issued
        ▼
    Enrollment status = COMPLETED
```

---

## 🎯 API Endpoints Overview

### LMS Backend

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Create learner or instructor account |
| `/api/auth/login` | POST | ❌ | Login & get JWT token |
| `/api/auth/profile` | GET | ✅ | Get current user info |
| `/api/courses` | GET | ❌ | List all 5 courses |
| `/api/courses/:id` | GET | ❌ | Get course details |
| `/api/courses` | POST | ✅ Instructor | Create new course |
| `/api/courses/:id/materials` | GET | ❌ | Get course materials |
| `/api/courses/:id/materials` | POST | ✅ Instructor | Add material to course |
| `/api/courses/:id/enroll` | POST | ✅ Learner | **Initiates payment** |
| `/api/courses/:id/complete` | POST | ✅ Learner | Mark course as done & get cert |
| `/api/bank/setup` | POST | ✅ | Setup bank account |
| `/api/bank/balance` | GET | ✅ | Get user balance |
| `/api/bank/pay` | POST | ✅ Learner | Process course payment |
| `/api/bank/transactions/:id/validate` | POST | ✅ | Validate transaction |
| `/api/instructor/courses` | GET | ✅ Instructor | List my courses |
| `/api/instructor/earnings` | GET | ✅ Instructor | See pending/total earnings |
| `/api/instructor/withdraw/:id` | POST | ✅ Instructor | **Withdraw & trigger bank validation** |

### Bank API

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/accounts/setup` | POST | ❌ | Create or verify account |
| `/api/accounts/:id/balance` | GET | ✅ Secret | Get account balance |
| `/api/transactions/transfer` | POST | ✅ Secret | Transfer money between accounts |
| `/api/transactions/:id` | GET | ❌ | Get transaction details |
| `/api/transactions/:id/validate` | POST | ❌ | Mark transaction as validated |

---

## 🚀 Implementation Order

1. **Bank API Setup** (Simplest - no auth needed)
   - Account creation & balance checking
   - Money transfer logic
   - Transaction records

2. **LMS Auth** (Core requirement)
   - User registration/login
   - JWT token generation

3. **Course Management** (Basic CRUD)
   - Create/fetch courses
   - Course materials

4. **Payment Flow** (Most complex)
   - Enrollment triggers payment
   - Bank interaction
   - Transaction validation

5. **Instructor Features** (Depends on 4)
   - View earnings
   - Withdraw funds
   - Get paid

6. **Certificate System** (Final feature)
   - Issue certificates on completion
   - Retrieve certificates

---

## 💡 Important Notes

- **Transactions are STATE MACHINES**: Always use proper status transitions (PENDING → VALIDATED → COMPLETED)
- **Bank is simulated**: No real payments, but same logic applies
- **3 Bank Accounts needed**:
  - LMS Organization master account (receives from learners, pays instructors)
  - Each learner account (has balance, can pay)
  - Each instructor account (receives payments)
- **5 Courses max**: Only 3 instructors can create courses
- **JWT tokens**: Include userId and role for authorization
