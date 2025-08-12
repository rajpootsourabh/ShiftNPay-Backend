
const menuCategories = require('../../config/menuCategories');
const User = require('../../model/User');
const VendorMenuAccess = require('../../model/MenuMangement/VendorMenuAccess');

const getMainCategories = () => {
  return menuCategories.map(category => category);
};

exports.getProductCategory = async (req, res) => {
  try {
    console.log(menuCategories)
   return res.json(menuCategories.map(category => category));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVendorsForCategory = async (req, res) => {
  try {
    const category = decodeURIComponent(req.query.category);    
    const subCategory = req.query.subCategory;                  

    let accessRecords;

    if (subCategory) {
      accessRecords = await VendorMenuAccess.find({
        category: {
          $elemMatch: {
            name: category,
            subcategories: subCategory
          }
        }
      });
    } else {
      accessRecords = await VendorMenuAccess.find({
        'category.name': category
      });
    }

    const vendorIds = accessRecords.map(record => record.vendorId);

    const vendors = await User.find({
      _id: { $in: vendorIds }
    }).select('_id name email');

    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors for category:", err);
    res.status(500).json({ message: err.message });
  }
};



// @desc    Update access for a category
// @route   POST /api/admin/menu-access/:category/update-access
// @access  Private/Admin
exports.updateCategoryAccess = async (req, res) => {
  try {
    const { vendorIds = [], subCategory } = req.body;
    const categoryName = decodeURIComponent(req.body.category); // e.g., "employee_management"
    
    // Fetch all vendors who currently have this category + subCategory
    const allAccessDocs = await VendorMenuAccess.find({
      'category.name': categoryName
    });

    // Get current vendors who have this subcategory under the category
    const vendorsWithSub = allAccessDocs.filter(doc => {
      const cat = doc.category.find(c => c.name === categoryName);
      return cat && cat.subcategories?.includes(subCategory);
    });

    const currentVendorIdsWithAccess = vendorsWithSub.map(v => v.vendorId.toString());
    const selectedVendorIds = vendorIds;

    // Vendors to remove access
    const vendorIdsToRemove = currentVendorIdsWithAccess.filter(
      id => !selectedVendorIds.includes(id)
    );

    // Remove subcategory from those vendors
    if (vendorIdsToRemove.length > 0) {
      await Promise.all(
        vendorIdsToRemove.map(async (vendorId) => {
          await VendorMenuAccess.updateOne(
            { vendorId, 'category.name': categoryName },
            {
              $pull: { 'category.$.subcategories': subCategory },
              $set: { updatedAt: new Date() }
            }
          );
        })
      );
    }

    // Add subcategory for selected vendors
    for (const vendorId of selectedVendorIds) {
      const doc = await VendorMenuAccess.findOne({ vendorId });

      if (!doc) {
        // New vendor doc
        await VendorMenuAccess.create({
          vendorId,
          category: [{ name: categoryName, subcategories: [subCategory] }],
          updatedAt: new Date()
        });
      } else {
        // Check if category exists
        const catIndex = doc.category.findIndex(cat => cat.name === categoryName);

        if (catIndex === -1) {
          // Add whole category and subcategory
          await VendorMenuAccess.updateOne(
            { vendorId },
            {
              $push: {
                category: { name: categoryName, subcategories: [subCategory] }
              },
              $set: { updatedAt: new Date() }
            }
          );
        } else {
          // Just add the subcategory to existing category
          await VendorMenuAccess.updateOne(
            { vendorId, 'category.name': categoryName },
            {
              $addToSet: { 'category.$.subcategories': subCategory },
              $set: { updatedAt: new Date() }
            }
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating vendor category access:", err);
    res.status(500).json({ message: err.message });
  }
};


// controllers/vendorAccessController.js

exports.getVendorCategoryAccess = async (req, res) => {
  try {
    const data = await VendorMenuAccess.findOne({ vendorId :req.user._id});

    return res.json({ data });
  } catch (error) {
    console.error('Error checking vendor access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
