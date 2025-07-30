import { validateEnv, validateRequest } from '../config.js';
import { transactionQueue } from '../utils/queue.js';

// Store logs in memory for debugging
let debugLogs = [];

// Override console.log to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const message = args.join(' ');
  debugLogs.push({ type: 'log', message, timestamp: new Date().toISOString() });
  originalConsoleLog(...args);
};

console.error = (...args) => {
  const message = args.join(' ');
  debugLogs.push({ type: 'error', message, timestamp: new Date().toISOString() });
  originalConsoleError(...args);
};

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
    // Clear previous logs for this request
    debugLogs = [];
    
    console.log('🚀 Starting debug webhook handler...');
    
    // Validate environment variables
    console.log('🔧 Validating environment...');
    validateEnv();
    console.log('✅ Environment validated');

    // Validate request body
    console.log('📝 Validating request...');
    const { amount, walletAddress } = validateRequest(req.body);
    console.log(`✅ Request validated: ${amount} tokens to ${walletAddress}`);

    console.log(`📨 Received debug webhook request:`, {
      amount,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    // Add transaction to queue
    console.log('📋 Adding transaction to queue...');
    const transaction = transactionQueue.addTransaction({
      amount,
      walletAddress,
      timestamp: Date.now()
    });
    console.log(`✅ Transaction added with ID: ${transaction.id}`);

    // Wait a bit to see if processing starts
    console.log('⏳ Waiting for processing to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get current queue status
    const queueStatus = transactionQueue.getQueueStatus();
    console.log('📊 Current queue status:', JSON.stringify(queueStatus.stats, null, 2));

    // Return detailed response with logs
    return res.status(200).json({
      success: true,
      message: 'Debug transaction processed',
      data: {
        transactionId: transaction.id,
        amount,
        walletAddress,
        queuePosition: transaction.queuePosition
      },
      debug: {
        logs: debugLogs,
        queueStatus: queueStatus,
        environmentCheck: {
          privateKeyExists: !!process.env.PRIVATE_KEY,
          ethAmountSet: !!process.env.ETH_AMOUNT,
          nodeEnv: process.env.NODE_ENV
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug webhook error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message,
      debug: {
        logs: debugLogs,
        environmentCheck: {
          privateKeyExists: !!process.env.PRIVATE_KEY,
          ethAmountSet: !!process.env.ETH_AMOUNT,
          nodeEnv: process.env.NODE_ENV
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}
