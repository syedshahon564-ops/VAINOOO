const fs = require('fs');
const path = require('path');

const webAdminDir = __dirname;
const rootDir = path.resolve(__dirname, '..', '..');

console.log('🔄 Syncing apps/web-admin build artifacts to monorepo root for Vercel...');

// 1. Sync .next
const srcNext = path.join(webAdminDir, '.next');
const destNext = path.join(rootDir, '.next');

if (fs.existsSync(srcNext)) {
  if (fs.existsSync(destNext)) {
    try {
      fs.rmSync(destNext, { recursive: true, force: true });
    } catch (e) {}
  }
  fs.cpSync(srcNext, destNext, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/.next -> ./.next');
}

// 2. Sync public
const srcPublic = path.join(webAdminDir, 'public');
const destPublic = path.join(rootDir, 'public');

if (fs.existsSync(srcPublic)) {
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/public -> ./public');
}

// 3. Sync data
const srcData = path.join(webAdminDir, 'data');
const destData = path.join(rootDir, 'data');

if (fs.existsSync(srcData)) {
  fs.cpSync(srcData, destData, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/data -> ./data');
}

// 4. Sync middleware.ts
const srcMiddleware = path.join(webAdminDir, 'src', 'middleware.ts');
const destMiddleware = path.join(rootDir, 'middleware.ts');

if (fs.existsSync(srcMiddleware)) {
  fs.copyFileSync(srcMiddleware, destMiddleware);
  console.log('✅ Successfully copied apps/web-admin/src/middleware.ts -> ./middleware.ts');
}

console.log('✨ Build artifact sync complete!');
