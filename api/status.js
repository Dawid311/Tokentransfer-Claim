import { ethers } from 'ethers';
import { 
  BASE_RPC_URL, 
  DFAITH_TOKEN_ADDRESS, 
  DFAITH_DECIMALS, 
  ERC20_ABI,
  validateEnv 
} from '../config.js';
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
    // Validate environment variables
    validateEnv();

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Get balances
    const ethBalance = await provider.getBalance(wallet.address);
    
    const tokenContract = new ethers.Contract(DFAITH_TOKEN_ADDRESS, ERC20_ABI, provider);
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    
    // Get network info
    const network = await provider.getNetwork();
    const gasPrice = await provider.getFeeData();

    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      wallet: {
        address: wallet.address,
        ethBalance: ethers.formatEther(ethBalance),
        tokenBalance: ethers.formatUnits(tokenBalance, DFAITH_DECIMALS),
      },
      network: {
        name: network.name,
        chainId: Number(network.chainId),
        gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')
      },
      config: {
        tokenAddress: DFAITH_TOKEN_ADDRESS,
        tokenDecimals: DFAITH_DECIMALS,
        ethAmountPerTransfer: process.env.ETH_AMOUNT
      }
    };

    return res.status(200).json(status);

  } catch (error) {
    console.error('Status check error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

export async function transactionStatusHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (id) {
        // Get specific transaction by ID
        const transaction = transactionQueue.getTransactionById(id);
        
        if (!transaction) {
          return res.status(404).json({
            success: false,
            message: 'Transaction not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            ...transaction,
            blockchainTxHashes: {
              tokenTransfer: transaction.tokenTxHash || null,
              ethTransfer: transaction.ethTxHash || null
            }
          }
        });
      } else {
        // Get queue status
        const status = transactionQueue.getQueueStatus();
        return res.status(200).json({
          success: true,
          data: status
        });
      }
    } catch (error) {
      console.error('Status API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
