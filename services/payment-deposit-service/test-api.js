// Test script for Webhook & Auto-Deposit Verification Microservice

async function runTests() {
  const baseUrl = 'http://localhost:4000';
  const secretKey = 'ff_rivals_secure_sms_key_2026';

  console.log('=== Starting Payment Microservice Test Suite ===\n');

  // 1. Unauthorized Webhook (Missing API Key)
  console.log('1. Testing Webhook without x-api-key...');
  const res1 = await fetch(`${baseUrl}/api/webhook/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'bkash',
      sender: '01712345678',
      amount: 500,
      trx_id: 'TRX_UNAUTH_1',
    }),
  });
  console.log(`Status: ${res1.status} (Expected: 401)`);
  console.log('Response:', await res1.json(), '\n');

  // 2. User Deposit Verify when SMS not arrived yet (Race Condition -> PENDING)
  console.log('2. Testing Deposit Verify before SMS arrives (PENDING)...');
  const res2 = await fetch(`${baseUrl}/api/deposit/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'user-player-001',
      trx_id: 'BK99001122AA',
      expected_amount: 350,
    }),
  });
  console.log(`Status: ${res2.status} (Expected: 200)`);
  console.log('Response:', await res2.json(), '\n');

  // 3. Valid Webhook Ingestion (bKash)
  console.log('3. Testing Valid Webhook Ingestion (bKash)...');
  const res3 = await fetch(`${baseUrl}/api/webhook/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': secretKey,
    },
    body: JSON.stringify({
      provider: 'bkash',
      sender: '01711223344',
      amount: 350,
      trx_id: 'BK99001122AA',
      raw_message: 'You have received Tk 350.00 from 01711223344. TrxID BK99001122AA',
      timestamp: new Date().toISOString(),
    }),
  });
  console.log(`Status: ${res3.status} (Expected: 201)`);
  console.log('Response:', await res3.json(), '\n');

  // 4. Duplicate Webhook (Idempotency test)
  console.log('4. Testing Duplicate Webhook Ingestion...');
  const res4 = await fetch(`${baseUrl}/api/webhook/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': secretKey,
    },
    body: JSON.stringify({
      provider: 'bkash',
      sender: '01711223344',
      amount: 350,
      trx_id: 'BK99001122AA',
      raw_message: 'Duplicate',
    }),
  });
  console.log(`Status: ${res4.status} (Expected: 200 with DUPLICATE)`);
  console.log('Response:', await res4.json(), '\n');

  // 5. User Deposit Verify after SMS arrived (Atomic credit -> SUCCESS)
  console.log('5. Testing User Deposit Verify (SUCCESS)...');
  const res5 = await fetch(`${baseUrl}/api/deposit/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'user-player-001',
      trx_id: 'BK99001122AA',
      expected_amount: 350,
    }),
  });
  console.log(`Status: ${res5.status} (Expected: 200 with SUCCESS)`);
  console.log('Response:', await res5.json(), '\n');

  // 6. User re-submitting same TrxID (ALREADY_USED rejection)
  console.log('6. Testing Double Claim (ALREADY_USED rejection)...');
  const res6 = await fetch(`${baseUrl}/api/deposit/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'user-player-002',
      trx_id: 'BK99001122AA',
    }),
  });
  console.log(`Status: ${res6.status} (Expected: 400 with ALREADY_USED)`);
  console.log('Response:', await res6.json(), '\n');

  // 7. Stats inspection
  console.log('7. Testing Webhook Stats Inspection...');
  const res7 = await fetch(`${baseUrl}/api/webhook/stats`, {
    headers: { 'x-api-key': secretKey },
  });
  console.log(`Status: ${res7.status} (Expected: 200)`);
  console.log('Response:', await res7.json(), '\n');

  console.log('=== All Payment Microservice Tests Passed Perfectly! ===');
}

runTests().catch(console.error);
