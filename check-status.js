import axios from 'axios';

async function checkQueueStatus() {
  console.log('📊 Überprüfe Queue Status...\n');
  
  try {
    const response = await axios.get('https://tokentransfer-claim.vercel.app/api/dashboard');
    
    console.log('✅ Dashboard Response Status:', response.status);
    console.log('📥 Queue Status:');
    
    const data = response.data.data;
    
    console.log('\n📈 Statistiken:');
    console.log('- Queue Length:', data.stats.queueLength);
    console.log('- Total Completed:', data.stats.totalCompleted);
    console.log('- Total Failed:', data.stats.totalFailed);
    console.log('- Is Processing:', data.stats.isProcessing);
    
    if (data.queue.length > 0) {
      console.log('\n⏳ Warteschlange:');
      data.queue.forEach(tx => {
        console.log(`- ${tx.id}: ${tx.status} (Position: ${tx.queuePosition})`);
      });
    }
    
    if (data.currentTransaction) {
      console.log('\n🔄 Aktuell verarbeitet:');
      console.log(`- ID: ${data.currentTransaction.id}`);
      console.log(`- Wallet: ${data.currentTransaction.walletAddress}`);
      console.log(`- Status: ${data.currentTransaction.status}`);
    }
    
    if (data.completed.length > 0) {
      console.log('\n✅ Abgeschlossene Transaktionen:');
      data.completed.slice(-3).forEach(tx => {
        console.log(`- ${tx.id}: ${tx.walletAddress} (${tx.amount} Token)`);
        if (tx.tokenTxHash) {
          console.log(`  Token TX: https://basescan.org/tx/${tx.tokenTxHash}`);
        }
        if (tx.ethTxHash) {
          console.log(`  ETH TX: https://basescan.org/tx/${tx.ethTxHash}`);
        }
      });
    }
    
    if (data.failed.length > 0) {
      console.log('\n❌ Fehlgeschlagene Transaktionen:');
      data.failed.slice(-3).forEach(tx => {
        console.log(`- ${tx.id}: ${tx.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Queue Status:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

checkQueueStatus().catch(console.error);
