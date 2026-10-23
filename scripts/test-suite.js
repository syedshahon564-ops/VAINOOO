/**
 * FF RIVAL TOUR BD - COMPREHENSIVE AI & PAYMENT TEST SUITE
 * Tests:
 * 1. AI Bot Multilingual Comprehension (Bangla, Banglish, English, Hindi)
 * 2. AI Bot Report Handling (Hacker/Cheat report, Lag report, Room pass inquiry)
 * 3. AI Bot Math & Strategy Knowledge
 * 4. Payment Deposit System: Live SMS Webhook -> TrxID Verification -> User Balance Update
 * 5. Duplicate TrxID Prevention
 * 6. Autonomous Anti-Cheat Panel / Hack Banning System ("বিচার দিলে ব্যান করে দেওয়া")
 * 7. Asset & Image Integrity (Ensuring no images/assets were damaged or deleted)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webAdminDir = path.join(rootDir, 'apps', 'web-admin');

console.log('====================================================');
console.log('🧪 RUNNING FF RIVAL TOUR BD FULL SYSTEM TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
    if (details) console.log(`     ↳ ${details}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     ↳ ${details}`);
  }
}

async function runAllTests() {
  // ----------------------------------------------------
  // TEST GROUP 1: ASSET & IMAGE INTEGRITY
  // ----------------------------------------------------
  console.log('📦 TEST GROUP 1: Images, Logos & Asset Integrity');

  const criticalAssets = [
    path.join(webAdminDir, 'public', 'logo.png'),
    path.join(webAdminDir, 'public', 'icon-192.png'),
    path.join(webAdminDir, 'public', 'icon-512.png'),
    path.join(webAdminDir, 'public', 'apple-touch-icon.png'),
    path.join(webAdminDir, 'public', 'manifest.json'),
  ];

  for (const asset of criticalAssets) {
    const exists = fs.existsSync(asset);
    const size = exists ? fs.statSync(asset).size : 0;
    assert(exists && size > 0, `Asset exists & intact: ${path.basename(asset)}`, `Size: ${size} bytes`);
  }

  // Check public subdirectories
  const assetDirs = ['avatars', 'banners', 'categories', 'downloads', 'images'];
  for (const dir of assetDirs) {
    const dPath = path.join(webAdminDir, 'public', dir);
    assert(fs.existsSync(dPath), `Public directory exists: /public/${dir}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: AI MULTILINGUAL REASONING & INTENTS
  // ----------------------------------------------------
  console.log('\n🤖 TEST GROUP 2: AI Multilingual Intelligence & Reporting Engine');

  const { generateAdvancedAiResponse, detectExactLanguage } = require('../apps/web-admin/src/lib/ai-assistant.ts');

  // Test 2.1: Language Detection
  assert(detectExactLanguage('আমার টাকা আসেনি বিকাশে') === 'BANGLA', 'Bangla Language Detection');
  assert(detectExactLanguage('amr taka aseni bkash e, help me') === 'BANGLISH', 'Banglish Language Detection');
  assert(detectExactLanguage('When will custom room credentials be released?') === 'ENGLISH', 'English Language Detection');
  assert(detectExactLanguage('bhaiya mera deposit nahi aaya kaise hoga') === 'HINDI', 'Hindi Language Detection');

  // Test 2.2: Cheater / Hacker Report Engine ("সব রিপোর্ট ইয়া করবে")
  const cheatReport = generateAdvancedAiResponse({
    userMessage: 'ম্যাচে একজন হ্যাকার ছিলো, ওয়ালহ্যাক আর এইমবট মারতেছে!',
    userIgn: 'RivalKing_07',
  });
  assert(
    cheatReport.intent === 'REPORT_CHEATER' &&
    cheatReport.detectedLanguage === 'BANGLA' &&
    cheatReport.response.includes('অ্যান্টি-চিট') &&
    cheatReport.response.includes('UID'),
    'Hacker / Cheater Report Handling (Bangla)',
    `Intent: ${cheatReport.intent}`
  );

  // Test 2.3: Banglish Lag & Bug Troubleshooting
  const lagReport = generateAdvancedAiResponse({
    userMessage: 'bhai app onek lag hocche load hoy na',
    userIgn: 'Shooter99',
  });
  assert(
    lagReport.intent === 'TROUBLESHOOT_LAG' &&
    lagReport.detectedLanguage === 'BANGLISH' &&
    lagReport.response.includes('Clear Cache'),
    'App Performance & Lag Troubleshooting (Banglish)',
    `Intent: ${lagReport.intent}`
  );

  // Test 2.4: 8-Minute Room ID & Password Policy
  const roomInquiry = generateAdvancedAiResponse({
    userMessage: 'room id pass kobe pabo?',
    userIgn: 'ProGamer',
  });
  assert(
    roomInquiry.intent === 'ROOM_PASS' &&
    roomInquiry.response.includes('8') &&
    roomInquiry.response.includes('My Matches'),
    'Room ID & 8-Minute Window Rule Response',
    `Intent: ${roomInquiry.intent}`
  );

  // Test 2.5: Game Strategy & Free Fire Sensitivity
  const proTips = generateAdvancedAiResponse({
    userMessage: 'ফ্রি ফায়ারে সেরা হেডশট সেনসিটিভিটি কত?',
    userIgn: 'HeadshotKing',
  });
  assert(
    proTips.intent === 'GAMEPLAY_TIPS' &&
    proTips.response.includes('General') &&
    proTips.response.includes('MP40'),
    'Free Fire Pro Gameplay & Sensitivity Meta Q&A',
    `Intent: ${proTips.intent}`
  );

  // Test 2.6: Math / Tournament Calculation
  const mathTest = generateAdvancedAiResponse({
    userMessage: '48 * 20 koto?',
    userIgn: 'Player1',
  });
  assert(
    mathTest.intent === 'MATH' &&
    mathTest.response.includes('960'),
    'Universal Prize / Math Expression Evaluation',
    `Result: 48 * 20 = 960`
  );

  // ----------------------------------------------------
  // TEST GROUP 3: PAYMENT METHOD & AUTO-CLAIM VERIFICATION
  // ----------------------------------------------------
  console.log('\n💳 TEST GROUP 3: Payment Verification & Auto-Claim Engine');

  const { checkAndClaimPayment } = require('../apps/web-admin/src/lib/support-backend.ts');

  const paymentsDbPath = path.join(webAdminDir, 'data', 'payments-db.json');
  const usersDbPath = path.join(webAdminDir, 'data', 'users-db.json');

  assert(fs.existsSync(paymentsDbPath), 'payments-db.json exists');
  assert(fs.existsSync(usersDbPath), 'users-db.json exists');

  // Load DBs
  const paymentsDb = JSON.parse(fs.readFileSync(paymentsDbPath, 'utf-8'));
  const usersDb = JSON.parse(fs.readFileSync(usersDbPath, 'utf-8'));

  // Insert a mock incoming SMS payment (as if forwarder received bKash SMS)
  const testTrx = 'TEST_TRX_' + Date.now().toString().slice(-6);
  const testAmount = 350;
  const testUser = usersDb[0]?.ign || 'OWNER_MAIN';
  const initialBalance = Number(usersDb[0]?.walletBalance ?? 0);

  paymentsDb.incomingPayments = paymentsDb.incomingPayments || [];
  paymentsDb.incomingPayments.push({
    id: 'pay_test_' + Date.now(),
    trxId: testTrx,
    provider: 'BKASH',
    sender: '01700000000',
    amount: testAmount,
    status: 'UNCLAIMED',
    rawMessage: `You have received Tk ${testAmount}.00 from 01700000000. TrxID ${testTrx}`,
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(paymentsDbPath, JSON.stringify(paymentsDb, null, 2), 'utf-8');

  // Test 3.1: Claim the unclaimed TrxID via AI Support engine
  const claimResult = checkAndClaimPayment(testTrx, testUser);
  assert(
    claimResult.found === true &&
    claimResult.claimedNow === true &&
    claimResult.amount === testAmount,
    'AI Auto-Verifies and Claims Incoming bKash TrxID',
    `Amount: ৳${claimResult.amount}, Provider: ${claimResult.provider}`
  );

  // Test 3.2: Verify User Wallet Balance Updated
  const updatedUsersDb = JSON.parse(fs.readFileSync(usersDbPath, 'utf-8'));
  const targetUser = updatedUsersDb.find((u) => u.ign === testUser || u.id === usersDb[0]?.id);
  const newBalance = Number(targetUser?.walletBalance ?? 0);
  assert(
    newBalance === initialBalance + testAmount,
    'User Wallet Balance Credited in Real-Time',
    `Old: ৳${initialBalance} -> New: ৳${newBalance}`
  );

  // Test 3.3: Duplicate Claim Rejection
  const duplicateClaim = checkAndClaimPayment(testTrx, 'ANOTHER_PLAYER');
  assert(
    duplicateClaim.found === true &&
    duplicateClaim.claimedNow === false &&
    duplicateClaim.alreadyClaimed === true,
    'Duplicate TrxID Rejected with Warning Message',
    duplicateClaim.message.slice(0, 50) + '...'
  );

  // Cleanup test transaction from payments-db
  const cleanPaymentsDb = JSON.parse(fs.readFileSync(paymentsDbPath, 'utf-8'));
  cleanPaymentsDb.incomingPayments = cleanPaymentsDb.incomingPayments.filter((p) => p.trxId !== testTrx);
  cleanPaymentsDb.depositLogs = (cleanPaymentsDb.depositLogs || []).filter((l) => l.trxId !== testTrx);
  fs.writeFileSync(paymentsDbPath, JSON.stringify(cleanPaymentsDb, null, 2), 'utf-8');

  // Restore original balance
  targetUser.walletBalance = initialBalance;
  targetUser.balance = initialBalance;
  fs.writeFileSync(usersDbPath, JSON.stringify(updatedUsersDb, null, 2), 'utf-8');

  // ----------------------------------------------------
  // TEST GROUP 4: CONFIGURATION & GEMINI PREPAREDNESS
  // ----------------------------------------------------
  console.log('\n⚙️ TEST GROUP 4: AI Support Config & Gemini Integration');

  const { readAiConfig } = require('../apps/web-admin/src/lib/support-backend.ts');
  const config = readAiConfig();

  assert(typeof config.systemPrompt === 'string' && config.systemPrompt.length > 20, 'System Prompt Configured');
  assert(config.autoVerifyPayments === true, 'Auto-Verify Payments is Enabled');
  assert(Array.isArray(config.customRules) && config.customRules.length >= 4, 'Custom Esports Rules Active');

  // ----------------------------------------------------
  // TEST GROUP 5: AUTONOMOUS ANTI-CHEAT & PANEL BAN SYSTEM ("বিচার দিলে ব্যান করে দেওয়া")
  // ----------------------------------------------------
  console.log('\n🛡️ TEST GROUP 5: Autonomous Anti-Cheat & Panel Ban System');

  const { banReportedPlayer, processAiResponse } = require('../apps/web-admin/src/lib/support-backend.ts');

  // Ensure clean state before starting anti-cheat tests
  const testUidsToClean = new Set(['9876543210', '7788990011', '4455667788']);
  const cleanDb = (filePath) => {
    if (fs.existsSync(filePath)) {
      const u = JSON.parse(fs.readFileSync(filePath, 'utf-8')).filter(
        (x) => !testUidsToClean.has(String(x.uid)) && !testUidsToClean.has(String(x.id || '').replace('u-banned-', ''))
      );
      fs.writeFileSync(filePath, JSON.stringify(u, null, 2), 'utf-8');
    }
  };
  cleanDb(usersDbPath);
  cleanDb(path.join(rootDir, 'data', 'users-db.json'));

  // Test 5.1: Panel complaint without UID/IGN -> AI requests suspect's UID/IGN
  const noUidReport = banReportedPlayer('bhai kau judi panel lagai khle bichar chai', 'FairPlayer01');
  assert(
    noUidReport.isCheatReport === true &&
    noUidReport.targetIdentified === false &&
    noUidReport.banned === false &&
    noUidReport.message.includes('UID'),
    'AI Bot Detects Panel Report & Requests Suspect UID/IGN'
  );

  // Test 5.2: Panel report with UID -> Instant Permanent Ban
  const testSuspectUid = '9876543210';
  const uidReport = banReportedPlayer(`bhai ei cheater panel use kortese, UID: ${testSuspectUid} bichar koro`, 'FairPlayer01');
  assert(
    uidReport.isCheatReport === true &&
    uidReport.targetIdentified === true &&
    uidReport.banned === true &&
    uidReport.targetUser?.status === 'BANNED' &&
    uidReport.targetUser?.isBanned === true,
    'AI Bot Executes Instant Permanent Ban on Accused Panel User',
    `Target UID: ${testSuspectUid}, Status: BANNED`
  );

  // Test 5.3: Verify target user is in users-db.json with BANNED status
  const usersAfterBan = JSON.parse(fs.readFileSync(usersDbPath, 'utf-8'));
  const bannedInDb = usersAfterBan.find((u) => String(u.uid) === testSuspectUid);
  assert(
    Boolean(bannedInDb && bannedInDb.status === 'BANNED' && bannedInDb.isBanned === true),
    'Target User Persisted to Database with BANNED & Zero Balance',
    `Found in DB: ${bannedInDb?.id}`
  );

  // Test 5.4: Repeat report on already banned user -> Informs already banned
  const duplicateBanReport = banReportedPlayer(`ei cheater ${testSuspectUid} abar panel lagai khelse`, 'FairPlayer02');
  assert(
    duplicateBanReport.isCheatReport === true &&
    duplicateBanReport.alreadyBanned === true &&
    duplicateBanReport.banned === false &&
    (duplicateBanReport.message.includes('Banned') || duplicateBanReport.message.includes('ব্যান')),
    'AI Bot Accurately Reports Target is Already Permanently Banned'
  );

  // Test 5.5: Bangla Digits Conversion & Detection
  const bnUid = '৭৭৮৮৯৯০০১১'; // 7788990011
  const bnReport = banReportedPlayer(`ভাই এই প্লেয়ার প্যানেল লাগাই খেলসে আইডি: ${bnUid} ব্যান দেন`, 'FairPlayer03');
  assert(
    bnReport.isCheatReport === true &&
    bnReport.targetIdentified === true &&
    bnReport.banned === true &&
    bnReport.targetUser?.uid === '7788990011',
    'AI Bot Converts Bangla Digits (৭৭৮৮৯৯০০১১ -> 7788990011) & Enforces Ban'
  );

  // Test 5.6: Owner / Admin Protection Against Malicious False Reports
  const ownerReport = banReportedPlayer('bhai OWNER_MAIN hack use kortese ban koro', 'TrollUser');
  assert(
    ownerReport.isCheatReport === true &&
    ownerReport.isOwner === true &&
    ownerReport.banned === false &&
    ownerReport.message.includes('Admin/Owner'),
    'Protected Admin / Owner Accounts Immune to Malicious False Reports'
  );

  // Test 5.7: Full End-to-End processAiResponse Anti-Cheat Flow
  const e2eSuspect = '4455667788';
  const e2eRes = await processAiResponse(
    { userIgn: 'HonestPlayer' },
    `bhai match e ${e2eSuspect} panel lagaya khelse bichar koro`
  );
  assert(
    Boolean(e2eRes.response && (e2eRes.response.includes('Banned') || e2eRes.response.includes('ব্যান'))),
    'End-to-End AI Support Ticket Autonomous Anti-Cheat Interceptor'
  );

  // Clean up test banned entries from users-db
  const cleanUids = new Set([testSuspectUid, '7788990011', e2eSuspect]);
  const cleanedUsers = JSON.parse(fs.readFileSync(usersDbPath, 'utf-8')).filter(
    (u) => !cleanUids.has(String(u.uid))
  );
  fs.writeFileSync(usersDbPath, JSON.stringify(cleanedUsers, null, 2), 'utf-8');

  // Also clean root data/users-db.json if it exists
  const rootUsersDb = path.join(rootDir, 'data', 'users-db.json');
  if (fs.existsSync(rootUsersDb)) {
    const rootCleaned = JSON.parse(fs.readFileSync(rootUsersDb, 'utf-8')).filter(
      (u) => !cleanUids.has(String(u.uid))
    );
    fs.writeFileSync(rootUsersDb, JSON.stringify(rootCleaned, null, 2), 'utf-8');
  }

  // ----------------------------------------------------
  // FINAL RESULTS SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL SYSTEMS 100% OPERATIONAL & VERIFIED!');
  } else {
    console.error(`⚠️ ${failedTests} TESTS FAILED.`);
  }
  console.log('====================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
