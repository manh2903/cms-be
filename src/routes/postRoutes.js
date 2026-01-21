const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Public routes
router.get('/public', postController.getPublicPosts);
router.get('/public/:id', postController.getPostDetail);

// Protected routes (User + Admin)
router.post('/', authMiddleware, upload.single('logo'), postController.createPost);
router.put('/:id', authMiddleware, upload.single('logo'), postController.updatePost);

// Admin routes
router.get('/admin', authMiddleware, adminMiddleware, postController.getAllPostsAdmin);
router.patch('/:id/approve', authMiddleware, adminMiddleware, postController.approvePost);
router.delete('/:id', authMiddleware, adminMiddleware, postController.deletePost);

module.exports = router;
