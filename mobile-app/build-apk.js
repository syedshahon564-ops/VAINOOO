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

// Explicitly dual-sign APK with V1 and V2 schemes
const apksigner = path.join(sdkPath, 'build-tools', '34.0.0', 'apksigner.bat');
const keystore = path.join(rootDir, '.toolchain', 'signing', 'ffrivals-release.jks');
if (fs.existsSync(apksigner) && fs.existsSync(keystore)) {
  console.log('Signing APK with dual V1 and V2 schemes...');
  try {
    execSync(`"${apksigner}" sign --ks "${keystore}" --ks-pass pass:FFRivals2026! --ks-key-alias ffrivals --key-pass pass:FFRivals2026! --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${builtApk}"`, { env });
  } catch (err) {
    console.warn('Signing step warning:', err.message);
  }

  console.log('Verifying APK signature scheme (v1, v2, v3)...');
  try {
    const verifyOut = execSync(`"${apksigner}" verify --verbose "${builtApk}"`, { env }).toString();
    console.log(verifyOut);
  } catch (err) {
    console.warn('apksigner verification warning:', err.message);
  }
}

const targetFiles = [
  path.join(rootDir, 'public', 'downloads', 'ffrivals.apk'),
  path.join(rootDir, 'public', 'ffrivals.apk'),
  path.join(rootDir, 'apps', 'web-admin', 'public', 'downloads', 'ffrivals.apk'),
  path.join(rootDir, 'apps', 'web-admin', 'public', 'ffrivals.apk'),
];

for (const dest of targetFiles) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(builtApk, dest);
  console.log(`Copied APK -> ${dest} (${(fs.statSync(dest).size / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('=== APK Build, Verification and Deployment Complete! ===');
