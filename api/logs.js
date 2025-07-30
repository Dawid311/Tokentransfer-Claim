import { transactionQueue } from '../utils/queue.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = transactionQueue.getQueueStatus();
    
    // Return comprehensive status
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        currentTime: new Date().toISOString(),
        queue: {
          current: status.queue,
          length: status.stats.queueLength,
          isProcessing: status.stats.isProcessing,
          currentTransaction: status.currentTransaction
        },
        history: {
          completed: status.completed,
          failed: status.failed,
          totalCompleted: status.stats.totalCompleted,
          totalFailed: status.stats.totalFailed
        },
        system: status.systemStatus,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasPrivateKey: !!process.env.PRIVATE_KEY,
          hasTatumKey: !!process.env.TATUM_API_KEY,
          hasEthAmount: !!process.env.ETH_AMOUNT
        }
      }
    });
    
  } catch (error) {
    console.error('Logs API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
