import axios from 'axios';

async function checkBlockchainTransactions() {
  console.log('🔍 Überprüfe Blockchain-Transaktionen...\n');
  
  const testWallet = "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF";
  const senderWallet = "0xFe5F6cE95efB135b93899AF70B12727F93FEE6E2";
  
  console.log('🎯 Test Wallet:', testWallet);
  console.log('📤 Sender Wallet:', senderWallet);
  console.log('');
  
  // Base Mainnet API für Transaktionen
  const baseApiUrl = 'https://api.basescan.org/api';
  
  try {
    // Überprüfe ETH Transaktionen zur Test-Wallet
    console.log('1. 💰 ETH Transaktionen:');
    const ethTxResponse = await axios.get(baseApiUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address: testWallet,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: 'YourApiKeyToken' // Kann leer bleiben für begrenzte Anfragen
      }
    });
    
    if (ethTxResponse.data.status === '1' && ethTxResponse.data.result.length > 0) {
      const recentTxs = ethTxResponse.data.result.slice(0, 5);
      recentTxs.forEach(tx => {
        if (tx.from.toLowerCase() === senderWallet.toLowerCase()) {
          console.log(`✅ ETH empfangen: ${tx.value / 1e18} ETH`);
          console.log(`   TX: https://basescan.org/tx/${tx.hash}`);
          console.log(`   Zeit: ${new Date(tx.timeStamp * 1000).toLocaleString()}`);
          console.log('');
        }
      });
    } else {
      console.log('❌ Keine ETH Transaktionen gefunden');
    }
    
    // Überprüfe Token Transaktionen
    console.log('2. 🪙 Token Transaktionen:');
    const tokenTxResponse = await axios.get(baseApiUrl, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: testWallet,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: 'YourApiKeyToken'
      }
    });
    
    if (tokenTxResponse.data.status === '1' && tokenTxResponse.data.result.length > 0) {
      const recentTokenTxs = tokenTxResponse.data.result.slice(0, 5);
      recentTokenTxs.forEach(tx => {
        if (tx.from.toLowerCase() === senderWallet.toLowerCase()) {
          const amount = parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
          console.log(`✅ Token empfangen: ${amount} ${tx.tokenSymbol}`);
          console.log(`   TX: https://basescan.org/tx/${tx.hash}`);
          console.log(`   Zeit: ${new Date(tx.timeStamp * 1000).toLocaleString()}`);
          console.log('');
        }
      });
    } else {
      console.log('❌ Keine Token Transaktionen gefunden');
    }
    
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('⚠️ Rate Limit erreicht. Verwende alternative Methode...');
      
      // Alternative: Direkte RPC-Calls
      console.log('\n🔄 Versuche direkten RPC Call...');
      try {
        const ethers = (await import('ethers')).ethers;
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        
        // Überprüfe ETH Balance
        const ethBalance = await provider.getBalance(testWallet);
        console.log(`💰 Aktuelle ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
        
        // Überprüfe Token Balance
        const tokenContract = new ethers.Contract(
          '0x69eFD833288605f320d77eB2aB99DDE62919BbC1', // D.FAITH Token
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        
        const tokenBalance = await tokenContract.balanceOf(testWallet);
        console.log(`🪙 Aktuelle Token Balance: ${ethers.formatUnits(tokenBalance, 2)} D.FAITH`);
        
      } catch (rpcError) {
        console.log('❌ RPC Fehler:', rpcError.message);
      }
      
    } else {
      console.log('❌ API Fehler:', error.message);
    }
  }
}

checkBlockchainTransactions().catch(console.error);
