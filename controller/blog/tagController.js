// controllers/tagController.js
const slugify = require('slugify');
const Tag = require('../../model/Blog/Tag');


exports.createTag = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newTag = new Tag({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      count: 0,
    });

    await newTag.save();
    res.status(201).json({ message: 'Tag created successfully', tag: newTag });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Bulk actions (delete/edit)
exports.bulkActionTags = async (req, res) => {
  const { ids } = req.body;

  try {
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'No tags selected' });

      await Tag.deleteMany({ _id: { $in: ids } });
      return res.json({ message: 'Tags deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Optional: Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};