import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

function readUsersFromFile(): any[] {
  if (inMemoryUsersCache) return inMemoryUsersCache;
  try {
    const dataFile = getUsersFilePath();
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        inMemoryUsersCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading users file:', err);
  }
  return [];
}

function writeUsersToFile(users: any[]): boolean {
  inMemoryUsersCache = users;
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json'),
    path.join(process.cwd(), 'data', 'users-db.json'),
    path.join('/tmp', 'users-db.json'),
  ];

  let anyWritten = false;
  // Write first candidate synchronously
  if (possiblePaths.length > 0) {
    try {
      ensureDataFile(possiblePaths[0]);
      fs.writeFileSync(possiblePaths[0], JSON.stringify(users, null, 2), 'utf-8');
      anyWritten = true;
    } catch (e) {}
  }

  // Write remaining asynchronously
  if (possiblePaths.length > 1) {
    Promise.resolve().then(() => {
      for (let i = 1; i < possiblePaths.length; i++) {
        try {
          ensureDataFile(possiblePaths[i]);
          fs.writeFileSync(possiblePaths[i], JSON.stringify(users, null, 2), 'utf-8');
        } catch (err) {}
      }
    }).catch(() => {});
  }
  return anyWritten;
}

export async function GET() {
  try {
    const users = readUsersFromFile();
    return NextResponse.json(
      { ok: true, users },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
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
      if (!newUser || !newUser.username || !newUser.password) {
        return NextResponse.json({ ok: false, error: 'Username and password are required' }, { status: 400 });
      }

      const cleanU = String(newUser.username).trim().toLowerCase();
      const cleanMail = String(newUser.email || '').trim().toLowerCase();

      const exists = currentUsers.some((u: any) => {
        const uName = String(u.username || u.ign || '').trim().toLowerCase();
        const uMail = String(u.email || '').trim().toLowerCase();
        return uName === cleanU || (cleanMail && uMail === cleanMail);
      });

      if (exists) {
        return NextResponse.json({ ok: false, error: 'Username or email already exists' }, { status: 400 });
      }

      currentUsers.unshift(newUser);
      writeUsersToFile(currentUsers);
      return NextResponse.json({ ok: true, user: newUser });
    }

    // 2. Direct Sync Action (bulk save from client or admin)
    if (body.action === 'sync' && Array.isArray(body.users)) {
      // Merge users without duplicate IDs
      const map = new Map<string, any>();
      body.users.forEach((u: any) => {
        if (u && u.id) map.set(u.id, u);
      });
      currentUsers.forEach((u: any) => {
        if (u && u.id && !map.has(u.id)) map.set(u.id, u);
      });
      const merged = Array.from(map.values());
      writeUsersToFile(merged);
      return NextResponse.json({ ok: true, count: merged.length });
    }

    // 3. Update Action (Upsert)
    if (body.action === 'update' && body.userId && body.updates) {
      const idx = currentUsers.findIndex((u: any) => u.id === body.userId);
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
      return NextResponse.json({ ok: true, message: 'All player accounts deleted, only owner IDs preserved.', count: ownersOnly.length, users: ownersOnly });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
