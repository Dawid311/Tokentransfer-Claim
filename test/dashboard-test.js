import axios from 'axios';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testDashboard() {
  console.log('🧪 Testing Dashboard APIs...\n');

  try {
    // 1. Test Dashboard API
    console.log('1. Testing Dashboard API...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/dashboard`);
    console.log('✅ Dashboard API Status:', dashboardResponse.status);
    console.log('📊 Queue Stats:', dashboardResponse.data.data.stats);
    console.log('');

    // 2. Test adding a transaction via webhook
    console.log('2. Adding test transaction...');
    const webhookResponse = await axios.post(`${BASE_URL}/api/webhook`, {
      amount: 1.5,
      walletAddress: '0x742d35Cc6634C0532925a3b8D4e3AA5C7b73D7e5'
    });
    console.log('✅ Webhook Response:', webhookResponse.data);
    const transactionId = webhookResponse.data.data.transactionId;
    console.log('');

    // 3. Wait a moment and check dashboard again
    console.log('3. Waiting 2 seconds and checking dashboard again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardResponse2 = await axios.get(`${BASE_URL}/api/dashboard`);
    console.log('✅ Updated Queue Stats:', dashboardResponse2.data.data.stats);
    console.log('📝 Queued Transactions:', dashboardResponse2.data.data.queuedTransactions.length);
    console.log('');

    // 4. Test specific transaction lookup
    if (transactionId) {
      console.log('4. Testing specific transaction lookup...');
      const txResponse = await axios.get(`${BASE_URL}/api/dashboard?id=${transactionId}`);
      console.log('✅ Transaction Details:', txResponse.data.data);
      console.log('');
    }

    // 5. Test main dashboard page
    console.log('5. Testing main dashboard page...');
    const pageResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Dashboard Page Status:', pageResponse.status);
    console.log('📄 Page Content Length:', pageResponse.data.length, 'characters');
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
testDashboard();
