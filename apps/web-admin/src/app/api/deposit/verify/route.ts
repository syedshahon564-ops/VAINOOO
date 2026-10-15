import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getPaymentsFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'payments-db.json'),
    path.join(process.cwd(), 'data', 'payments-db.json'),
    path.join('/tmp', 'payments-db.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  if (process.env.VERCEL) {
    return path.join('/tmp', 'payments-db.json');
  }
  return path.join(process.cwd(), 'data', 'payments-db.json');
}

function getUsersFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json'),
    path.join(process.cwd(), 'data', 'users-db.json'),
    path.join('/tmp', 'users-db.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  if (process.env.VERCEL) {
    return path.join('/tmp', 'users-db.json');
  }
  return path.join(process.cwd(), 'data', 'users-db.json');
}

function readPaymentsDb(): any {
  try {
    const filePath = getPaymentsFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {}
  return { incomingPayments: [], depositLogs: [] };
}

function writePaymentsDb(data: any): boolean {
  try {
    const filePath = getPaymentsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    const altPath = path.join(process.cwd(), 'apps', 'web-admin', 'data', 'payments-db.json');
    if (altPath !== filePath) {
      const altDir = path.dirname(altPath);
      if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
      fs.writeFileSync(altPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    return true;
  } catch (err) {
    return false;
  }
}

function readUsers(): any[] {
  try {
    const filePath = getUsersFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function writeUsers(users: any[]) {
  try {
    const filePath = getUsersFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');

    const altPath = path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json');
    if (altPath !== filePath) {
      const altDir = path.dirname(altPath);
      if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
      fs.writeFileSync(altPath, JSON.stringify(users, null, 2), 'utf-8');
    }
  } catch (e) {}
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * DEPOSIT VERIFICATION API ENDPOINT (POST /api/deposit/verify)
 *
 * Payload:
 * {
 *   "user_id": string,
 *   "trx_id": string,
 *   "expected_amount": number
 * }
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const userId = String(payload.user_id || payload.userId || '').trim();
    const normalizedTrxId = String(payload.trx_id || payload.trxId || '').trim().toUpperCase();
    const rawExpectedAmount = payload.expected_amount !== undefined ? payload.expected_amount : payload.expectedAmount;
    const expectedAmount = rawExpectedAmount !== undefined && rawExpectedAmount !== null ? Number(rawExpectedAmount) : null;

    if (!userId || !normalizedTrxId) {
      return NextResponse.json(
        { success: false, message: '❌ user_id এবং trx_id আবশ্যক।' },
        { status: 400 }
      );
    }

    const db = readPaymentsDb();
    const incomingPayments = db.incomingPayments || [];

    // Search incoming_payments WHERE trx_id = normalizedTrxId
    const payIdx = incomingPayments.findIndex(
      (p: any) => String(p.trx_id || p.trxId || '').trim().toUpperCase() === normalizedTrxId
    );

    // c) If not found: return 404
    if (payIdx === -1) {
      return NextResponse.json({
        success: false,
        message: '❌ ট্রানজেকশন আইডি পাওয়া যায়নি! টাকা পাঠানোর পর ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।',
      }, { status: 404 });
    }

    const payment = incomingPayments[payIdx];

    // d) If found but status === 'CLAIMED': return 400
    if (payment.status === 'CLAIMED') {
      return NextResponse.json({
        success: false,
        message: '⚠️ এই ট্রানজেকশন আইডিটি ইতোমধ্যে ব্যবহার করা হয়েছে!',
        claimed_by: payment.claimed_by || payment.claimedBy,
        claimed_at: payment.claimed_at || payment.claimedAt,
      }, { status: 400 });
    }

    // e) If expected_amount does not match the actual payment amount: return 400
    const actualAmount = Number(payment.amount);
    if (expectedAmount !== null && !isNaN(expectedAmount) && expectedAmount > 0) {
      if (Math.abs(expectedAmount - actualAmount) > 0.01) {
        return NextResponse.json({
          success: false,
          message: '❌ টাকার পরিমাণ মেলেনি! আপনি পাঠিয়েছেন ৳' + payment.amount,
        }, { status: 400 });
      }
    }

    // f) Valid -> Atomic transaction
    const nowIso = new Date().toISOString();
    const users = readUsers();
    const userIdx = users.findIndex(
      (u: any) =>
        u.id === userId ||
        String(u.username || '').toLowerCase() === userId.toLowerCase() ||
        String(u.ign || '').toLowerCase() === userId.toLowerCase() ||
        String(u.phone || '').trim() === userId
    );

    let currentBalance = 0;
    let newBalance = actualAmount;
    let finalUserName = userId;

    if (userIdx !== -1) {
      currentBalance = Number(users[userIdx].walletBalance ?? users[userIdx].balance ?? 0);
      newBalance = Number((currentBalance + actualAmount).toFixed(2));
      users[userIdx].walletBalance = newBalance;
      users[userIdx].balance = newBalance;
      finalUserName = users[userIdx].username || users[userIdx].ign || userId;
      writeUsers(users);
    }

    // 1. Mark payment as CLAIMED
    payment.status = 'CLAIMED';
    payment.claimed_by = finalUserName;
    payment.claimedBy = finalUserName;
    payment.claimed_at = nowIso;
    payment.claimedAt = nowIso;
    incomingPayments[payIdx] = payment;
    db.incomingPayments = incomingPayments;

    // 2. Record entry in wallet_transactions / deposit_history
    db.depositLogs = db.depositLogs || [];
    db.depositLogs.unshift({
      id: 'dep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      trx_id: normalizedTrxId,
      trxId: normalizedTrxId,
      user_id: finalUserName,
      userId: finalUserName,
      amount: actualAmount,
      provider: payment.provider,
      status: 'SUCCESS',
      created_at: nowIso,
      processedAt: nowIso,
    });

    writePaymentsDb(db);

    // 3. Return HTTP 200 with required format
    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      message: '🎉 ডিপোজিট সফল হয়েছে! ৳' + payment.amount + ' যোগ করা হয়েছে।',
      credit_amount: payment.amount,
      data: {
        user_id: finalUserName,
        amount_credited: actualAmount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        provider: payment.provider,
        trx_id: normalizedTrxId,
      },
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
