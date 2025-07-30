import { validateEnv, validateRequest } from '../config.js';
import { transactionQueue } from '../utils/queue.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    // Validate environment variables
    validateEnv();

    // Validate request body
    const { amount, walletAddress } = validateRequest(req.body);

    console.log(`Received webhook request:`, {
      amount,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    // Add transaction to queue and wait for processing
    try {
      const transaction = transactionQueue.addTransaction({
        amount,
        walletAddress,
        timestamp: Date.now()
      });

      // Wait for the immediate processing to complete
      await transactionQueue.processQueueImmediate();

      // Check final status
      const finalTransaction = transactionQueue.getTransactionById(transaction.id);
      
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
