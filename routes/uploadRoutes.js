const express = require('express');
const multer = require('multer');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const { uploadImageBuffer } = require('../utils/cloudinaryHelper');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

const router = express.Router();

// Configure multer for image uploads (use memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload multiple images
router.post(
  '/images',
  AuthMiddleware.authenticate,
  upload.array('images', 10), // Max 10 images
  ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return ApiResponse.error(res, 'Không có file nào được upload', 400);
    }

    const uploadedUrls = [];
    const folder = process.env.CLOUDINARY_PROJECT_FOLDER || 'project-reports';

    try {
      // Upload each image to Cloudinary
      for (const file of req.files) {
        try {
          const uploadRes = await uploadImageBuffer(file.buffer, file.originalname, folder);
          uploadedUrls.push(uploadRes.secureUrl);
        } catch (err) {
          console.error(`Error uploading image ${file.originalname}:`, err);
          // Continue with other images even if one fails
        }
      }

      if (uploadedUrls.length === 0) {
        return ApiResponse.error(res, 'Không thể upload ảnh lên Cloudinary', 500);
      }

      return ApiResponse.success(
        res,
        uploadedUrls,
        `Đã upload ${uploadedUrls.length} ảnh thành công`,
        200
      );
    } catch (error) {
      console.error('Error in upload images:', error);
      return ApiResponse.error(res, 'Lỗi khi upload ảnh: ' + error.message, 500);
    }
  })
);

module.exports = router;

