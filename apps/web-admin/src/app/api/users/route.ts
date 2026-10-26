import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getCandidatePaths(): string[] {
  const list = [
    path.join(process.cwd(), 'data', 'users-db.json'),
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json'),
    path.join('/tmp', 'users-db.json'),
  ];
  return Array.from(new Set(list));
}

function getUsersFilePath(): string {
  for (const p of getCandidatePaths()) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return path.join(process.cwd(), 'data', 'users-db.json');
}

function ensureDataFile(targetPath: string) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let inMemoryUsersCache: any[] | null = null;
let usersVersion: number = Date.now();

function readUsersFromFile(): any[] {
  if (inMemoryUsersCache && inMemoryUsersCache.length > 0) {
    return inMemoryUsersCache;
  }
  const dataFile = getUsersFilePath();
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryUsersCache = parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading users file:', err);
  }
  return inMemoryUsersCache || [];
}

function writeUsersToFile(users: any[]): boolean {
  inMemoryUsersCache = users;
  usersVersion = Date.now();
  const payload = JSON.stringify(users, null, 2);
  let anyWritten = false;
  for (const p of getCandidatePaths()) {
    try {
      ensureDataFile(p);
      fs.writeFileSync(p, payload, 'utf-8');
      anyWritten = true;
    } catch (e) {}
  }
  return anyWritten;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientV = url.searchParams.get('v');

    if (clientV && inMemoryUsersCache && String(clientV) === String(usersVersion)) {
      return NextResponse.json(
        { ok: true, unchanged: true, v: usersVersion },
        {
          headers: {
            'Cache-Control': 'no-cache, must-revalidate',
          },
        }
      );
    }

    const users = readUsersFromFile();

    if (clientV && String(clientV) === String(usersVersion)) {
      return NextResponse.json(
        { ok: true, unchanged: true, v: usersVersion },
        {
          headers: {
            'Cache-Control': 'no-cache, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      { ok: true, users, _v: usersVersion },
      {
        headers: {
          'Cache-Control': 'no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currentUsers = readUsersFromFile();

    // 1. Register Action
    if (body.action === 'register') {
      const newUser = body.user;
      if (!newUser || (!newUser.username && !newUser.phone) || !newUser.password) {
        return NextResponse.json({ ok: false, error: 'Username/phone and password are required' }, { status: 400 });
      }

      const cleanU = String(newUser.username || '').trim().toLowerCase();
      const cleanMail = String(newUser.email || '').trim().toLowerCase();
      const cleanPhone = String(newUser.phone || '').trim();

      const exists = currentUsers.some((u: any) => {
        const uName = String(u.username || u.ign || '').trim().toLowerCase();
        const uMail = String(u.email || '').trim().toLowerCase();
        const uPhone = String(u.phone || '').trim();
        return (cleanU && uName === cleanU) || (cleanMail && uMail === cleanMail) || (cleanPhone && uPhone === cleanPhone);
      });

      if (exists) {
        return NextResponse.json({ ok: false, error: 'User already exists' }, { status: 400 });
      }

      const DEFAULT_AVATARS = [
        '/avatars/avatar-1.png',
        '/avatars/avatar-2.png',
        '/avatars/avatar-3.png',
        '/avatars/avatar-4.png',
        '/avatars/avatar-5.png',
      ];
      if (!newUser.avatar || newUser.avatar === '/avatars/avatar-2.jpg') {
        newUser.avatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
      }

      currentUsers.unshift(newUser);
      writeUsersToFile(currentUsers);
      return NextResponse.json({ ok: true, user: newUser });
    }

    // 2. Direct Sync Action (bulk save from client or admin)
    if (body.action === 'sync' && Array.isArray(body.users)) {
      const mergedMap = new Map<string, any>();
      currentUsers.forEach((u: any) => {
        if (u && u.id) mergedMap.set(u.id, u);
      });

      body.users.forEach((incoming: any) => {
        if (!incoming || !incoming.id) return;
        const existing = mergedMap.get(incoming.id);
        if (!existing) {
          mergedMap.set(incoming.id, incoming);
        } else {
          const inTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
          const exTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const effectiveBalance =
            inTime >= exTime && incoming.walletBalance !== undefined
              ? incoming.walletBalance
              : existing.walletBalance !== undefined
              ? existing.walletBalance
              : incoming.walletBalance;

          mergedMap.set(incoming.id, {
            ...existing,
            ...incoming,
            walletBalance: effectiveBalance,
            updatedAt: new Date(Math.max(inTime, exTime || Date.now())).toISOString(),
          });
        }
      });

      const merged = Array.from(mergedMap.values());
      writeUsersToFile(merged);
      return NextResponse.json({ ok: true, count: merged.length });
    }

    // 3. Update Action (Instant Balance or User Details Upsert)
    if (body.action === 'update' && body.userId && body.updates) {
      const cleanTarget = String(body.userId).trim().toLowerCase();
      const idx = currentUsers.findIndex(
        (u: any) =>
          String(u.id || '').trim().toLowerCase() === cleanTarget ||
          String(u.phone || '').trim().toLowerCase() === cleanTarget ||
          String(u.username || '').trim().toLowerCase() === cleanTarget ||
          String(u.ign || '').trim().toLowerCase() === cleanTarget
      );

      if (idx !== -1) {
        currentUsers[idx] = { ...currentUsers[idx], ...body.updates };
        writeUsersToFile(currentUsers);
        return NextResponse.json({ ok: true, user: currentUsers[idx] });
      } else {
        const restoredUser = { id: body.userId, ...body.updates };
        currentUsers.unshift(restoredUser);
        writeUsersToFile(currentUsers);
        return NextResponse.json({ ok: true, user: restoredUser });
      }
    }

    // 4. Purge Non-Owners Action (keeps only owner accounts, deleting all player IDs)
    if (body.action === 'purge_non_owners' || body.action === 'reset_players') {
      const ownersOnly = currentUsers.filter((u: any) => u.role === 'ADMIN' || String(u.id).startsWith('u-owner'));
      writeUsersToFile(ownersOnly);
      return NextResponse.json({
        ok: true,
        message: 'All player accounts deleted, only owner IDs preserved.',
        count: ownersOnly.length,
        users: ownersOnly,
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
