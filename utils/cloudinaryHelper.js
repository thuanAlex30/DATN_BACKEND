const path = require('path');
const cloudinary = require('cloudinary').v2;

const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

const CLOUDINARY_ENABLED = Boolean(
  CLOUDINARY_CONFIG.cloudName &&
  CLOUDINARY_CONFIG.apiKey &&
  CLOUDINARY_CONFIG.apiSecret
);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
  });
}

/**
 * Upload an image buffer to Cloudinary.
 * Returns { secureUrl, publicId } or throws if Cloudinary is not configured.
 */
async function uploadImageBuffer(buffer, originalName, folder = 'ppe') {
  if (!CLOUDINARY_ENABLED) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  const { name } = path.parse(originalName || `image-${Date.now()}`);
  const publicId = `${name}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        eager_async: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

module.exports = {
  uploadImageBuffer,
  CLOUDINARY_ENABLED,
};

