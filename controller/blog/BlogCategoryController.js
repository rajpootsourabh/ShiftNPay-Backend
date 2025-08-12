const BlogCategory = require("../../model/Blog/BlogCategory");

// Get all categories with hierarchy
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().populate('parent', 'name');
    const categoryTree = buildCategoryTree(categories);
    res.json(categoryTree);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories',
      error: err.message 
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;
    
    const category = new BlogCategory({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      parent: parent || null
    });

    const savedCategory = await category.save();
    
    // Update parent's children array if parent exists
    if (parent) {
      await BlogCategory.findByIdAndUpdate(parent, {
        $addToSet: { children: savedCategory._id }
      });
    }

    res.status(201).json({
      success: true,
      category: savedCategory
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: err.message
    });
  }
};

// Bulk delete categories
exports.bulkDeleteCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No category IDs provided'
      });
    }

    // Recursive function to collect all child IDs
    const collectAllDescendants = async (categoryIds, collected = new Set()) => {
      for (const id of categoryIds) {
        if (!collected.has(id.toString())) {
          collected.add(id.toString());
          const children = await BlogCategory.find({ parent: id }, '_id');
          const childIds = children.map(c => c._id);
          await collectAllDescendants(childIds, collected);
        }
      }
      return Array.from(collected);
    };

    // Collect all IDs to delete (original + children)
    const allIdsToDelete = await collectAllDescendants(ids);

    // Delete all categories in one go
    await BlogCategory.deleteMany({ _id: { $in: allIdsToDelete } });

    res.json({
      success: true,
      message: `${allIdsToDelete.length} categories (including children) deleted successfully`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting categories',
      error: err.message
    });
  }
};


// Bulk update categories
exports.bulkUpdateCategories = async (req, res) => {
  try {
    const { ids, name } = req.body;
    
    await BlogCategory.updateMany(
      { _id: { $in: ids } },
      { $set: { name } }
    );

    res.json({
      success: true,
      message: `${ids.length} categories updated successfully`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating categories',
      error: err.message
    });
  }
};

// Update single category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parent } = req.body;

    // Get current category to check for parent changes
    const currentCategory = await BlogCategory.findById(id);
    const originalParent = currentCategory.parent;

    const updatedCategory = await BlogCategory.findByIdAndUpdate(
      id,
      { name, slug, description, parent },
      { new: true, runValidators: true }
    );

    // Handle parent changes
    if (originalParent !== parent) {
      // Remove from old parent's children array
      if (originalParent) {
        await BlogCategory.findByIdAndUpdate(originalParent, {
          $pull: { children: id }
        });
      }
      
      // Add to new parent's children array
      if (parent) {
        await BlogCategory.findByIdAndUpdate(parent, {
          $addToSet: { children: id }
        });
      }
    }

    res.json({
      success: true,
      category: updatedCategory
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: err.message
    });
  }
};

// Delete single category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Recursively delete child categories
    const deleteChildren = async (parentId) => {
      const children = await BlogCategory.find({ parent: parentId });
      for (const child of children) {
        await deleteChildren(child._id); // Recursive delete
        await BlogCategory.findByIdAndDelete(child._id);
      }
    };

    await deleteChildren(category._id);

    // Remove from parent's children array if exists (optional if you're not storing this manually)
    if (category.parent) {
      await BlogCategory.findByIdAndUpdate(category.parent, {
        $pull: { children: id },
      });
    }

    // Delete the main category
    await BlogCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category and its children deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: err.message,
    });
  }
};


const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];

  const filteredCategories = categories.filter(category => {
    const categoryParentId = category.parent?._id || category.parent || null;
    return String(categoryParentId) === String(parentId);
  });

  for (const category of filteredCategories) {
    const children = buildCategoryTree(categories, category._id);
    const categoryData = { ...category._doc, children: [] };

    if (children.length) {
      categoryData.children = children;
    }

    tree.push(categoryData);
  }

  return tree;
};

// Flatten category tree for table display
const flattenCategoryTree = (tree, level = 0, result = []) => {
  for (const category of tree) {
    result.push({
      ...category,
      level,
      nameDisplay: `${'— '.repeat(level)}${category.name}`
    });
    if (category.children && category.children.length) {
      flattenCategoryTree(category.children, level + 1, result);
    }
  }
  return result;
};