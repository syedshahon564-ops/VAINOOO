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
    const url = new URL(req.url);
    const db = readPaymentsDb();
    const queryKey = url.searchParams.get('key') || url.searchParams.get('apiKey') || url.searchParams.get('secret');
    const headerKey = req.headers.get('x-api-key');
    const apiKey = headerKey || queryKey;
    const expectedKey = process.env.WEBHOOK_SECRET_KEY || db.settings?.secretApiKey || 'ff_rivals_secure_sms_key_2026';

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid API key (use x-api-key header or ?key= query)' },
        { status: 401 }
      );
    }

    let payload: any = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw_message: text };
      }
    }

    let rawMessage = String(
      payload.raw_message || payload.rawMessage || payload.message || payload.text || payload.body || ''
    ).trim();
    let rawTrx = String(payload.trx_id || payload.trxId || '').trim().toUpperCase();
    let amountNum = parseFloat(String(payload.amount || '0'));
    let sender = String(payload.sender || '').trim();
    let provider = String(payload.provider || 'BKASH').toUpperCase();
    const timestamp = payload.timestamp || new Date().toISOString();

    // Smart Auto-Extraction from raw SMS message if fields are missing
    if (rawMessage) {
      if (!rawTrx) {
        const trxMatch = rawMessage.match(/(?:TrxID|TxnID|Trx|Transaction ID)\s*[:.]?\s*([A-Z0-9]{8,14})/i);
        if (trxMatch) rawTrx = trxMatch[1].toUpperCase();
      }
      if (isNaN(amountNum) || amountNum <= 0) {
        const amtMatch = rawMessage.match(/(?:Tk|BDT|amount)\s*[:.]?\s*([\d,]+\.?\d*)/i);
        if (amtMatch) amountNum = parseFloat(amtMatch[1].replace(/,/g, ''));
      }
      if (!sender) {
        const senderMatch = rawMessage.match(/(?:from|sender)\s*[:.]?\s*(01\d{9})/i);
        if (senderMatch) sender = senderMatch[1];
      }
      if (/nagad/i.test(rawMessage)) provider = 'NAGAD';
      else if (/rocket/i.test(rawMessage)) provider = 'ROCKET';
      else if (/bkash/i.test(rawMessage)) provider = 'BKASH';
    }

    if (!rawTrx) {
      return NextResponse.json(
        { success: false, error: 'trx_id is required or could not be detected from SMS text' },
        { status: 400 }
      );
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid positive amount is required or could not be detected from SMS text' },
        { status: 400 }
      );
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('key') || url.searchParams.get('apiKey') || url.searchParams.get('secret');
  const headerKey = req.headers.get('x-api-key');
  const apiKey = headerKey || queryKey;
  const db = readPaymentsDb();
  const expectedKey = process.env.WEBHOOK_SECRET_KEY || db.settings?.secretApiKey || 'ff_rivals_secure_sms_key_2026';

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json({
      status: 'ONLINE',
      service: 'FF Rivals bKash/Nagad Webhook Service',
      instructions: 'Send POST requests with ?key=ff_rivals_secure_sms_key_2026 or Header x-api-key',
    });
  }

  const rawText = url.searchParams.get('text') || url.searchParams.get('msg') || url.searchParams.get('message') || '';
  const trx = url.searchParams.get('trx_id') || url.searchParams.get('trx') || '';
  const amt = url.searchParams.get('amount') || '';

  if (rawText || (trx && amt)) {
    const mockPostReq = new Request(req.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': expectedKey,
      },
      body: JSON.stringify({
        trx_id: trx,
        amount: amt,
        raw_message: rawText,
        sender: url.searchParams.get('sender') || url.searchParams.get('phone') || '',
        provider: url.searchParams.get('provider') || 'BKASH',
      }),
    });
    return POST(mockPostReq);
  }

  return NextResponse.json({
    status: 'AUTHENTICATED',
    message: 'Webhook endpoint is active and ready to receive incoming payments.',
    totalPayments: (db.incomingPayments || []).length,
  });
}

