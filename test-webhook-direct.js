import axios from 'axios';

async function testWebhookDirect() {
  console.log('🔍 Teste Webhook direkt mit kleiner Menge...\n');
  
  const testData = {
    amount: 0.01, // Sehr kleine Menge zum Testen
    walletAddress: "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  };
  
  console.log('📤 Sende Request:');
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    console.log('⏳ Sende Request...');
    
    const response = await axios.post(
      'https://tokentransfer-claim.vercel.app/api/webhook',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 Sekunden
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Detaillierte Analyse der Response
    if (response.data.success) {
      if (response.data.data.status === 'completed') {
        console.log('\n🎉 Transaktion vollständig abgeschlossen!');
        if (response.data.data.tokenTxHash) {
          console.log('🪙 Token TX:', `https://basescan.org/tx/${response.data.data.tokenTxHash}`);
        }
        if (response.data.data.ethTxHash) {
          console.log('💰 ETH TX:', `https://basescan.org/tx/${response.data.data.ethTxHash}`);
        }
      } else if (response.data.data.status === 'failed') {
        console.log('\n❌ Transaktion fehlgeschlagen:');
        console.log('Error:', response.data.error || 'Unbekannter Fehler');
      } else {
        console.log('\n📋 Transaktion Status:', response.data.data.status);
        console.log('Die Transaktion läuft möglicherweise noch asynchron');
      }
    } else {
      console.log('\n❌ Request fehlgeschlagen:', response.data.error);
    }
    
  } catch (error) {
    console.error('\n❌ Fehler beim Test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      // Spezifische Fehleranalyse
      if (error.response.data && error.response.data.error) {
        const errorMsg = error.response.data.error;
        console.log('\n🔍 Fehleranalyse:');
        
        if (errorMsg.includes('TATUM_API_KEY')) {
          console.log('❌ TATUM_API_KEY ist nicht gesetzt in Vercel');
          console.log('💡 Lösung: Gehe zu Vercel Project Settings → Environment Variables');
          console.log('   und füge TATUM_API_KEY hinzu');
        } else if (errorMsg.includes('PRIVATE_KEY')) {
          console.log('❌ PRIVATE_KEY ist nicht gesetzt');
        } else if (errorMsg.includes('ETH_AMOUNT')) {
          console.log('❌ ETH_AMOUNT ist nicht gesetzt');
        } else {
          console.log('❌ Anderer Fehler:', errorMsg);
        }
      }
    } else {
      console.error('Network/Timeout Error:', error.message);
    }
  }
}

testWebhookDirect().catch(console.error);
