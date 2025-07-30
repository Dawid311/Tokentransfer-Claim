let ethers;
try {
  const ethersModule = await import('ethers');
  ethers = ethersModule;
  console.log('✅ Ethers successfully imported');
} catch (error) {
  console.error('❌ Failed to import ethers:', error.message);
  ethers = null;
}

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
    this.currentTransaction = null;
    console.log('TransactionQueue initialized');
  }

  addTransaction(txData) {
    if (!ethers) {
      throw new Error('Ethers library not available');
    }
    
    const transaction = {
      ...txData,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      status: 'queued',
      createdAt: new Date().toISOString(),
      queuePosition: this.queue.length + 1
    };
    
    this.queue.push(transaction);
    console.log(`Transaction ${transaction.id} added to queue`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
    
    return transaction;
  }

  async processQueue() {
    if (!ethers) {
      console.error('Cannot process queue: ethers library not available');
      return;
    }
    
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`Starting queue processing with ${this.queue.length} transactions`);

    while (this.queue.length > 0) {
      const transaction = this.queue.shift();
      this.currentTransaction = transaction;
      
      try {
        transaction.status = 'processing';
        transaction.startedAt = new Date().toISOString();
        
        console.log(`Processing transaction ${transaction.id} for ${transaction.walletAddress}`);
        
        await this.executeTransactions(transaction);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();
        this.completedTransactions.push(transaction);
        
        console.log(`✅ Transaction ${transaction.id} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Transaction ${transaction.id} failed:`, error.message);
        
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.failedAt = new Date().toISOString();
        this.failedTransactions.push(transaction);
      }
      
      this.currentTransaction = null;
      
      // Small delay between transactions
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.processing = false;
    console.log('Queue processing completed');
  }

  async executeTransactions(transaction) {
    if (!ethers) {
      throw new Error('Ethers library not available');
    }
    
    const { amount, walletAddress } = transaction;
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log(`Executing transactions for ${walletAddress}:`);
    console.log(`- D.FAITH amount: ${amount}`);
    console.log(`- ETH amount: ${process.env.ETH_AMOUNT}`);

    // 1. Send D.FAITH tokens
    const tokenTx = await this.sendTokens(wallet, walletAddress, amount);
    transaction.tokenTxHash = tokenTx.hash;
    
    // 2. Send ETH
    const ethTx = await this.sendETH(wallet, walletAddress, process.env.ETH_AMOUNT);
    transaction.ethTxHash = ethTx.hash;
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
    const tx = await tokenContract.transfer(toAddress, tokenAmount, {
      gasLimit: 100000
    });
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
    const estimatedGas = ethers.parseEther('0.001'); // Estimated gas cost
    
    if (balance < (ethAmountWei + estimatedGas)) {
      throw new Error(`Insufficient ETH balance. Required: ${ethAmount} + gas, Available: ${ethers.formatEther(balance)}`);
    }
    
    // Send ETH
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethAmountWei,
      gasLimit: 21000
    });
    console.log(`ETH transfer transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`ETH transfer confirmed in block: ${receipt.blockNumber}`);
    
    return receipt;
  }

  // Queue status methods
  getQueueStatus() {
    return {
      queue: this.queue.map(tx => ({
        ...tx,
        queuePosition: this.queue.indexOf(tx) + 1
      })),
      processing: this.processing,
      currentTransaction: this.currentTransaction,
      completed: this.completedTransactions.slice(-10),
      failed: this.failedTransactions.slice(-10),
      stats: {
        queueLength: this.queue.length,
        totalCompleted: this.completedTransactions.length,
        totalFailed: this.failedTransactions.length,
        isProcessing: this.processing
      },
      systemStatus: {
        ethersAvailable: !!ethers,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    };
  }

  getTransactionById(id) {
    // Search in all arrays
    const allTransactions = [
      ...this.queue,
      ...this.completedTransactions,
      ...this.failedTransactions
    ];
    
    if (this.currentTransaction && this.currentTransaction.id === id) {
      return this.currentTransaction;
    }
    
    return allTransactions.find(tx => tx.id === id);
  }
}

// Create singleton instance
export const transactionQueue = new TransactionQueue();
console.log('TransactionQueue singleton created and exported');
