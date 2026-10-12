const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Building FF Rivals PayBot Dedicated Owner APK ===');

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

// 1. Temporarily configure capacitor to point to /owner-gateway
const capConfigSrc = path.join(__dirname, 'capacitor.config.json');
const capConfigDest = path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json');

const originalCapConfig = JSON.parse(fs.readFileSync(capConfigSrc, 'utf8'));
const payBotCapConfig = {
  ...originalCapConfig,
  appName: "FF PayBot",
  server: {
    ...originalCapConfig.server,
    url: "https://web-production-2c40b.up.railway.app/owner-gateway?app=true&v=1.0.0"
  }
};

fs.writeFileSync(capConfigDest, JSON.stringify(payBotCapConfig, null, 2), 'utf8');
console.log('Set PayBot URL: https://web-production-2c40b.up.railway.app/owner-gateway');

// 2. Temporarily set strings.xml app_name to "FF PayBot"
const stringsXmlPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
let originalStringsXml = fs.readFileSync(stringsXmlPath, 'utf8');
let paybotStringsXml = originalStringsXml.replace(
  '<string name="app_name">FF Rivals</string>',
  '<string name="app_name">FF PayBot</string>'
);
fs.writeFileSync(stringsXmlPath, paybotStringsXml, 'utf8');

try {
  console.log('Running ./gradlew assembleRelease for PayBot...');
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

  // Sign APK
  const apksigner = path.join(sdkPath, 'build-tools', '34.0.0', 'apksigner.bat');
  const keystore = path.join(rootDir, '.toolchain', 'signing', 'ffrivals-release.jks');
  if (fs.existsSync(apksigner) && fs.existsSync(keystore)) {
    console.log('Signing PayBot APK with dual V1 and V2 schemes...');
    try {
      execSync(`"${apksigner}" sign --ks "${keystore}" --ks-pass pass:FFRivals2026! --ks-key-alias ffrivals --key-pass pass:FFRivals2026! --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${builtApk}"`, { env });
    } catch (err) {
      console.warn('Signing step warning:', err.message);
    }
  }

  // Copy to paybot.apk targets
  const targetFiles = [
    path.join(rootDir, 'public', 'downloads', 'paybot.apk'),
    path.join(rootDir, 'public', 'paybot.apk'),
    path.join(rootDir, 'apps', 'web-admin', 'public', 'downloads', 'paybot.apk'),
    path.join(rootDir, 'apps', 'web-admin', 'public', 'paybot.apk'),
  ];

  for (const dest of targetFiles) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(builtApk, dest);
    console.log(`Copied PayBot APK -> ${dest} (${(fs.statSync(dest).size / (1024 * 1024)).toFixed(2)} MB)`);
  }
} finally {
  // Restore strings.xml
  fs.writeFileSync(stringsXmlPath, originalStringsXml, 'utf8');
  // Restore capacitor config
  fs.writeFileSync(capConfigDest, JSON.stringify(originalCapConfig, null, 2), 'utf8');
}

console.log('=== PayBot APK Build & Deployment Complete! ===');
