import axios from 'axios';

async function detailedTest() {
  console.log('🔍 Detaillierter Test der Token-Transfer API...\n');
  
  // 1. Überprüfe System Status
  console.log('1. 📊 System Status Check:');
  try {
    const statusResponse = await axios.get('https://tokentransfer-claim.vercel.app/api/status');
    console.log('✅ System läuft');
    console.log('Wallet Balance:', statusResponse.data.wallet.tokenBalance, 'D.FAITH');
    console.log('ETH Balance:', statusResponse.data.wallet.ethBalance, 'ETH');
  } catch (error) {
    console.log('❌ System Status Fehler:', error.message);
    return;
  }
  
  // 2. Sende Test-Transaktion
  console.log('\n2. 📤 Sende Test-Transaktion:');
  let transactionId;
  try {
    const testData = {
      amount: 3,
      walletAddress: "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
    };
    
    const response = await axios.post(
      'https://tokentransfer-claim.vercel.app/api/webhook',
      testData
    );
    
    transactionId = response.data.data.transactionId;
    console.log('✅ Transaktion gesendet:', transactionId);
    console.log('Queue Position:', response.data.data.queuePosition);
  } catch (error) {
    console.log('❌ Fehler beim Senden:', error.message);
    return;
  }
  
  // 3. Warte und überprüfe mehrmals den Status
  for (let i = 0; i < 5; i++) {
    console.log(`\n3.${i+1} ⏱️ Status Check nach ${i*3} Sekunden:`);
    
    try {
      const dashboardResponse = await axios.get('https://tokentransfer-claim.vercel.app/api/dashboard');
      const data = dashboardResponse.data.data;
      
      console.log('Queue Length:', data.stats.queueLength);
      console.log('Is Processing:', data.stats.isProcessing);
      console.log('Total Completed:', data.stats.totalCompleted);
      console.log('Total Failed:', data.stats.totalFailed);
      
      if (data.currentTransaction) {
        console.log('🔄 Aktuelle Transaktion:', data.currentTransaction.id);
        console.log('Status:', data.currentTransaction.status);
      }
      
      if (data.queue.length > 0) {
        console.log('📋 Warteschlange:');
        data.queue.forEach(tx => {
          console.log(`  - ${tx.id.substring(0, 10)}... (${tx.status})`);
        });
      }
      
      if (data.completed.length > 0) {
        console.log('✅ Abgeschlossen:');
        data.completed.slice(-2).forEach(tx => {
          console.log(`  - ${tx.id.substring(0, 10)}... -> ${tx.walletAddress}`);
          if (tx.tokenTxHash) {
            console.log(`    Token TX: https://basescan.org/tx/${tx.tokenTxHash}`);
          }
        });
      }
      
      if (data.failed.length > 0) {
        console.log('❌ Fehlgeschlagen:');
        data.failed.slice(-2).forEach(tx => {
          console.log(`  - ${tx.id.substring(0, 10)}...: ${tx.error}`);
        });
      }
      
      // Wenn nichts mehr in der Queue ist und wir completed/failed haben, stoppe
      if (data.stats.queueLength === 0 && !data.stats.isProcessing && 
          (data.stats.totalCompleted > 0 || data.stats.totalFailed > 0)) {
        console.log('\n🏁 Verarbeitung abgeschlossen!');
        break;
      }
      
    } catch (error) {
      console.log('❌ Status Check Fehler:', error.message);
    }
    
    if (i < 4) {
      console.log('⏳ Warte 3 Sekunden...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

detailedTest().catch(console.error);
