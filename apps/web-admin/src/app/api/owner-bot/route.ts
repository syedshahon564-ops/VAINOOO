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
  } catch (err) {
    console.error('Failed reading payments db:', err);
  }
  return {
    ownerAuth: { ownerId: 'admin', ownerPass: 'owner1234' },
    settings: {
      autoCreditEnabled: true,
      notifySound: true,
      secretApiKey: 'ff_rivals_secure_sms_key_2026',
    },
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
    console.error('Failed writing payments db:', err);
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

export async function GET(req: Request) {
  try {
    const db = readPaymentsDb();
    const payments = db.incomingPayments || [];
    const devices = db.connectedDevices || [];
    const settings = db.settings || {};

    const totalReceived = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const autoCredited = payments
      .filter((p: any) => p.status === 'CLAIMED')
      .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const unclaimed = payments
      .filter((p: any) => p.status === 'UNCLAIMED')
      .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

    return NextResponse.json({
      ok: true,
      stats: {
        totalReceived,
        autoCredited,
        unclaimed,
        totalCount: payments.length,
        unclaimedCount: payments.filter((p: any) => p.status === 'UNCLAIMED').length,
        devicesCount: devices.length,
      },
      payments: payments.slice(0, 50),
      devices,
      settings: {
        autoCreditEnabled: settings.autoCreditEnabled ?? true,
        notifySound: settings.notifySound ?? true,
        secretApiKey: settings.secretApiKey || 'ff_rivals_secure_sms_key_2026',
        webhookUrl: settings.webhookUrl || 'https://web-production-2c40b.up.railway.app/api/webhook/payment',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readPaymentsDb();

    // 1. Owner Login
    if (body.action === 'login') {
      const { ownerId, ownerPass } = body;
      const expectedId = db.ownerAuth?.ownerId || 'admin';
      const expectedPass = db.ownerAuth?.ownerPass || 'owner1234';

      if (ownerId === expectedId && ownerPass === expectedPass) {
        const token = 'owner_session_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        return NextResponse.json({
          ok: true,
          token,
          owner: { id: expectedId, role: 'SUPER_OWNER' },
        });
      }
      return NextResponse.json({ ok: false, error: 'ভুল Owner ID অথবা পাসওয়ার্ড!' }, { status: 401 });
    }

    // 2. Toggle Auto-Credit Bot
    if (body.action === 'toggle_auto_credit') {
      db.settings = {
        ...db.settings,
        autoCreditEnabled: Boolean(body.enabled),
      };
      writePaymentsDb(db);
      return NextResponse.json({ ok: true, autoCreditEnabled: db.settings.autoCreditEnabled });
    }

    // 3. Manual Credit Balance to User
    if (body.action === 'manual_credit') {
      const { trxId, userId } = body;
      const payIdx = (db.incomingPayments || []).findIndex(
        (p: any) => String(p.trxId).toUpperCase() === String(trxId).toUpperCase()
      );

      if (payIdx === -1) {
        return NextResponse.json({ ok: false, error: 'Transaction ID পাওয়া যায়নি' }, { status: 404 });
      }

      const payment = db.incomingPayments[payIdx];
      const creditAmount = Number(payment.amount) || 0;

      // Find user
      const users = readUsers();
      const userIdx = users.findIndex(
        (u: any) =>
          u.id === userId ||
          String(u.username || '').toLowerCase() === String(userId).toLowerCase() ||
          String(u.phone || '').trim() === String(userId).trim()
      );

      let targetUsername = userId;
      if (userIdx !== -1) {
        users[userIdx].walletBalance = (Number(users[userIdx].walletBalance) || 0) + creditAmount;
        targetUsername = users[userIdx].username || users[userIdx].ign;
        writeUsers(users);
      }

      payment.status = 'CLAIMED';
      payment.claimedBy = targetUsername;
      payment.claimedAt = new Date().toISOString();
      db.incomingPayments[payIdx] = payment;

      // Add to deposit log
      db.depositLogs = db.depositLogs || [];
      db.depositLogs.unshift({
        id: 'log_' + Date.now(),
        userId: targetUsername,
        trxId: payment.trxId,
        amount: creditAmount,
        status: 'SUCCESS',
        processedAt: new Date().toISOString(),
      });

      writePaymentsDb(db);
      return NextResponse.json({
        ok: true,
        message: `৳${creditAmount} সফলভাবে ${targetUsername}-এর অ্যাকাউন্টে যোগ করা হয়েছে!`,
        payment,
      });
    }

    // 4. Update Owner Password
    if (body.action === 'update_owner_auth') {
      const { newOwnerId, newOwnerPass } = body;
      if (!newOwnerId || !newOwnerPass) {
        return NextResponse.json({ ok: false, error: 'নতুন আইডি ও পাসওয়ার্ড দিন' }, { status: 400 });
      }
      db.ownerAuth = {
        ownerId: String(newOwnerId).trim(),
        ownerPass: String(newOwnerPass).trim(),
        updatedAt: new Date().toISOString(),
      };
      writePaymentsDb(db);
      return NextResponse.json({ ok: true, message: 'Owner credentials সফলভাবে আপডেট হয়েছে!' });
    }

    // 5. Connect Phone / Device Heartbeat
    if (body.action === 'device_ping') {
      const { deviceName, phone, battery } = body;
      const deviceId = body.deviceId || 'dev_' + Date.now();
      db.connectedDevices = db.connectedDevices || [];
      const dIdx = db.connectedDevices.findIndex((d: any) => d.deviceId === deviceId);

      const deviceData = {
        deviceId,
        deviceName: deviceName || 'Android SMS Forwarder Phone',
        phone: phone || 'Active',
        status: 'ONLINE',
        battery: battery || 100,
        lastPing: new Date().toISOString(),
      };

      if (dIdx !== -1) {
        db.connectedDevices[dIdx] = deviceData;
      } else {
        db.connectedDevices.unshift(deviceData);
      }
      writePaymentsDb(db);
      return NextResponse.json({ ok: true, device: deviceData });
    }

    return NextResponse.json({ ok: false, error: 'অজানা অ্যাকশন' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
