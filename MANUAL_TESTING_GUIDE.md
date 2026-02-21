# LMS Platform - Manual E2E Testing Guide

This guide provides the necessary context, scenarios, and credentials to manually walk through the entire end-to-end flow of the LMS application. It covers both frontend UI interactions and backend database verifications.

## Prerequisites & Setup
*   **LMS Backend:** Running on `http://localhost:3001`
*   **Bank API:** Running on `http://localhost:3002`
*   **LMS Frontend:** Running on `http://localhost:8080`
*   **Database (MongoDB):** Open DataGrip (or MongoDB Compass) and establish these two connections:
    1.  **LMS Database:** `mongodb+srv://2022331008_db_user:lasker%23529@cluster0.cvsazh8.mongodb.net/lms?appName=Cluster0`
    2.  **Bank Database:** `mongodb+srv://2022331008_db_user:lasker%23529@cluster0.cvsazh8.mongodb.net/bank?appName=Cluster0`

---

## The Testing Scenario

We will simulate a transaction between an **Instructor (Bob)** and a **Learner (Alice)**.
The LMS platform acts as an escrow agent, temporarily holding Alice's payment until Bob manually validates it.

### Step 1: Instructor Onboarding & Course Creation
1.  **Frontend Action:** Navigate to `http://localhost:8080/register`. Register a new user with the `Teach` role.
    *   *Name:* Bob Smith
    *   *Email:* bob@test.com
    *   *Password:* password123
2.  **Frontend Action:** After registration, you will be prompted to connect a bank account. Enter:
    *   *Account Number:* `999888777`
    *   *Secret:* `bobsecret`
3.  **Frontend Action:** From the dashboard, create a new course.
    *   *Title:* Mastering Next.js
    *   *Price:* `$49.99`
4.  **Database Check (DataGrip):**
    *   In the **Bank database** (`bank_users` collection), verify Bob's account (`999888777`) has been created with a `$10,000` starting balance, plus the `$100` course upload bonus (Total: `$10,100`).
    *   In the **LMS database** (`courses` collection), verify the new course exists.

### Step 2: Learner Registration & Enrollment
1.  **Frontend Action:** Log out as Bob. Go back to `/register` and create a `Learn` role user.
    *   *Name:* Alice Jones
    *   *Email:* alice@test.com
    *   *Password:* password123
2.  **Frontend Action:** Connect Alice's bank account. **Crucial: Use different credentials than Bob.**
    *   *Account Number:* `111222333`
    *   *Secret:* `alicesecret`
3.  **Frontend Action:** Navigate to the `Courses` page. Find "Mastering Next.js" and click **Enroll Now**. Proceed to **Confirm & Pay**.
4.  **Observability (Frontend):** Notice that the course detail page now shows a warning that the payment is "processing" and waiting for validation. You cannot access the course materials yet.

### Step 3: Verifying the "Pending" Money Flow
This is where you prove the LMS platform is safely holding the funds.
1.  **Database Check (DataGrip - Bank Database):**
    *   Look up Alice's account (`111222333`). Verify her balance is exactly `$10,000 - $49.99 = $9,950.01`.
    *   Look up the **LMS Platform Account** (`lms_org_account_001`). Verify its balance has increased by `$49.99`.
2.  **Database Check (DataGrip - LMS Database):**
    *   Look at the `transactions` collection. You should see a document where `type` is `payment` and `status` is exactly **`"pending"`**.

### Step 4: The Validation (Instructor Payout)
1.  **Frontend Action:** Log out as Alice. Log back in as **Bob** (`bob@test.com`).
2.  **Frontend Action:** Look at the Instructor Dashboard. Under "Pending Transactions", you should see Alice's $49.99 payment. Click **Withdraw**.
3.  **Database Check (DataGrip - Bank Database):**
    *   Look up the **LMS Platform Account** (`lms_org_account_001`). The `$49.99` should now be deducted.
    *   Look up Bob's account (`999888777`). His balance should have increased by `$49.99`!
4.  **Database Check (DataGrip - LMS Database):**
    *   In the `transactions` collection, the record should now show `type: "payout"` and `status: "validated"`.

### Step 5: Completing the Course
1.  **Frontend Action:** Log out as Bob. Log back in as **Alice** (`alice@test.com`).
2.  **Frontend Action:** Navigate to the "Mastering Next.js" course page. The "processing" warning will be gone.
3.  **Frontend Action:** Click the newly visible **Complete Course** button.
4.  **Verification:** Check the Dashboard. Alice should have exactly 1 certificate issued for the course.
    
---

## Troubleshooting with cURL
If the frontend gets stuck, you can manually trigger backend events using cURL or Postman to isolate the issue.

**1. Check a Bank Balance Directly (Bypassing LMS):**
```bash
curl "http://localhost:3002/api/accounts/111222333/balance?secret=alicesecret"
```

**2. Test the LMS login (to get a JWT):**
*Note: Run this in PowerShell*
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body '{"email":"bob@test.com","password":"password123"}' -ContentType "application/json"
$token = $response.token
```

**3. Test a withdrawal via cURL (Requires the JWT token and the transaction ID from the database):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/instructor/withdraw/[TRANSACTION_ID]" -Method Post -Headers @{Authorization="Bearer $token"}
```
