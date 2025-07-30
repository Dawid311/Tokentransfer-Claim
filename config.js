// Base Chain Configuration
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';

// Token Configuration
export const DFAITH_TOKEN_ADDRESS = '0x69eFD833288605f320d77eB2aB99DDE62919BbC1';
export const DFAITH_DECIMALS = 2;

// ERC-20 ABI (minimal)
export const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

// Environment variables validation
export function validateEnv() {
  const required = ['PRIVATE_KEY', 'ETH_AMOUNT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Request validation
export function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body: must be a JSON object');
  }
  
  if (!body.amount || !body.walletAddress) {
    throw new Error('Missing required fields: amount and walletAddress');
  }
  
  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
    throw new Error('Invalid wallet address format');
  }
  
  return {
    amount: amount,
    walletAddress: body.walletAddress
  };
}
