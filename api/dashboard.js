import { transactionQueue } from '../utils/queue.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are accepted'
    });
  }

  try {
    const { id } = req.query;

    if (id) {
      // Get specific transaction
      const transaction = transactionQueue.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: transaction
      });
    } else {
      // Get queue status
      const queueStatus = transactionQueue.getQueueStatus();
      
      return res.status(200).json({
        success: true,
        data: queueStatus,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Dashboard API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
