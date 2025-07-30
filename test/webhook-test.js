import axios from 'axios';

// Test configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';

async function testWebhook() {
  const testData = {
    amount: 5.5,
    walletAddress: '0x742d35Cc6634C0532925a3b8D4e3AA5C7b73D7e5' // Example address
  };

  try {
    console.log('Testing webhook with data:', testData);
    
    const response = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
testWebhook();
