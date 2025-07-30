import { validateEnv, validateRequest } from '../config.js';
import { transactionQueue } from '../utils/queue.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log every incoming request
  console.log(`🌐 Incoming ${req.method} request to /api/webhook`, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed`);
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    console.log('🔍 Starting validation...');
    
    // Validate environment variables
    validateEnv();
    console.log('✅ Environment variables validated');

    // Validate request body
    const { amount, walletAddress } = validateRequest(req.body);
    console.log('✅ Request body validated', { amount, walletAddress });

    console.log(`📨 Processing webhook request:`, {
      amount,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    // Add transaction to queue and wait for processing
    try {
      console.log('🏗️ Creating transaction...');
      const transaction = transactionQueue.addTransaction({
        amount,
        walletAddress,
        timestamp: Date.now()
      });

      console.log(`🚀 Transaction ${transaction.id} added to queue, starting immediate processing...`);
      console.log(`📋 Transaction details:`, transaction);

      // Check queue status before processing
      const queueStatusBefore = transactionQueue.getQueueStatus();
      console.log(`📊 Queue status before processing:`, {
        queueLength: queueStatusBefore.stats.queueLength,
        isProcessing: queueStatusBefore.stats.isProcessing,
        totalCompleted: queueStatusBefore.stats.totalCompleted,
        totalFailed: queueStatusBefore.stats.totalFailed
      });

      // Wait for the immediate processing to complete
      try {
        console.log(`⚡ Starting processQueueImmediate()...`);
        await transactionQueue.processQueueImmediate();
        console.log(`✅ processQueueImmediate() completed for transaction ${transaction.id}`);
      } catch (processingError) {
        console.error(`❌ Processing error for transaction ${transaction.id}:`, {
          message: processingError.message,
          stack: processingError.stack,
          name: processingError.name
        });
        throw processingError;
      }

      // Check queue status after processing
      const queueStatusAfter = transactionQueue.getQueueStatus();
      console.log(`📊 Queue status after processing:`, {
        queueLength: queueStatusAfter.stats.queueLength,
        isProcessing: queueStatusAfter.stats.isProcessing,
        totalCompleted: queueStatusAfter.stats.totalCompleted,
        totalFailed: queueStatusAfter.stats.totalFailed
      });

      // Check final status
      const finalTransaction = transactionQueue.getTransactionById(transaction.id);
      console.log(`📊 Final transaction status:`, {
        id: finalTransaction?.id,
        status: finalTransaction?.status,
        error: finalTransaction?.error,
        tokenTxHash: finalTransaction?.tokenTxHash,
        ethTxHash: finalTransaction?.ethTxHash,
        createdAt: finalTransaction?.createdAt,
        startedAt: finalTransaction?.startedAt,
        completedAt: finalTransaction?.completedAt,
        failedAt: finalTransaction?.failedAt
      });
      
      if (finalTransaction && finalTransaction.status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Transaction completed successfully',
          data: {
            transactionId: transaction.id,
            amount,
            walletAddress,
            status: finalTransaction.status,
            tokenTxHash: finalTransaction.tokenTxHash,
            ethTxHash: finalTransaction.ethTxHash,
            completedAt: finalTransaction.completedAt
          }
        });
      } else if (finalTransaction && finalTransaction.status === 'failed') {
        console.error(`💥 Transaction failed:`, finalTransaction.error);
        return res.status(400).json({
          success: false,
          message: 'Transaction failed',
          error: finalTransaction.error,
          data: {
            transactionId: transaction.id,
            amount,
            walletAddress,
            status: finalTransaction.status,
            errorDetails: finalTransaction.errorDetails
          }
        });
      } else {
        console.log(`⏳ Transaction still processing or unknown status`);
        return res.status(200).json({
          success: true,
          message: 'Transaction queued successfully',
          data: {
            transactionId: transaction.id,
            amount,
            walletAddress,
            queuePosition: transaction.queuePosition,
            status: transaction.status
          }
        });
      }
      
    } catch (processingError) {
      console.error('Transaction processing error:', processingError);
      
      return res.status(400).json({
        success: false,
        error: processingError.message,
        message: 'Transaction processing failed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
