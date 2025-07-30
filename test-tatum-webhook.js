import axios from 'axios';

async function testTatumWebhook() {
  console.log('🚀 Teste Tatum API Implementation...\n');
  
  const testData = {
    amount: 5, // 5 Token wie gewünscht
    walletAddress: "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  };
  
  console.log('📤 Sende Request mit Tatum API:');
  console.log('URL:', 'https://tokentransfer-claim.vercel.app/api/webhook');
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    console.log('⏳ Sende Request (kann bis zu 30 Sekunden dauern)...');
    
    const response = await axios.post(
      'https://tokentransfer-claim.vercel.app/api/webhook',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 Sekunden Timeout für Tatum API
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 Tatum API Test erfolgreich!');
      
      if (response.data.data.status === 'completed') {
        console.log('✅ Transaktion wurde vollständig verarbeitet');
        console.log('🪙 Token TX Hash:', response.data.data.tokenTxHash);
        console.log('💰 ETH TX Hash:', response.data.data.ethTxHash);
        
        if (response.data.data.tokenTxHash) {
          console.log('🔗 Token TX auf BaseScan:');
          console.log(`   https://basescan.org/tx/${response.data.data.tokenTxHash}`);
        }
        
        if (response.data.data.ethTxHash) {
          console.log('🔗 ETH TX auf BaseScan:');
          console.log(`   https://basescan.org/tx/${response.data.data.ethTxHash}`);
        }
      } else if (response.data.data.status === 'failed') {
        console.log('❌ Transaktion fehlgeschlagen:', response.data.error);
      } else {
        console.log('📋 Transaktion Status:', response.data.data.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Tatum API Test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.error) {
        console.log('\n🔍 Fehleranalyse:');
        console.log('Error:', error.response.data.error);
        
        if (error.response.data.error.includes('TATUM_API_KEY')) {
          console.log('💡 Lösung: TATUM_API_KEY muss in Vercel Environment Variables gesetzt werden');
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - Die Tatum API braucht mehr Zeit');
      console.log('💡 Das ist normal bei der ersten Verwendung');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testTatumWebhook().catch(console.error);
