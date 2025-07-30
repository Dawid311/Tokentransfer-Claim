import { ethers } from 'ethers';
import { 
  BASE_RPC_URL, 
  DFAITH_TOKEN_ADDRESS, 
  DFAITH_DECIMALS, 
  ERC20_ABI 
} from '../config.js';

class TransactionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.completedTransactions = [];
    this.failedTransactions = [];
  }

  addTransaction(txData) {
    const transaction = {
      ...txData,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      status: 'queued',
      createdAt: new Date().toISOString()
    };
    this.queue.push(transaction);
    if (!this.processing) {
      this.processQueue();
    }
    return transaction.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`Processing queue with ${this.queue.length} transactions`);

    while (this.queue.length > 0) {
      const txData = this.queue.shift();
      txData.status = 'processing';
      txData.startedAt = new Date().toISOString();
      
      try {
        const result = await this.executeTransactions(txData);
        txData.status = 'completed';
        txData.completedAt = new Date().toISOString();
        txData.result = result;
        this.completedTransactions.push(txData);
        console.log(`Successfully processed transaction ${txData.id} for ${txData.walletAddress}`);
      } catch (error) {
        txData.status = 'failed';
        txData.failedAt = new Date().toISOString();
        txData.error = error.message;
        this.failedTransactions.push(txData);
        console.error(`Failed to process transaction ${txData.id} for ${txData.walletAddress}:`, error);
        // Optionally re-queue failed transactions or handle them differently
      }
      
      // Add a small delay between transactions to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }

  async executeTransactions(txData) {
    const { amount, walletAddress } = txData;
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log(`Executing transactions for ${walletAddress}:`);
    console.log(`- D.FAITH amount: ${amount}`);
    console.log(`- ETH amount: ${process.env.ETH_AMOUNT}`);

    const results = {};
    
    // 1. Send D.FAITH tokens
    results.tokenTx = await this.sendTokens(wallet, walletAddress, amount);
    
    // 2. Send ETH
    results.ethTx = await this.sendETH(wallet, walletAddress, process.env.ETH_AMOUNT);
    
    return results;
  }

  async sendTokens(wallet, toAddress, amount) {
    console.log(`Sending ${amount} D.FAITH tokens to ${toAddress}...`);
    
    const tokenContract = new ethers.Contract(DFAITH_TOKEN_ADDRESS, ERC20_ABI, wallet);
    
    // Convert amount to token units (considering decimals)
    const tokenAmount = ethers.parseUnits(amount.toString(), DFAITH_DECIMALS);
    
    // Check balance before sending
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance < tokenAmount) {
      throw new Error(`Insufficient D.FAITH balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, DFAITH_DECIMALS)}`);
    }
    
    // Send tokens
    const tx = await tokenContract.transfer(toAddress, tokenAmount);
    console.log(`D.FAITH transfer transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`D.FAITH transfer confirmed in block: ${receipt.blockNumber}`);
    
    return receipt;
  }

  async sendETH(wallet, toAddress, ethAmount) {
    console.log(`Sending ${ethAmount} ETH to ${toAddress}...`);
    
    const ethAmountWei = ethers.parseEther(ethAmount);
    
    // Check ETH balance
    const balance = await wallet.provider.getBalance(wallet.address);
    if (balance < ethAmountWei) {
      throw new Error(`Insufficient ETH balance. Required: ${ethAmount}, Available: ${ethers.formatEther(balance)}`);
    }
    
    // Send ETH
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethAmountWei
    });
    console.log(`ETH transfer transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`ETH transfer confirmed in block: ${receipt.blockNumber}`);
    
    return receipt;
  }

  // Dashboard methods
  getQueueStatus() {
    return {
      queuedTransactions: this.queue.map(tx => ({
        ...tx,
        status: tx.status || 'queued'
      })),
      completedTransactions: this.completedTransactions.slice(-50), // Last 50
      failedTransactions: this.failedTransactions.slice(-20), // Last 20
      stats: {
        totalQueued: this.queue.length,
        totalCompleted: this.completedTransactions.length,
        totalFailed: this.failedTransactions.length,
        isProcessing: this.processing
      }
    };
  }

  getTransactionById(id) {
    const allTransactions = [
      ...this.queue,
      ...this.completedTransactions,
      ...this.failedTransactions
    ];
    return allTransactions.find(tx => tx.id === id);
  }
}

// Create singleton instance
export const transactionQueue = new TransactionQueue();
