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
  return {
    ownerAuth: { ownerId: 'admin', ownerPass: 'owner1234' },
    settings: { autoCreditEnabled: true, secretApiKey: 'ff_rivals_secure_sms_key_2026' },
    connectedDevices: [],
    incomingPayments: [],
    depositLogs: [],
  };
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
    const db = readPaymentsDb();
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.WEBHOOK_SECRET_KEY || db.settings?.secretApiKey || 'ff_rivals_secure_sms_key_2026';

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid x-api-key header' },
        { status: 401 }
      );
    }

    const payload = await req.json();
    const provider = String(payload.provider || 'BKASH').toUpperCase();
    const sender = String(payload.sender || '').trim();
    const rawTrx = String(payload.trx_id || payload.trxId || '').trim().toUpperCase();
    const amountNum = parseFloat(String(payload.amount || '0'));
    const rawMessage = String(payload.raw_message || payload.rawMessage || '');
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!rawTrx) {
      return NextResponse.json({ success: false, error: 'trx_id is required' }, { status: 400 });
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ success: false, error: 'Valid positive amount is required' }, { status: 400 });
    }

    db.incomingPayments = db.incomingPayments || [];

    // Idempotency check: duplicate TrxID
    const existing = db.incomingPayments.find(
      (p: any) => String(p.trxId).toUpperCase() === rawTrx
    );

    if (existing) {
      return NextResponse.json({
        success: true,
        status: 'DUPLICATE',
        message: 'Webhook received previously (idempotent duplicate skipped)',
        trx_id: rawTrx,
        payment_status: existing.status,
      }, { status: 200 });
    }

    // Auto-detect matching user if phone number matches a registered player
    const autoCreditEnabled = db.settings?.autoCreditEnabled ?? true;
    let autoClaimedUser: any = null;

    if (autoCreditEnabled && sender) {
      const cleanSender = sender.replace(/\D/g, '').slice(-11); // e.g. 017xxxxxxxx
      if (cleanSender.length >= 10) {
        const users = readUsers();
        const userIdx = users.findIndex((u: any) => {
          const uPhone = String(u.phone || '').replace(/\D/g, '').slice(-11);
          return uPhone === cleanSender;
        });

        if (userIdx !== -1) {
          users[userIdx].walletBalance = (Number(users[userIdx].walletBalance) || 0) + amountNum;
          autoClaimedUser = users[userIdx];
          writeUsers(users);
        }
      }
    }

    const newPayment = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      trxId: rawTrx,
      provider,
      sender,
      amount: amountNum,
      status: autoClaimedUser ? 'CLAIMED' : 'UNCLAIMED',
      claimedBy: autoClaimedUser ? (autoClaimedUser.username || autoClaimedUser.ign) : null,
      claimedAt: autoClaimedUser ? new Date().toISOString() : null,
      rawMessage,
      createdAt: timestamp,
      autoCredited: Boolean(autoClaimedUser),
    };

    db.incomingPayments.unshift(newPayment);

    if (autoClaimedUser) {
      db.depositLogs = db.depositLogs || [];
      db.depositLogs.unshift({
        id: 'log_' + Date.now(),
        userId: autoClaimedUser.username || autoClaimedUser.ign,
        trxId: rawTrx,
        amount: amountNum,
        status: 'SUCCESS',
        processedAt: new Date().toISOString(),
      });
    }

    // Update connected device ping if device header is present
    const devHeader = req.headers.get('x-device-name');
    if (devHeader) {
      db.connectedDevices = db.connectedDevices || [];
      const dIdx = db.connectedDevices.findIndex((d: any) => d.deviceName === devHeader);
      const devObj = {
        deviceId: 'dev_' + devHeader.toLowerCase().replace(/\s+/g, '_'),
        deviceName: devHeader,
        phone: sender || 'Active',
        status: 'ONLINE',
        battery: 100,
        lastPing: new Date().toISOString(),
      };
      if (dIdx !== -1) db.connectedDevices[dIdx] = devObj;
      else db.connectedDevices.unshift(devObj);
    }

    writePaymentsDb(db);

    return NextResponse.json({
      success: true,
      status: autoClaimedUser ? 'AUTO_CREDITED' : 'STORED',
      message: autoClaimedUser
        ? `Payment received and automatically credited ৳${amountNum} to user ${autoClaimedUser.username}`
        : 'Incoming payment stored successfully with status UNCLAIMED',
      data: newPayment,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
