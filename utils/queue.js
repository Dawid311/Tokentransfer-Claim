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
    this.allTransactions = new Map(); // Persistente Speicherung aller Transaktionen
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
    
    // Speichere in persistenter Map
    this.allTransactions.set(transaction.id, transaction);
    this.queue.push(transaction);
    console.log(`Transaction ${transaction.id} added to queue and persistent storage`);
    
    // For serverless environments, process immediately
    // Don't wait for the processing to complete to avoid timeout
    this.processQueueImmediate().catch(error => {
      console.error('Background processing error:', error);
      // Update transaction status even if processing fails
      const tx = this.allTransactions.get(transaction.id);
      if (tx) {
        tx.status = 'failed';
        tx.error = error.message;
        tx.failedAt = new Date().toISOString();
        this.failedTransactions.push(tx);
      }
    });
    
    return transaction;
  }

  // Immediate processing for serverless environments
  async processQueueImmediate() {
    if (this.processing || this.queue.length === 0) {
      console.log(`⏭️ Skipping immediate processing: processing=${this.processing}, queueLength=${this.queue.length}`);
      return;
    }

    this.processing = true;
    console.log(`🚀 Starting immediate queue processing with ${this.queue.length} transactions`);

    let transaction = null;
    
    try {
      // Process only the first transaction immediately
      if (this.queue.length > 0) {
        transaction = this.queue.shift();
        this.currentTransaction = transaction;
        
        // Update in persistent storage
        const persistentTx = this.allTransactions.get(transaction.id);
        if (persistentTx) {
          persistentTx.status = 'processing';
          persistentTx.startedAt = new Date().toISOString();
        }
        
        console.log(`🔄 Processing transaction ${transaction.id} for ${transaction.walletAddress}`);
        
        transaction.status = 'processing';
        transaction.startedAt = new Date().toISOString();
        
        console.log(`⚡ Starting executeTransactions for ${transaction.id}...`);
        await this.executeTransactions(transaction);
        console.log(`✅ executeTransactions completed for ${transaction.id}`);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();
        
        // Update persistent storage
        if (persistentTx) {
          Object.assign(persistentTx, transaction);
        }
        
        this.completedTransactions.push(transaction);
        
        console.log(`✅ Transaction ${transaction.id} completed successfully`);
        console.log(`📈 Total completed: ${this.completedTransactions.length}`);
        
      }
    } catch (error) {
      console.error(`❌ Transaction ${transaction?.id || 'unknown'} failed:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        reason: error.reason
      });
      
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.errorDetails = {
          name: error.name,
          code: error.code,
          reason: error.reason,
          stack: error.stack?.split('\n')[0]
        };
        transaction.failedAt = new Date().toISOString();
        
        // Update persistent storage
        const persistentTx = this.allTransactions.get(transaction.id);
        if (persistentTx) {
          Object.assign(persistentTx, transaction);
        }
        
        this.failedTransactions.push(transaction);
        console.log(`📊 Total failed: ${this.failedTransactions.length}`);
      }
      
      // Re-throw the error so webhook can return it
      throw error;
    } finally {
      this.currentTransaction = null;
      this.processing = false;
      console.log(`🏁 Processing completed, processing flag reset`);
    }

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
    
    console.log(`🔧 Starting executeTransactions for ${transaction.id}`);
    
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
    
    console.log(`✅ Environment variables validated`);
    console.log(`Executing transactions for ${walletAddress}:`);
    console.log(`- D.FAITH amount: ${amount}`);
    console.log(`- ETH amount: ${process.env.ETH_AMOUNT}`);
    
    // Setup wallet address from private key
    let walletFromPrivateKey;
    try {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      walletFromPrivateKey = wallet.address;
      console.log(`✅ Wallet address derived: ${walletFromPrivateKey}`);
    } catch (error) {
      console.error(`❌ Failed to derive wallet address:`, error);
      throw new Error(`Failed to derive wallet address: ${error.message}`);
    }

    try {
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
      
      console.log(`🎉 All transactions completed for ${transaction.id}`);
      
    } catch (error) {
      console.error(`💥 executeTransactions failed for ${transaction.id}:`, {
        message: error.message,
        stack: error.stack,
        tokenTxHash: transaction.tokenTxHash,
        ethTxHash: transaction.ethTxHash
      });
      throw error;
    }
  }

  async sendTokensWithTatum(fromAddress, toAddress, amount) {
    console.log(`📤 Sending ${amount} D.FAITH tokens to ${toAddress} using Tatum API...`);
    
    try {
      // Convert amount to token units (considering decimals)
      const tokenAmount = ethers.parseUnits(amount.toString(), DFAITH_DECIMALS);
      console.log(`🔢 Token amount in units: ${tokenAmount.toString()}`);
      
      // Prepare Tatum ERC-20 transfer request (corrected endpoint and format)
      const tatumRequest = {
        chain: "BASE",
        to: toAddress,
        amount: tokenAmount.toString(),
        contractAddress: DFAITH_TOKEN_ADDRESS,
        fromPrivateKey: process.env.PRIVATE_KEY,
        fee: {
          gasLimit: "100000",
          gasPrice: "1000000000" // 1 Gwei in wei
        }
      };
      
      console.log(`📡 Sending Tatum ERC-20 transfer request...`, {
        chain: tatumRequest.chain,
        to: tatumRequest.to,
        amount: tatumRequest.amount,
        contractAddress: tatumRequest.contractAddress,
        gasLimit: tatumRequest.fee.gasLimit,
        gasPrice: tatumRequest.fee.gasPrice
      });
      
      // Use correct Tatum endpoint for ERC-20 transfers
      const response = await fetch('https://api.tatum.io/v3/blockchain/token/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TATUM_API_KEY
        },
        body: JSON.stringify(tatumRequest)
      });
      
      const responseText = await response.text();
      console.log(`📋 Tatum API response:`, {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      
      if (!response.ok) {
        throw new Error(`Tatum API error (${response.status}): ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
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
      
      // Prepare Tatum native transfer request (corrected format)
      const tatumRequest = {
        chain: "BASE",
        to: toAddress,
        amount: ethAmount, // Tatum expects ETH amount in ETH, not wei
        fromPrivateKey: process.env.PRIVATE_KEY,
        fee: {
          gasLimit: "21000",
          gasPrice: "1000000000" // 1 Gwei in wei
        }
      };
      
      console.log(`📡 Sending Tatum ETH transfer request...`, {
        chain: tatumRequest.chain,
        to: tatumRequest.to,
        amount: tatumRequest.amount,
        gasLimit: tatumRequest.fee.gasLimit,
        gasPrice: tatumRequest.fee.gasPrice
      });
      
      // Use correct Tatum endpoint for native transfers
      const response = await fetch('https://api.tatum.io/v3/blockchain/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TATUM_API_KEY
        },
        body: JSON.stringify(tatumRequest)
      });
      
      const responseText = await response.text();
      console.log(`📋 Tatum API response:`, {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      
      if (!response.ok) {
        throw new Error(`Tatum API error (${response.status}): ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
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
      const maxAttempts = 5; // Reduziert für schnellere Response
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const response = await fetch(`https://api.tatum.io/v3/blockchain/transaction/BASE/${txHash}`, {
          headers: {
            'x-api-key': process.env.TATUM_API_KEY
          }
        });
        
        if (response.ok) {
          const txData = await response.json();
          if (txData.blockNumber && txData.blockNumber > 0) {
            console.log(`✅ Transaction confirmed in block: ${txData.blockNumber}`);
            return txData;
          }
        }
        
        attempts++;
        console.log(`⏳ Waiting for confirmation... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Reduziert auf 2 Sekunden
      }
      
      console.log(`⚠️ Transaction confirmation timeout, but likely successful`);
      return { confirmed: false };
      
    } catch (error) {
      console.log(`⚠️ Could not verify transaction confirmation: ${error.message}`);
      return { confirmed: false };
    }
  }

  getTransactionById(id) {
    // First check persistent storage
    const persistentTx = this.allTransactions.get(id);
    if (persistentTx) {
      return persistentTx;
    }
    
    // Fallback to searching in all arrays
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
      allTransactions: Array.from(this.allTransactions.values()).slice(-20), // Letzte 20 Transaktionen
      stats: {
        queueLength: this.queue.length,
        totalCompleted: this.completedTransactions.length,
        totalFailed: this.failedTransactions.length,
        totalTransactions: this.allTransactions.size,
        isProcessing: this.processing
      },
      systemStatus: {
        ethersAvailable: !!ethers,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Create singleton instance
export const transactionQueue = new TransactionQueue();
console.log('TransactionQueue singleton created and exported');
