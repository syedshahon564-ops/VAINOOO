# 💳 bKash & Nagad Auto-Deposit & Webhook Verification Microservice

Production-grade, standalone Node.js & TypeScript microservice for automated bKash and Nagad deposits. Built with Express, Prisma, atomic database transactions, rate limiting, and strict API key security.

---

## 🏗️ Architecture & Flow Overview

```
[Mobile Forwarder App / SMS]
            │ (Forwarded SMS notification)
            ▼
    POST /api/webhook/payment  (Header: x-api-key)
            │
            ├─► Sanitize TrxID (uppercase, trim)
            ├─► Idempotency check (prevent duplicate entries)
            └─► Store in IncomingPayments (status: UNCLAIMED)

[User on Web / Mobile App / Bot]
            │ (Submits TrxID to claim deposit)
            ▼
    POST /api/deposit/verify
            │
            ├─► Step 1: Find TrxID in IncomingPayments
            ├─► Step 2: If NOT found ──► Return 'PENDING' (Race condition handling)
            ├─► Step 3: If status is 'CLAIMED' ──► Return 'ALREADY_USED'
            └─► Step 4: If status is 'UNCLAIMED' ──► ATOMIC TRANSACTION:
                    ├── Mark TrxID as 'CLAIMED' (claimed_by = user_id, claimed_at = now)
                    ├── Increment user balance: user.balance += transaction.amount
                    ├── Create DepositLog audit entry
                    └── Return 'SUCCESS' with updated balance
```

---

## 🚀 Quick Start & Setup

### 1. Install Dependencies
```bash
cd services/payment-deposit-service
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env`:
```env
PORT=4000
NODE_ENV=development
WEBHOOK_SECRET_KEY=ff_rivals_secure_sms_key_2026
DATABASE_URL="file:./dev.db"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
VERIFY_RATE_LIMIT_MAX=30
```

> **Note on Database**: By default, it uses SQLite (`file:./dev.db`) with zero setup. To use PostgreSQL, MySQL, or CockroachDB, simply change the `provider = "postgresql"` in `prisma/schema.prisma` and put your database URL in `DATABASE_URL`.

### 3. Generate Prisma Client & Push Database Schema
```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Start the Service
```bash
# Development (Hot-reloading with tsx)
npm run dev

# Production
npm run build
npm start
```

---

## 🔌 Connecting to Your Existing User Database

You have two easy integration options:

### Option A: Use the Shared Database (Recommended if using PostgreSQL/MySQL)
Point `DATABASE_URL` in `.env` to your existing platform's PostgreSQL/MySQL database. The microservice's `User` model matches your `users` table, allowing Prisma transactions to update balances directly.

### Option B: Webhook / REST Adapter Hook
If your users are hosted in a separate MongoDB or external microservice, open `src/services/user-balance-adapter.ts` and customize `creditExternalUserBalance()` to call your existing API or write to your database.

---

## 🧪 Comprehensive cURL Testing Guide

### 1. Webhook Ingestion (`POST /api/webhook/payment`)

#### A. Unauthorized Attempt (Should return 401 Unauthorized)
```bash
curl -X POST http://localhost:4000/api/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "bkash",
    "sender": "01712345678",
    "amount": 500,
    "trx_id": "BKH9283746",
    "raw_message": "You have received Tk 500.00 from 01712345678. TrxID BKH9283746"
  }'
```

#### B. Valid Ingestion (bKash Deposit)
```bash
curl -X POST http://localhost:4000/api/webhook/payment \
  -H "Content-Type: application/json" \
  -H "x-api-key: ff_rivals_secure_sms_key_2026" \
  -d '{
    "provider": "bkash",
    "sender": "01711223344",
    "amount": 250,
    "trx_id": "BK82910398A",
    "raw_message": "You have received Tk 250.00 from 01711223344. TrxID BK82910398A"
  }'
```
**Expected Response (201 Created):**
```json
{
  "success": true,
  "status": "STORED",
  "message": "Incoming payment stored successfully with status UNCLAIMED",
  "data": {
    "trx_id": "BK82910398A",
    "provider": "BKASH",
    "amount": 250,
    "sender": "01711223344",
    "status": "UNCLAIMED"
  }
}
```

#### C. Valid Ingestion (Nagad Deposit)
```bash
curl -X POST http://localhost:4000/api/webhook/payment \
  -H "Content-Type: application/json" \
  -H "x-api-key: ff_rivals_secure_sms_key_2026" \
  -d '{
    "provider": "nagad",
    "sender": "01999887766",
    "amount": 500,
    "trx_id": "NG77665544B",
    "raw_message": "Money received. Amount: Tk 500.00. Sender: 01999887766. TxnID: NG77665544B"
  }'
```

#### D. Duplicate Webhook (Testing Idempotency)
Re-run the exact same command above:
**Expected Response (200 OK):**
```json
{
  "success": true,
  "status": "DUPLICATE",
  "message": "Webhook received previously (idempotent duplicate skipped)",
  "trx_id": "NG77665544B"
}
```

---

### 2. User Deposit Verification (`POST /api/deposit/verify`)

#### A. User Submits Before SMS Arrives (Testing 'PENDING' Status)
```bash
curl -X POST http://localhost:4000/api/deposit/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr-test-101",
    "trx_id": "NON_EXISTENT_TRX_999"
  }'
```
**Expected Response (200 OK):**
```json
{
  "success": false,
  "status": "PENDING",
  "message": "Payment notification not yet received. Please wait 1-2 minutes for SMS forwarding and retry.",
  "trx_id": "NON_EXISTENT_TRX_999"
}
```

#### B. User Successfully Claims Valid Unclaimed Deposit
```bash
curl -X POST http://localhost:4000/api/deposit/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr-test-101",
    "trx_id": "BK82910398A",
    "expected_amount": 250
  }'
```
**Expected Response (200 OK):**
```json
{
  "success": true,
  "status": "SUCCESS",
  "message": "Deposit verified and balance credited successfully.",
  "data": {
    "user_id": "usr-test-101",
    "username": "player_usr-test",
    "previous_balance": 0,
    "amount_credited": 250,
    "new_balance": 250,
    "provider": "BKASH",
    "trx_id": "BK82910398A"
  }
}
```

#### C. User or Attacker Attempts Double-Claiming (Testing 'ALREADY_USED')
Run the verification again for the same transaction ID:
```bash
curl -X POST http://localhost:4000/api/deposit/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr-test-999",
    "trx_id": "BK82910398A"
  }'
```
**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "status": "ALREADY_USED",
  "message": "This transaction ID has already been claimed and credited.",
  "trx_id": "BK82910398A",
  "claimed_by": "usr-test-101"
}
```

---

### 3. Admin / Dashboard Stats (`GET /api/webhook/stats`)
```bash
curl -X GET http://localhost:4000/api/webhook/stats \
  -H "x-api-key: ff_rivals_secure_sms_key_2026"
```
**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total": 2,
    "unclaimed": 1,
    "claimed": 1,
    "recent": [...]
  }
}
```
