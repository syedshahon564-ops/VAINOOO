const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Building FF Rivals Tour Android APK ===');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(__dirname, 'android');
const jdkPath = path.join(rootDir, '.toolchain', 'jdk-17.0.20.1+1');
const sdkPath = path.join(rootDir, '.toolchain', 'android-sdk');

const env = {
  ...process.env,
  JAVA_HOME: jdkPath,
  ANDROID_HOME: sdkPath,
  ANDROID_SDK_ROOT: sdkPath,
  PATH: `${path.join(jdkPath, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
};

console.log('Running ./gradlew assembleRelease...');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
execSync(`${gradlew} assembleRelease`, {
  cwd: androidDir,
  env,
  stdio: 'inherit',
});

const builtApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(builtApk)) {
  console.error('Built APK not found at:', builtApk);
  process.exit(1);
}

const targetDirs = [
  path.join(rootDir, 'public', 'downloads'),
  path.join(rootDir, 'apps', 'web-admin', 'public', 'downloads'),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const dest = path.join(dir, 'ffrivals.apk');
  fs.copyFileSync(builtApk, dest);
  console.log(`Copied APK -> ${dest} (${(fs.statSync(dest).size / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('=== APK Build and Deployment Complete! ===');
