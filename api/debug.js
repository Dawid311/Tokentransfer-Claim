export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    envCheck: {
      TATUM_API_KEY: !!process.env.TATUM_API_KEY,
      PRIVATE_KEY: !!process.env.PRIVATE_KEY,
      ETH_AMOUNT: !!process.env.ETH_AMOUNT,
      NODE_ENV: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString()
  });
}
