// models/Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String, // Use this for the main text editor content
  },
  excerpt: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft',
  },
  publishDate: {
    type: Date,
    default: Date.now,
  },
  featuredImage: {
    type: String, // Store image path or URL
  },
  galleryImages: [
    {
      type: String, // Image paths for gallery
    },
  ],
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
    },
  ],
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    },
  ],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin', // or 'Admin'
  },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
