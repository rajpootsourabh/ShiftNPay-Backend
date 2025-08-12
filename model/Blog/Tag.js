const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  count: { type: Number, default: 0 },
});

module.exports = mongoose.model('Tag', tagSchema);
