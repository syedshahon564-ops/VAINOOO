#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================');
console.log('🚀 Running Custom Vercel Build Script');
console.log('====================================');

const rootDir = path.resolve(__dirname, '..');
const webAdminDir = path.join(rootDir, 'apps', 'web-admin');

console.log(`RootDir: ${rootDir}`);
console.log(`WebAdminDir: ${webAdminDir}`);

// 1. Run the build in apps/web-admin
console.log('\n📦 Step 1: Building apps/web-admin with Next.js...');
try {
  execSync('npm --prefix apps/web-admin run build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });
  console.log('✅ Next.js build succeeded in apps/web-admin!');
} catch (err) {
  console.error('❌ Build failed in apps/web-admin:', err);
  process.exit(1);
}

// 2. Sync .next directory to root so Vercel Next.js builder finds it
const srcNext = path.join(webAdminDir, '.next');
const destNext = path.join(rootDir, '.next');

console.log('\n📦 Step 2: Copying build output (.next) to root...');
if (fs.existsSync(srcNext)) {
  if (fs.existsSync(destNext)) {
    try {
      fs.rmSync(destNext, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
  fs.cpSync(srcNext, destNext, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/.next -> ./.next');
} else {
  console.error(`❌ Source .next does not exist at ${srcNext}`);
  process.exit(1);
}

// 3. Sync public directory to root
const srcPublic = path.join(webAdminDir, 'public');
const destPublic = path.join(rootDir, 'public');

console.log('\n📦 Step 3: Copying public directory to root...');
if (fs.existsSync(srcPublic)) {
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/public -> ./public');
}

// 4. Sync data directory to root
const srcData = path.join(webAdminDir, 'data');
const destData = path.join(rootDir, 'data');

console.log('\n📦 Step 4: Copying data directory to root...');
if (fs.existsSync(srcData)) {
  fs.cpSync(srcData, destData, { recursive: true });
  console.log('✅ Successfully copied apps/web-admin/data -> ./data');
}

// 5. Copy next.config.js to root
const srcConfig = path.join(webAdminDir, 'next.config.js');
const destConfig = path.join(rootDir, 'next.config.js');

if (fs.existsSync(srcConfig)) {
  console.log('\n📦 Step 5: Copying next.config.js to root...');
  fs.copyFileSync(srcConfig, destConfig);
  console.log('✅ Successfully copied apps/web-admin/next.config.js -> ./next.config.js');
}

console.log('\n====================================');
console.log('🎉 Vercel Build Script Completed Successfully!');
console.log('====================================\n');
