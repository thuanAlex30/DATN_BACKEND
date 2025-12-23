#!/usr/bin/env node
const axios = require('axios');

(async () => {
  const apiUrl = process.env.NGROK_API_URL || 'http://127.0.0.1:4040/api/tunnels';
  try {
    const resp = await axios.get(apiUrl, { timeout: 2000 });
    const data = resp.data;
    let publicUrl = null;

    if (Array.isArray(data) && data.length) {
      publicUrl = data[0].public_url || data[0].url || data[0].publicUrl;
    } else if (data && Array.isArray(data.tunnels) && data.tunnels.length) {
      publicUrl = data.tunnels[0].public_url || data.tunnels[0].url || data.tunnels[0].publicUrl;
    }

    if (!publicUrl) {
      console.error('No ngrok tunnel found');
      process.exit(2);
    }

    console.log(publicUrl);
    process.exit(0);
  } catch (err) {
    console.error('Error fetching ngrok API:', err.message || err);
    process.exit(1);
  }
})();


