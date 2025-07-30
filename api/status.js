import { ethers } from 'ethers';
import { 
  BASE_RPC_URL, 
  DFAITH_TOKEN_ADDRESS, 
  DFAITH_DECIMALS, 
  ERC20_ABI,
  validateEnv 
} from '../config.js';

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
