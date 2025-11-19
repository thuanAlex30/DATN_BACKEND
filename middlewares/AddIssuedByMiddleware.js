// Middleware để thêm issued_by vào request body trước khi validation
const addIssuedByMiddleware = (req, res, next) => {
  console.log('🔍 AddIssuedByMiddleware - req.user:', req.user);
  console.log('🔍 AddIssuedByMiddleware - req.body BEFORE:', req.body);
  
  // Thêm issued_by từ req.user vào req.body
  if (req.user && (req.user.id || req.user._id)) {
    const userId = req.user.id || req.user._id;
    // Chuyển đổi ObjectId thành string để Joi validation có thể xử lý
    req.body.issued_by = userId.toString();
    console.log('✅ AddIssuedByMiddleware - Added issued_by:', req.body.issued_by);
  } else {
    console.log('❌ AddIssuedByMiddleware - No user found or no id');
  }
  
  console.log('🔍 AddIssuedByMiddleware - req.body AFTER:', req.body);
  next();
};

module.exports = addIssuedByMiddleware;
