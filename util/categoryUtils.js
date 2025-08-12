// Build hierarchical category tree
exports.buildCategoryTree = (categories, parentId = null) => {
  const tree = [];
  const filteredCategories = categories.filter(
    category => String(category.parent) === String(parentId)
  );

  for (const category of filteredCategories) {
    const children = buildCategoryTree(categories, category._id);
    if (children.length) {
      category.children = children;
    }
    tree.push(category);
  }

  return tree;
};

// Flatten category tree for table display
exports.flattenCategoryTree = (tree, level = 0, result = []) => {
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