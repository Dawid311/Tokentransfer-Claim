import axios from 'axios';

async function testWebhook() {
  console.log('🚀 Teste Webhook mit Test-Transaktion...\n');
  
  const testData = {
    amount: 5,
    walletAddress: "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  };
  
  console.log('📤 Sende Request:');
  console.log('URL:', 'https://tokentransfer-claim.vercel.app/api/webhook');
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(
      'https://tokentransfer-claim.vercel.app/api/webhook',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 Test-Transaktion erfolgreich in Queue eingereiht!');
      console.log('Transaction ID:', response.data.data.transactionId);
      console.log('Queue Position:', response.data.data.queuePosition);
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Senden der Test-Transaktion:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Keine Antwort erhalten:', error.message);
    } else {
      console.error('Request Fehler:', error.message);
    }
  }
}

testWebhook().catch(console.error);
