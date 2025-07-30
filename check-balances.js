import { ethers } from 'ethers';

async function checkBalances() {
  console.log('🔍 Überprüfe Wallet Balances direkt...\n');
  
  const testWallet = "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF";
  const senderWallet = "0xFe5F6cE95efB135b93899AF70B12727F93FEE6E2";
  const tokenAddress = "0x69eFD833288605f320d77eB2aB99DDE62919BbC1";
  
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    console.log('🎯 Test Wallet:', testWallet);
    
    // ETH Balance
    const ethBalance = await provider.getBalance(testWallet);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Token Balance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)'],
      provider
    );
    
    const tokenBalance = await tokenContract.balanceOf(testWallet);
    const symbol = await tokenContract.symbol();
    console.log(`🪙 Token Balance: ${ethers.formatUnits(tokenBalance, 2)} ${symbol}`);
    
    console.log('\n📤 Sender Wallet:', senderWallet);
    
    // Sender ETH Balance
    const senderEthBalance = await provider.getBalance(senderWallet);
    console.log(`💰 Sender ETH Balance: ${ethers.formatEther(senderEthBalance)} ETH`);
    
    // Sender Token Balance
    const senderTokenBalance = await tokenContract.balanceOf(senderWallet);
    console.log(`🪙 Sender Token Balance: ${ethers.formatUnits(senderTokenBalance, 2)} ${symbol}`);
    
    console.log('\n📊 Fazit:');
    if (parseFloat(ethers.formatEther(ethBalance)) > 0 || parseFloat(ethers.formatUnits(tokenBalance, 2)) > 0) {
      console.log('✅ Test-Wallet hat bereits Tokens/ETH erhalten!');
    } else {
      console.log('❌ Test-Wallet hat noch keine Tokens/ETH erhalten');
      console.log('   Das bedeutet, die API verarbeitet Transaktionen nicht wirklich');
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Balances:', error.message);
  }
}

checkBalances().catch(console.error);
