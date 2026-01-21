const { Post, User } = require('../models');
const { Op } = require('sequelize');

// Public: Get all approved posts
exports.getPublicPosts = async (req, res) => {
  try {
    const { sort } = req.query; // e.g., sort=view_count:DESC
    let order = [['sequence_number', 'ASC']];
    
    if (sort) {
      const [field, direction] = sort.split(':');
      if (['view_count', 'sequence_number', 'created_at'].includes(field)) {
        order = [[field, direction || 'DESC']];
      }
    }

    const posts = await Post.findAll({
      where: { is_approved: true },
      order,
      include: [
        { model: User, as: 'creator', attributes: ['username'] }
      ]
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public/User: Get single post and increment view
exports.getPostDetail = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Increment view count
    post.view_count += 1;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User: Create post
exports.createPost = async (req, res) => {
  try {
    const { sequence_number, title, post_title, content, category_name, topic_name } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await Post.create({
      sequence_number,
      title,
      post_title,
      content,
      category_name,
      topic_name,
      logo,
      created_by: req.user.id,
      is_approved: req.user.role === 'admin' // Auto approve if admin creates it
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all posts with filter/search/sort
exports.getAllPostsAdmin = async (req, res) => {
  try {
    const { category, topic, sort, search } = req.query;
    
    let where = {};
    if (category) where.category_name = { [Op.like]: `%${category}%` };
    if (topic) where.topic_name = topic;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { post_title: { [Op.like]: `%${search}%` } }
      ];
    }

    let order = [['created_at', 'DESC']];
    if (sort) {
      const [field, direction] = sort.split(':');
      order = [[field, direction]];
    }

    const posts = await Post.findAll({
      where,
      order,
      include: [
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'updater', attributes: ['username'] }
      ]
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Approve post
exports.approvePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.is_approved = true;
    post.updated_by = req.user.id;
    await post.save();

    res.json({ message: 'Post approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin/Owner: Update post
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check permission
    if (req.user.role !== 'admin' && post.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { sequence_number, title, post_title, content, category_name, topic_name, is_approved } = req.body;
    
    if (req.file) {
      post.logo = `/uploads/${req.file.filename}`;
    }

    post.sequence_number = sequence_number || post.sequence_number;
    post.title = title || post.title;
    post.post_title = post_title || post.post_title;
    post.content = content || post.content;
    post.category_name = category_name || post.category_name;
    post.topic_name = topic_name || post.topic_name;
    post.updated_by = req.user.id;

    if (req.user.role === 'admin' && is_approved !== undefined) {
      post.is_approved = is_approved;
    } else {
      post.is_approved = false; // Re-approval needed if user edits? (User choice, usually yes)
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await post.destroy();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
