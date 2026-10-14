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

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const userId = String(payload.user_id || payload.userId || '').trim();
    const rawTrx = String(payload.trx_id || payload.trxId || '').trim().toUpperCase();

    if (!userId || !rawTrx) {
      return NextResponse.json(
        { success: false, error: 'user_id and trx_id are required' },
        { status: 400 }
      );
    }

    const db = readPaymentsDb();
    const payIdx = (db.incomingPayments || []).findIndex(
      (p: any) => String(p.trxId).toUpperCase() === rawTrx
    );

    // 1. Not Found -> FAILED (Explicit failed response for invalid/fake transactions)
    if (payIdx === -1) {
      return NextResponse.json({
        success: false,
        status: 'FAILED',
        message: '❌ ট্রানজেকশন ভেরিফিকেশন ব্যর্থ হয়েছে (FAILED)! TrxID ভুল অথবা এখনও কোনো পেমেন্ট সার্ভারে আসেনি। সঠিক TrxID লিখুন।',
        trx_id: rawTrx,
      }, { status: 400 });
    }

    const payment = db.incomingPayments[payIdx];

    // 2. Already Claimed -> ALREADY_USED
    if (payment.status === 'CLAIMED') {
      return NextResponse.json({
        success: false,
        status: 'ALREADY_USED',
        message: '❌ ভেরিফিকেশন ব্যর্থ হয়েছে (FAILED)! এই TrxID দিয়ে ইতিমধ্যে টাকা গ্রহণ করা হয়েছে।',
        trx_id: rawTrx,
        claimed_by: payment.claimedBy,
        claimed_at: payment.claimedAt,
      }, { status: 400 });
    }

    // 3. UNCLAIMED -> Atomic update & credit
    const creditAmount = Number(payment.amount) || 0;
    const users = readUsers();
    const userIdx = users.findIndex(
      (u: any) =>
        u.id === userId ||
        String(u.username || '').toLowerCase() === userId.toLowerCase() ||
        String(u.ign || '').toLowerCase() === userId.toLowerCase() ||
        String(u.phone || '').trim() === userId
    );

    let currentBalance = 0;
    let newBalance = creditAmount;
    let finalUserName = userId;

    if (userIdx !== -1) {
      currentBalance = Number(users[userIdx].walletBalance) || 0;
      newBalance = currentBalance + creditAmount;
      users[userIdx].walletBalance = newBalance;
      finalUserName = users[userIdx].username || users[userIdx].ign;
      writeUsers(users);
    }

    // Update payment record
    payment.status = 'CLAIMED';
    payment.claimedBy = finalUserName;
    payment.claimedAt = new Date().toISOString();
    db.incomingPayments[payIdx] = payment;

    // Create deposit audit log
    db.depositLogs = db.depositLogs || [];
    db.depositLogs.unshift({
      id: 'log_' + Date.now(),
      userId: finalUserName,
      trxId: rawTrx,
      amount: creditAmount,
      status: 'SUCCESS',
      processedAt: new Date().toISOString(),
    });

    writePaymentsDb(db);

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      credit_amount: creditAmount,
      message: `🎉 ট্রানজেকশন সফল হয়েছে (SUCCESS)! ৳${creditAmount} আপনার ওয়ালেটে সাথে সাথে যোগ করা হয়েছে।`,
      data: {
        user_id: finalUserName,
        amount_credited: creditAmount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        provider: payment.provider,
        trx_id: rawTrx,
      },
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
