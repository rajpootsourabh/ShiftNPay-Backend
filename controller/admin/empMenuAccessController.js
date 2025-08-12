
const { empMenuItems } = require('../../config/menuCategories');
const Employee = require('../../model/Employee');
const EmployeeMenuAccess = require('../../model/EmployeeMenuAccess');

// Helper function to get all main category titles
const getMainCategories = () => {
  return empMenuItems.map(category => category.title);
};

exports.getProductCategory = async (req, res) => {
  try {
    const categories = empMenuItems.map(category => ({
      title: category.name,
    }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get employees for a specific category
// @route   GET /api/admin/menu-access/:category/employees
// @access  Private/Admin
exports.getEmployeesForCategory = async (req, res) => {
  try {
    const category = decodeURIComponent(req.query.category); // e.g., 'reports-&-analytics'

    // Step 1: Find access records with this category
    const accessRecords = await EmployeeMenuAccess.find({
      category: category
    });

    const empIds = accessRecords.map(record => record.empId);

    // Step 2: Find user details for employees with access
    const employees = await Employee.find({
      _id: { $in: empIds },
      userId : req.user._id 
    }).select('_id name email');

    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees for category:", err);
    res.status(500).json({ message: err.message });
  }
};


// @desc    Update access for a category
// @route   POST /api/admin/menu-access/:category/update-access
// @access  Private/Admin
exports.updateCategoryAccess = async (req, res) => {
  try {
    const { employeeIds } = req.body;
    const category = decodeURIComponent(req.body.category);

    // Get all employees who currently have this category
    const employeesWithCategory = await EmployeeMenuAccess.find({ category });

    const allEmpIdsWithCategory = employeesWithCategory.map(v => v.empId.toString());
    const selectedEmpIds = employeeIds || [];

    // Vendors to remove category from
    const empIdsToRemove = allEmpIdsWithCategory.filter(id => !selectedEmpIds.includes(id));

    // Remove category from unselected employees
    if (empIdsToRemove.length > 0) {
      await EmployeeMenuAccess.updateMany(
        { empId: { $in: empIdsToRemove } },
        { $pull: { category }, $set: { updatedAt: new Date() } }
      );
    }

    // Add category to selected employees
    for (const empId of selectedEmpIds) {
      await EmployeeMenuAccess.findOneAndUpdate(
        { empId },
        {
          $addToSet: { category },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating employee category access:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getEmployeeCategoryAccess = async (req, res) => {
  try {
    
    const data = await EmployeeMenuAccess.findOne({ empId :req.user._id});

    return res.json({ data });
  } catch (error) {
    console.error('Error checking employee access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getVendorsEmployee = async (req, res) => {
  try {
    const data = await Employee.find({ userId :req.user._id});

    return res.json({ data });
  } catch (error) {
    console.error('Error checking employee access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};