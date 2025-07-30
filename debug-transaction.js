import { ethers } from 'ethers';
import { 
  BASE_RPC_URL, 
  DFAITH_TOKEN_ADDRESS, 
  DFAITH_DECIMALS, 
  ERC20_ABI 
} from './config.js';

async function debugTransactionFlow() {
  console.log('🔍 Debug der Transaktions-Pipeline...\n');
  
  // Test Environment Variables
  console.log('1. 🔧 Environment Variables:');
  console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
  console.log('ETH_AMOUNT:', process.env.ETH_AMOUNT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('');
  
  if (!process.env.PRIVATE_KEY) {
    console.log('❌ PRIVATE_KEY fehlt! Das ist das Hauptproblem.');
    return;
  }
  
  try {
    // Test Provider Connection
    console.log('2. 🌐 Provider Connection:');
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Provider verbunden, aktueller Block:', blockNumber);
    console.log('Network:', await provider.getNetwork());
    console.log('');
    
    // Test Wallet Creation
    console.log('3. 👛 Wallet Erstellung:');
    let wallet;
    try {
      wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      console.log('✅ Wallet erstellt');
      console.log('Wallet Address:', wallet.address);
      
      // Test Wallet Balance
      const ethBalance = await provider.getBalance(wallet.address);
      console.log('ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
      
      // Test Token Contract
      const tokenContract = new ethers.Contract(DFAITH_TOKEN_ADDRESS, ERC20_ABI, wallet);
      const tokenBalance = await tokenContract.balanceOf(wallet.address);
      console.log('Token Balance:', ethers.formatUnits(tokenBalance, DFAITH_DECIMALS), 'D.FAITH');
      console.log('');
      
    } catch (walletError) {
      console.log('❌ Wallet Erstellung fehlgeschlagen:', walletError.message);
      return;
    }
    
    // Test Token Contract Interaction
    console.log('4. 🪙 Token Contract Test:');
    const testWallet = "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF";
    const testAmount = 1; // 1 D.FAITH Token
    
    try {
      const tokenContract = new ethers.Contract(DFAITH_TOKEN_ADDRESS, ERC20_ABI, wallet);
      
      // Test Gas Estimation
      const tokenAmount = ethers.parseUnits(testAmount.toString(), DFAITH_DECIMALS);
      const gasEstimate = await tokenContract.transfer.estimateGas(testWallet, tokenAmount);
      console.log('✅ Gas Estimation erfolgreich:', gasEstimate.toString());
      
      // Aktuelle Gas Price
      const gasPrice = await provider.getFeeData();
      console.log('Gas Price:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'Gwei');
      console.log('');
      
      // WICHTIG: Simuliere die Transaktion (ohne sie auszuführen)
      console.log('5. 🧪 Transaktions-Simulation:');
      
      // Überprüfe Balance vor Transfer
      const currentBalance = await tokenContract.balanceOf(wallet.address);
      if (currentBalance < tokenAmount) {
        console.log('❌ Unzureichende Token Balance für Transfer');
        console.log('Benötigt:', testAmount, 'D.FAITH');
        console.log('Verfügbar:', ethers.formatUnits(currentBalance, DFAITH_DECIMALS), 'D.FAITH');
        return;
      }
      
      console.log('✅ Ausreichende Token Balance vorhanden');
      console.log('Transfer würde erfolgreich sein von', wallet.address, 'zu', testWallet);
      console.log('Amount:', testAmount, 'D.FAITH');
      
      // ETH Transfer Test
      console.log('');
      console.log('6. 💰 ETH Transfer Test:');
      const ethAmount = process.env.ETH_AMOUNT || "0.0000001";
      const ethAmountWei = ethers.parseEther(ethAmount);
      const ethBalance = await provider.getBalance(wallet.address);
      const estimatedGas = ethers.parseEther('0.001');
      
      if (ethBalance < (ethAmountWei + estimatedGas)) {
        console.log('❌ Unzureichende ETH Balance für Transfer');
        console.log('Benötigt:', ethAmount, '+ Gas ETH');
        console.log('Verfügbar:', ethers.formatEther(ethBalance), 'ETH');
      } else {
        console.log('✅ Ausreichende ETH Balance vorhanden');
        console.log('ETH Transfer würde erfolgreich sein');
      }
      
    } catch (contractError) {
      console.log('❌ Token Contract Fehler:', contractError.message);
      console.log('Grund:', contractError.reason || 'Unbekannt');
    }
    
  } catch (error) {
    console.log('❌ Allgemeiner Fehler:', error.message);
  }
}

debugTransactionFlow().catch(console.error);
