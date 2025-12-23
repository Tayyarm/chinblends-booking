// TickTick OAuth Token Helper Script
// This script helps you get your TickTick access token

import axios from 'axios';

// INSTRUCTIONS:
// 1. Replace YOUR_CLIENT_ID with your actual Client ID
// 2. Replace YOUR_CLIENT_SECRET with your actual Client Secret
// 3. Replace YOUR_CODE with the code you got from the redirect URL
// 4. Run: node get-ticktick-token.js

const CLIENT_ID = '1h8R07WMHNijqA75cL';
const CLIENT_SECRET = 'eFRF3td0JGkbRDoD9h4cpwnuaLDo81uW';
const CODE = 'n8rPfh';
const REDIRECT_URI = 'http://localhost:5173/';

async function getAccessToken() {
  try {
    console.log('Requesting access token from TickTick...\n');

    // Try using URL-encoded form data instead of JSON
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', CODE);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', REDIRECT_URI);

    const response = await axios.post('https://ticktick.com/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('✓ Success! Here is your TickTick access token:\n');
    console.log('TICKTICK_ACCESS_TOKEN=' + response.data.access_token);
    console.log('\n\nCopy the line above and add it to your Vercel environment variables!');
    console.log('\nYour token expires in:', response.data.expires_in, 'seconds');

    if (response.data.refresh_token) {
      console.log('\nRefresh token (save this for later):', response.data.refresh_token);
    }

  } catch (error) {
    console.error('❌ Error getting access token:');
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data || error.message);
    console.log('\nRequest details:');
    console.log('Client ID:', CLIENT_ID);
    console.log('Code:', CODE);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('\nMake sure you:');
    console.log('1. Replaced YOUR_CLIENT_ID with your actual Client ID');
    console.log('2. Replaced YOUR_CLIENT_SECRET with your actual Client Secret');
    console.log('3. Replaced YOUR_CODE with the code from the redirect URL');
    console.log('4. Used the code within a few minutes (codes expire quickly)');
  }
}

getAccessToken();
