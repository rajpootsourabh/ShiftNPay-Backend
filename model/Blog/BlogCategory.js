const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory'
  }],
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all descendants
categorySchema.virtual('descendants', {
  ref: 'BlogCategory',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Virtual for getting all ancestors
categorySchema.virtual('ancestors', {
  ref: 'BlogCategory',
  localField: 'parent',
  foreignField: '_id',
  justOne: false
});

// Pre-save hook to generate slug
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

// Update children references when parent changes
categorySchema.pre('save', async function(next) {
  if (this.isModified('parent')) {
    // Remove from old parent's children array
    if (this.originalParent) {
      await this.model('BlogCategory').updateOne(
        { _id: this.originalParent },
        { $pull: { children: this._id } }
      );
    }
    
    // Add to new parent's children array
    if (this.parent) {
      await this.model('BlogCategory').updateOne(
        { _id: this.parent },
        { $addToSet: { children: this._id } }
      );
    }
  }
  next();
});

// Store original parent for hooks
categorySchema.pre('save', function(next) {
  if (this.isModified('parent')) {
    this.originalParent = this._originalParent || this.parent;
  }
  next();
});

const BlogCategory = mongoose.model('BlogCategory', categorySchema);
module.exports = BlogCategory;