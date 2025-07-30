import axios from 'axios';

async function testDebugWebhook() {
  console.log('🔍 Teste Debug Webhook...\n');
  
  const testData = {
    amount: 2,
    walletAddress: "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  };
  
  console.log('📤 Sende Debug Request:');
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(
      'https://tokentransfer-claim.vercel.app/api/debug-webhook',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Analyze the debug info
    if (response.data.debug) {
      console.log('\n🔍 Debug Analysis:');
      console.log('Environment Variables:');
      console.log('- PRIVATE_KEY exists:', response.data.debug.environmentCheck.privateKeyExists);
      console.log('- ETH_AMOUNT set:', response.data.debug.environmentCheck.ethAmountSet);
      console.log('- NODE_ENV:', response.data.debug.environmentCheck.nodeEnv);
      
      if (response.data.debug.logs && response.data.debug.logs.length > 0) {
        console.log('\n📜 Debug Logs:');
        response.data.debug.logs.forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          console.log(`[${time}] ${log.type.toUpperCase()}: ${log.message}`);
        });
      }
      
      if (response.data.debug.queueStatus) {
        console.log('\n📊 Queue Status:');
        console.log('- Queue Length:', response.data.debug.queueStatus.stats.queueLength);
        console.log('- Is Processing:', response.data.debug.queueStatus.stats.isProcessing);
        console.log('- Total Completed:', response.data.debug.queueStatus.stats.totalCompleted);
        console.log('- Total Failed:', response.data.debug.queueStatus.stats.totalFailed);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Debug-Test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDebugWebhook().catch(console.error);
