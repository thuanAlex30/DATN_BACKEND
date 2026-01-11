const express = require('express');
const axios = require('axios');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const { ApiResponse } = require('../utils/response');

const router = express.Router();

// GET /api/utils/ngrok-url
router.get(
  '/ngrok-url',
  ErrorMiddleware.asyncHandler(async (req, res) => {
    const apiUrl = process.env.NGROK_API_URL || 'http://127.0.0.1:4040/api/tunnels';
    try {
      const resp = await axios.get(apiUrl, { timeout: 2000 });
      const data = resp.data;
      let publicUrl = null;

      if (Array.isArray(data) && data.length) {
        publicUrl = data[0].public_url || data[0].url || data[0].publicUrl;
      } else if (data && Array.isArray(data.tunnels) && data.tunnels.length) {
        publicUrl = data.tunnels[0].public_url || data.tunnels[0].url || data.tunnels[0].publicUrl;
      } else if (data && data.tunnel && (data.tunnel.public_url || data.tunnel.url)) {
        publicUrl = data.tunnel.public_url || data.tunnel.url;
      }

      if (!publicUrl) {
        return ApiResponse.error(res, 'Không tìm thấy ngrok tunnel', 500);
      }

      return ApiResponse.success(res, { ngrokUrl: publicUrl }, 'OK', 200);
    } catch (err) {
      console.error('Error fetching ngrok API:', err.message || err);
      return ApiResponse.error(res, 'Ngrok API không sẵn sàng: ' + (err.message || err), 500);
    }
  })
);

module.exports = router;


