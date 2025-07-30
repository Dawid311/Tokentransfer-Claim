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
    this.currentTransaction = null;
    console.log('TransactionQueue initialized');
    
    // Validate ethers is available
    if (!ethers) {
      console.error('❌ Ethers library not available');
    } else {
      console.log('✅ Ethers library available');
    }
  }

  addTransaction(txData) {
    const transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      queuePosition: this.queue.length + 1
    };
    
    this.queue.push(transaction);
    console.log(`Transaction ${transaction.id} added to queue`);
    
    // For serverless environments, process immediately
    // Don't wait for the processing to complete to avoid timeout
    this.processQueueImmediate();
    
    return transaction;
  }

  // Immediate processing for serverless environments
  async processQueueImmediate() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🚀 Starting immediate queue processing with ${this.queue.length} transactions`);

    // Process only the first transaction immediately
    if (this.queue.length > 0) {
      const transaction = this.queue.shift();
      this.currentTransaction = transaction;
      
      try {
        transaction.status = 'processing';
        transaction.startedAt = new Date().toISOString();
        
        console.log(`🔄 Processing transaction ${transaction.id} for ${transaction.walletAddress}`);
        
        await this.executeTransactions(transaction);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();
        this.completedTransactions.push(transaction);
        
        console.log(`✅ Transaction ${transaction.id} completed successfully`);
        console.log(`📈 Total completed: ${this.completedTransactions.length}`);
        
      } catch (error) {
        console.error(`❌ Transaction ${transaction.id} failed:`, error.message);
        console.error(`🔍 Error details:`, {
          name: error.name,
          code: error.code,
          reason: error.reason
        });
        
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.errorDetails = {
          name: error.name,
          code: error.code,
          reason: error.reason
        };
        transaction.failedAt = new Date().toISOString();
        this.failedTransactions.push(transaction);
        
        console.log(`📊 Total failed: ${this.failedTransactions.length}`);
        
        // Re-throw the error so webhook can return it
        throw error;
      }
      
      this.currentTransaction = null;
    }

    this.processing = false;
    console.log('✅ Immediate processing completed');
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
        
        console.log(`🔄 Processing transaction ${transaction.id} for ${transaction.walletAddress}`);
        console.log(`📊 Queue position: ${this.queue.length + 1}, Amount: ${transaction.amount}`);
        
        await this.executeTransactions(transaction);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();
        this.completedTransactions.push(transaction);
        
        console.log(`✅ Transaction ${transaction.id} completed successfully`);
        console.log(`📈 Total completed: ${this.completedTransactions.length}`);
        
      } catch (error) {
        console.error(`❌ Transaction ${transaction.id} failed:`, error.message);
        console.error(`🔍 Error details:`, {
          name: error.name,
          code: error.code,
          reason: error.reason,
          stack: error.stack?.split('\n')[0]
        });
        
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.errorDetails = {
          name: error.name,
          code: error.code,
          reason: error.reason
        };
        transaction.failedAt = new Date().toISOString();
        this.failedTransactions.push(transaction);
        
        console.log(`📊 Total failed: ${this.failedTransactions.length}`);
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
    const { amount, walletAddress } = transaction;
    
    // Validate environment variables
    if (!process.env.TATUM_API_KEY) {
      throw new Error('TATUM_API_KEY environment variable not set');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable not set');
    }
    if (!process.env.ETH_AMOUNT) {
      throw new Error('ETH_AMOUNT environment variable not set');
    }
    
    console.log(`Executing transactions for ${walletAddress}:`);
    console.log(`- D.FAITH amount: ${amount}`);
    console.log(`- ETH amount: ${process.env.ETH_AMOUNT}`);
    
    // Setup wallet address from private key
    let walletFromPrivateKey;
    try {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      walletFromPrivateKey = wallet.address;
      console.log(`✅ Wallet address: ${walletFromPrivateKey}`);
    } catch (error) {
      throw new Error(`Failed to derive wallet address: ${error.message}`);
    }

    // 1. Send D.FAITH tokens using Tatum API
    console.log('🪙 Starting token transfer with Tatum API...');
    const tokenTx = await this.sendTokensWithTatum(walletFromPrivateKey, walletAddress, amount);
    transaction.tokenTxHash = tokenTx.txId;
    console.log(`✅ Token transfer completed: ${tokenTx.txId}`);
    
    // 2. Send ETH using Tatum API
    console.log('💰 Starting ETH transfer with Tatum API...');
    const ethTx = await this.sendETHWithTatum(walletFromPrivateKey, walletAddress, process.env.ETH_AMOUNT);
    transaction.ethTxHash = ethTx.txId;
    console.log(`✅ ETH transfer completed: ${ethTx.txId}`);
  }

  async sendTokensWithTatum(fromAddress, toAddress, amount) {
    console.log(`📤 Sending ${amount} D.FAITH tokens to ${toAddress} using Tatum API...`);
    
    try {
      // Convert amount to token units (considering decimals)
      const tokenAmount = ethers.parseUnits(amount.toString(), DFAITH_DECIMALS);
      console.log(`🔢 Token amount in units: ${tokenAmount.toString()}`);
      
      // Prepare Tatum Base API request for ERC-20 transfer
      const tatumRequest = {
        to: toAddress,
        amount: tokenAmount.toString(),
        contractAddress: DFAITH_TOKEN_ADDRESS,
        fromPrivateKey: process.env.PRIVATE_KEY,
        fee: {
          gasLimit: '100000',
          gasPrice: '20' // 20 Gwei
        }
      };
      
      console.log(`📡 Sending Tatum Base API request...`);
      const response = await fetch('https://api.tatum.io/v3/base/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TATUM_API_KEY
        },
        body: JSON.stringify(tatumRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Tatum API error (${response.status}): ${errorData}`);
      }
      
      const result = await response.json();
      console.log(`📋 D.FAITH transfer transaction sent: ${result.txId}`);
      
      // Wait a bit for transaction to be mined
      console.log(`⏳ Waiting for confirmation...`);
      await this.waitForTransactionConfirmation(result.txId);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Token transfer with Tatum failed:`, error.message);
      throw error;
    }
  }

  async sendETHWithTatum(fromAddress, toAddress, ethAmount) {
    console.log(`💰 Sending ${ethAmount} ETH to ${toAddress} using Tatum API...`);
    
    try {
      const ethAmountWei = ethers.parseEther(ethAmount);
      console.log(`🔢 ETH amount in wei: ${ethAmountWei.toString()}`);
      
      // Prepare Tatum Base API request for ETH transfer
      const tatumRequest = {
        to: toAddress,
        amount: ethers.formatEther(ethAmountWei), // Tatum expects ETH amount in ETH, not wei
        fromPrivateKey: process.env.PRIVATE_KEY,
        fee: {
          gasLimit: '21000',
          gasPrice: '20' // 20 Gwei
        }
      };
      
      console.log(`📡 Sending Tatum Base API request...`);
      const response = await fetch('https://api.tatum.io/v3/base/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TATUM_API_KEY
        },
        body: JSON.stringify(tatumRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Tatum API error (${response.status}): ${errorData}`);
      }
      
      const result = await response.json();
      console.log(`📋 ETH transfer transaction sent: ${result.txId}`);
      
      // Wait a bit for transaction to be mined
      console.log(`⏳ Waiting for confirmation...`);
      await this.waitForTransactionConfirmation(result.txId);
      
      return result;
      
    } catch (error) {
      console.error(`❌ ETH transfer with Tatum failed:`, error.message);
      throw error;
    }
  }

  async waitForTransactionConfirmation(txHash) {
    try {
      // Wait for transaction confirmation using Tatum API
      const maxAttempts = 10;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const response = await fetch(`https://api.tatum.io/v3/blockchain/transaction/BASE/${txHash}`, {
          headers: {
            'x-api-key': process.env.TATUM_API_KEY
          }
        });
        
        if (response.ok) {
          const txData = await response.json();
          if (txData.blockNumber) {
            console.log(`✅ Transaction confirmed in block: ${txData.blockNumber}`);
            return txData;
          }
        }
        
        attempts++;
        console.log(`⏳ Waiting for confirmation... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log(`⚠️ Transaction confirmation timeout, but likely successful`);
      return { confirmed: false };
      
    } catch (error) {
      console.log(`⚠️ Could not verify transaction confirmation: ${error.message}`);
      return { confirmed: false };
    }
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
