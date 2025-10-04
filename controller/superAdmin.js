const Admin = require("../model/Admin");
const User = require("../model/User");
const Profile = require("../model/Profile");
const { createToken } = require("../util/createToken");
const bcrypt = require('bcrypt');
const Employee = require("../model/Employee");
const Job = require("../model/Job");
const Plan = require("../model/Plan");
const Credential = require("../model/Credential");
const LoginLog = require("../model/loginLog");
require('dotenv').config()
const { sendMail, sendMailAddedToVender, sendMailOnceNewVendorRequestRecieved, sendMailOnceVendorAccountDeleted } = require("../util/mailService");
const Membership = require("../model/membership");
const Category = require("../model/Category");
const Subscription = require("../model/Subscription");
const path = require('path');
const fs = require('fs')
const Services = require('./../services');
const Tracking = require("../model/Tracking");
const { calculateEarnings } = require("../util/utills");
const mongoose = require('mongoose');
const Document = require("../model/document");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const salt = process.env.SALT

exports.register = async (req, res) => {

    const email = req.body.email
    const password = req.body.password

    try {
        const hassPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await Admin.create({ email: email, password: hassPass })
        if (!result) {
            return res.status(400).json({ msg: 'Faild to register super admin!', success: false })
        }
        /* const token = createToken({ _id: result._id, email: result.email })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        } */
        return res.status(200).json({ msg: 'Ok', success: true, result })

    } catch (error) {
        //console.log("error on register: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.loginSuperAdmin = async (req, res) => {
    //console.log('helllo')
    //console.log("req.body: ", req.body);
    const email = req.body.email
    const password = req.body.password

    try {
        const checkSuperAdmin = await Admin.findOne({ email: email })
        if (!checkSuperAdmin) {
            return res.status(404).json({ msg: 'Admin not found!', success: false })
        }

        const matchPass = await bcrypt.compare(password, checkSuperAdmin.password)
        if (!matchPass) {
            return res.status(400).json({ msg: 'Email or Password are incorrect!', success: false })
        }
        const token = createToken({ _id: checkSuperAdmin._id, email: checkSuperAdmin.email })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result: checkSuperAdmin, token })
    } catch (error) {
        //console.log("error on loginSuperAdmin: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.getAllVendor = async (req, res) => {
    try {
        // Fetch users with role 'vender'
        const users = await User.find({ role: 'vender' })
            .select("-password")
            .sort({ createdAt: -1 });

        if (!users.length) {
            return res.status(404).json({ msg: 'No vendor found!', success: false });
        }

        // Fetch corresponding profiles
        const userIds = users.map(user => user._id);
        const profiles = await Profile.find({ userId: { $in: userIds } });

        // Fetch categories
        const profilesWithCategoryIds = profiles.map(profile => profile.categoryId);
        const categories = await Category.find({ _id: { $in: profilesWithCategoryIds } });

        // Fetch subscriptions and populate membership details
        const subscriptions = await Subscription.find({ userId: { $in: userIds } })
            .populate('membershipId'); // Populate the membership details

        // Convert subscriptions array to a map for quick lookup
        const subscriptionsMap = subscriptions.reduce((acc, subscription) => {
            acc[subscription.userId.toString()] = subscription;
            return acc;
        }, {});

        // Combine users, profiles, and subscriptions
        const result = users.map(user => {
            const profile = profiles.find(p => p.userId.toString() === user._id.toString());
            const subscription = subscriptionsMap[user._id.toString()];

            // Get profile and category data
            const category = profile ? categories.find(c => c._id.toString() === profile.categoryId.toString()) : null;

            return {
                ...user.toObject(),
                profile: {
                    ...profile?.toObject(),
                    category: category?.name || null, // Include category data or null if not found
                },
                subscription: subscription ? {
                    ...subscription.toObject(),
                    membership: subscription.membershipId // Add membership details
                } : null, // No subscription data
            };
        });

        if (!result) {
            return res.status(404).json({ msg: 'No vendor found!', success: false });
        }

        return res.status(200).json({ msg: 'ok', success: true, result });
    } catch (error) {
        //console.log("error on getAllVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};


exports.approveVendor = async (req, res) => {
    const id = req.params.id
    const status = req.body.status

    try {
        const checkVendor = await User.findById(id)
        if (!checkVendor) {
            return res.status(404).json({ msg: 'No vendor data found!', success: false })
        }
        const result = await User.findOneAndUpdate({ _id: id }, { status: status })
        if (result) {
            sendMailAddedToVender(checkVendor.email, checkVendor.name, `Your account has been approved in shiftnpay.com`)
            return res.status(200).json({ msg: `Vendor ${checkVendor.name} approved successfully.`, success: true })
        }
        return res.status(400).json({ msg: `Failed to approve ${checkVendor.name}`, success: false })
    } catch (error) {
        //console.log("error on approveVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getEmployeesByVendor = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const employees = await Employee.find(
            { userId: vendorId },
            {
                _id: 1, // include other fields if necessary
                newWayName: { $concat: ["$firstName", " ", "$lastName"] },
                name:1,
                empId: 1, 
                ssnNo: 1,
                // Add other fields as needed
            }
        ); // Find employees by vendorId
        if (employees.length > 0) {
            return res.status(200).json({ success: true, employees });
        } else {
            return res.status(404).json({ success: false, msg: 'No employees found for this vendor' });
        }
    } catch (error) {
        console.error("Error fetching employees: ", error);
        return res.status(500).json({ success: false, msg: 'Server Error', error });
    }
};

exports.getEmployeeJobsByVendor = async (req, res) => {
    const { employeeId, vendorId } = req.params;

    try {

        const employee = await Employee.findOne({ _id: employeeId, userId: vendorId });

        if (!employee) {
            return res.status(404).json({ success: false, msg: 'Employee not found' });
        }


        const jobIds = employee.jobId;

        if (!jobIds || jobIds.length === 0) {
            return res.status(200).json({ success: true, result: [], msg: 'No jobs found for this employee' });
        }


        const jobs = await Job.find({ 
            _id: { $in: jobIds }, 
            status: { $ne: "closed" } 
          });
          

        res.status(200).json({ success: true, result: jobs });
    } catch (error) {
        console.error('Error fetching jobs for employee: ', error);
        res.status(500).json({ success: false, msg: 'Server error', error });
    }
};

exports.getEmployeesJobsTracking = async (req, res) => {
    const { employee, employeeJob, startDate, endDate } = req.body;

    try {
        // Find the employee by _id
        const user = await Employee.findOne({ _id: employee });

        // Handle the case where the startDate and endDate are provided
        let startOfRange;
        let endOfRange;

        if (startDate && endDate) {
            // If both startDate and endDate are provided, convert them to Date objects
            startOfRange = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            endOfRange = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        } else {
            // If no dates are provided, default to the current day
            startOfRange = new Date().setHours(0, 0, 0, 0);
            endOfRange = new Date().setHours(23, 59, 59, 999);
        }

        // Aggregation pipeline for time tracking with date filtering and job lookup
        const result = await Tracking.aggregate([
            {
                $match: {
                    userId: user._id,
                    startTime: {
                        $gte: new Date(startOfRange),
                        $lt: new Date(endOfRange)
                    },
                    jobId: new mongoose.Types.ObjectId(employeeJob)
                }
            },
            {
                $lookup: {
                    from: "jobs", // Assuming the jobs collection is named "jobs"
                    localField: "jobId",
                    foreignField: "_id",
                    as: "jobDetails"
                }
            },
            {
                $unwind: "$jobDetails"
            },
            {
                $project: {
                    _id: 0, // Exclude default _id field if not needed
                    jobId: "$jobId",
                    userId: "$userId",
                    startTime: "$startTime",
                    endTime: "$endTime",
                    lastStartTime: "$lastStartTime",
                    isTimerRunning: "$isTimerRunning",
                    elapsedTime: "$elapsedTime",
                    totalBreakTime: "$totalBreakTime",
                    stoppedTime: "$stoppedTime",
                    count: "$count",
                    amount: "$amount",
                    overAmount: "$overAmount",
                    sessionDate: "$sessionDate",
                    createdAt: "$createdAt",
                    jobDetails: {
                        _id: "$jobDetails._id",
                        name: "$jobDetails.name",
                        userId: "$jobDetails.userId",
                        status: "$jobDetails.status",
                        statusByEmployee: "$jobDetails.statusByEmployee",
                        subJob: "$jobDetails.subJob"
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({ msg: "No time tracking found!", success: false });
        }

        return res.status(200).json({ msg: "Ok", success: true, result });
    } catch (error) {
        //console.log("Error fetching employee job tracking: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};



exports.getCount = async (req, res) => {
    try {
        const vendorCount = await User.countDocuments({ role: 'vender' })
        const vendorActiveCount = await User.countDocuments({ role: 'vender', status: true })
        const vendorInActiveCount = await User.countDocuments({ role: 'vender', status: false })
        const empCount = await Employee.countDocuments()
        const jobCount = await Job.countDocuments()
        const planCount = await Plan.countDocuments()
        const apiCount = await Credential.countDocuments()
        const loginLogs = await LoginLog.find({ userId: { $ne: null }, employeeId: null })
        .populate('userId')
        .sort({ loginTime: -1 })
        .limit(10);
      

        return res.status(200).json({ msg: 'Ok', success: true, result: { vendorCount, empCount, jobCount, planCount, apiCount, vendorActiveCount, vendorInActiveCount, loginLogs } })
        // return res.status(200).json({ msg: 'ok', success: true })
    } catch (error) {
        //console.log("error on getCount: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updatePassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found!', success: false });
        }

        // Assuming you have a method to hash passwords before saving
        const hasPass = bcrypt.hashSync(password, parseInt(salt))

        user.password = hasPass;
        await user.save();

        // Use sendMailAddedToVendor to notify the user
        sendMailAddedToVender(
            user.email,
            null,
            `Your password has been updated on shiftnpay.com`,
            user.name,
            user.email
        );

        return res.status(200).json({ msg: 'Password updated successfully.', success: true });
    } catch (error) {
        //console.log("error on updatePassword: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};

exports.deleteAccount = async (req, res) => {
    const { id } = req.params;
    const { emailContent } = req.body; // Get the custom email content from the request body

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found!', success: false });
        }

        await User.findByIdAndDelete(id);


        sendMailOnceVendorAccountDeleted(user, emailContent, "Your account has been deleted from shiftnpay.com");

        return res.status(200).json({ msg: 'Account deleted successfully.', success: true });
    } catch (error) {
        //console.log("error on deleteAccount: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};

exports.createMembershipPlan = async (req, res) => {
    try {
        const { title, price, type, paymentTerm, planDate, description, trialPeriodDays } = req.body;

        // Map paymentTerm to Stripe's expected values
        let interval;
        switch (paymentTerm) {
            case 'Monthly':
                interval = 'month';
                amount = price; // Assuming the price is per month
                break;
            case 'Quarterly':
                interval = 'month';
                amount = price / 3; // Price is for the quarter, so divide by 3 to get monthly rate
                break;
            case 'Annually':
                interval = 'year';
                amount = price; // Price is for the year
                break;
            default:
                return res.status(400).json({ message: 'Invalid payment term.' });
        }

        // Create a Product in Stripe
        const product = await stripe.products.create({
            name: title,
            description,
        });

        // Create a Pricing Plan in Stripe
        const priceData = await stripe.prices.create({
            unit_amount: price * 100, // amount in cents
            currency: 'usd',
            recurring: {
                interval,
                trial_period_days: trialPeriodDays,
                interval_count: paymentTerm === 'Quarterly' ? 3 : 1
                // For Quarterly, you'll need to handle this differently, e.g., create 3 monthly prices
            },
            product: product.id,
        });

        // Create a new membership
        const membership = new Membership({
            title,
            price,
            type,
            paymentTerm,
            planDate,
            description,
            stripePlanId: priceData.id, // Save the Stripe Plan ID
            stripeProductId: product.id, // Save the Stripe Plan ID
            trialPeriodDays,
        });

        await membership.save();
        res.status(201).json({ message: 'Membership created successfully!', membership });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create membership.', error: error.message });
    }
};

exports.getMembershipPlans = async (req, res) => {
    try {
        const memberships = await Membership.aggregate([
            {
                $lookup: {
                    from: 'subscriptions', // Name of the Subscription collection
                    localField: '_id', // Field in the Membership collection
                    foreignField: 'membershipId', // Updated to match the 'membershipId' in the Subscription schema
                    as: 'subscriptions' // Resulting array of matching subscriptions
                }
            },
            {
                $addFields: {
                    activeSubscriberCount: {
                        $size: {
                            $filter: {
                                input: '$subscriptions', // Array of subscriptions from the $lookup
                                as: 'subscription', // Alias for each subscription
                                cond: { $eq: ['$$subscription.status', 'Active'] } // Updated to check the 'status' field for active subscriptions
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    price: 1,
                    type: 1,
                    paymentTerm: 1,
                    planDate: 1,
                    description: 1,
                    activeSubscriberCount: 1,
                    // Calculate monthly and yearly prices based on paymentTerm
                    monthlyPrice: {
                        $cond: {
                            if: { $eq: ['$paymentTerm', 'Monthly'] },
                            then: '$price',
                            else: {
                                $cond: {
                                    if: { $eq: ['$paymentTerm', 'Quarterly'] },
                                    then: { $divide: ['$price', 3] },
                                    else: { $divide: ['$price', 12] } // For Annually
                                }
                            }
                        }
                    },
                    yearlyPrice: {
                        $cond: {
                            if: { $eq: ['$paymentTerm', 'Monthly'] },
                            then: { $multiply: ['$price', 12] },
                            else: {
                                $cond: {
                                    if: { $eq: ['$paymentTerm', 'Quarterly'] },
                                    then: { $multiply: ['$price', 4] },
                                    else: '$price' // For Annually
                                }
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch memberships.', error: error.message });
    }
};


exports.getMembershipPlanById = async (req, res) => {
    try {
        const membership = await Membership.findById(req.params.id);
        if (!membership) {
            return res.status(404).json({ message: 'Membership not found.' });
        }
        res.status(200).json(membership);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch membership.', error: error.message });
    }
};

exports.updateMembershipPlan = async (req, res) => {
    try {
        const { title, price, type, paymentTerm, planDate, description } = req.body;

        // Find the existing membership
        const membership = await Membership.findById(req.params.id);
        if (!membership) {
            return res.status(404).json({ message: 'Membership not found.' });
        }

        // Update the membership details in MongoDB
        const updatedMembership = await Membership.findByIdAndUpdate(
            req.params.id,
            { title, price, type, paymentTerm, planDate, description },
            { new: true, runValidators: true }
        );

        // Update the product in Stripe
        await stripe.products.update(membership.stripeProductId, {
            name: title,
            description,
        });

        // Create a new price in Stripe
        const newPrice = await stripe.prices.create({
            unit_amount: price * 100, // amount in cents
            currency: 'usd',
            recurring: {
                interval: mapPaymentTermToStripeInterval(paymentTerm),
                interval_count: paymentTerm === 'Quarterly' ? 3 : 1 // Adjust interval count for quarterly
            },
            product: membership.stripeProductId,
        });

        // Optionally, you might want to delete the old price if no longer needed
        if (membership.stripePlanId) {
            await stripe.prices.update(membership.stripePlanId, { active: false });
        }

        // Update membership with the new price ID
        await Membership.findByIdAndUpdate(req.params.id, { stripePlanId: newPrice.id });

        res.status(200).json({ message: 'Membership updated successfully!', membership: updatedMembership });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update membership.', error: error.message });
    }
};

// Helper function to map paymentTerm to Stripe's interval
const mapPaymentTermToStripeInterval = (paymentTerm) => {
    switch (paymentTerm) {
        case 'Monthly':
            return 'month';
        case 'Quarterly':
            return 'month'; // Handle quarterly separately if needed
        case 'Annually':
            return 'year';
        default:
            throw new Error('Invalid payment term.');
    }
};

exports.deleteMembershipPlan = async (req, res) => {
    try {
        const membership = await Membership.findByIdAndDelete(req.params.id);

        if (!membership) {
            return res.status(404).json({ message: 'Membership not found.' });
        }

        res.status(200).json({ message: 'Membership deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete membership.', error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, status } = req.body;

        // Validate status value
        const validStatuses = ['Active', 'Inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status value: ${status}` });
        }

        const newCategory = new Category({ name, status });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Read all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Read a single category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a category by ID
exports.updateCategoryById = async (req, res) => {
    try {
        const { name, status } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, status },
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a category by ID
exports.deleteCategoryById = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find()
            .populate('userId', 'name email image') // Populate the user data (without profile)
            .populate('membershipId'); // Populate membership plan data if needed

        // Step 2: Manually fetch profiles based on the userId
        const subscriptionsWithProfile = await Promise.all(
            subscriptions.map(async (subscription) => {
                const profile = await Profile.findOne({ userId: subscription.userId._id }); // Select specific fields from Profile

                return {
                    ...subscription.toObject(),
                    userId: {
                        ...subscription.userId.toObject(),
                        profile, // Attach the profile data to the userId
                    },
                };
            })
        );

        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error.message);
        res.status(500).json({ message: 'Failed to fetch subscriptions.', error: error.message });
    }
};


exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email, mobile, address, pinCode, restaurantsName, description,
            contact, industry, webUrl, empNumber, location, year
        } = req.body.profile;

        // Update user details
        const user = await User.findByIdAndUpdate(id, {
            email,
            address
        }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile details
        const profile = await Profile.findOneAndUpdate({ userId: id }, {
            mobile,
            address,
            pinCode,
            restaurantsName,
            description,
            contact,
            industry,
            webUrl,
            empNumber,
            location,
        }, { new: true });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.status(200).json({ user, profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateAdminProfile = async (req, res) => {
    const { email, firstName, middleName, lastName, password } = req.body;
    const { reqUserId } = req.payload;

    try {
        const admin = await Admin.findOne({ _id: reqUserId });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Update fields if provided
        admin.firstName = firstName || admin.firstName;
        admin.middleName = middleName || admin.middleName;
        admin.lastName = lastName || admin.lastName;
        if (password) {
            const hassPass = bcrypt.hashSync(password, parseInt(salt))
            admin.password = hassPass;
        }

        // Function to save the admin and send the response
        const saveAndRespond = async () => {
            const updatedAdmin = await admin.save();
            const adminObject = updatedAdmin.toObject();
            delete adminObject.password; // Ensure password is not included

            res.json(adminObject);
        };

        // Handle image upload
        if (req.files && req.files.profilePic) {
            const image = req.files.profilePic;
            const date = new Date()

            const fileName = "userProfile_" + date.getTime() + image.name.replace(/\s+/g, '')
            const profileFilePath = path.join(__dirname, "..", "assets", "profile", fileName)
            image.mv(profileFilePath, (err) => {
                if (err) {
                    return res.status(400).json({ success: false, msg: 'Failed to upload user profile image?' })
                }
            })
            if (admin?.image) {
                const removeprofileFilePath = path.join(__dirname, "..", "assets", "profile", admin.image)
                fs.unlink(removeprofileFilePath, (err) => {
                    // if (err) {
                    //     return res.status(400).json({ msg: 'Failed to delete profile image?', success: false })
                    // }
                })
            }
            admin.image = fileName
            saveAndRespond();
        } else {
            saveAndRespond(); // Call the function if no file is uploaded
        }
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    const { reqUserId } = req.payload;
    try {
        const admin = await Admin.findOne({ _id: reqUserId });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Create a copy of the admin object without the password field
        const { password, ...user } = admin.toObject();

        res.json(user);
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.notificationsList = async (req, res) => {
    try {
        const { reqUserId } = req.payload;
        const admin = await Admin.findById(reqUserId);
        if (!admin) {
            return res.status(404).json({ msg: 'No Admin found!', success: false })
        }

        const result = await Services.NotificationService.getNotificationsByUser(admin._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.notificationsUnreadCount = async (req, res) => {
    try {
        const { reqUserId } = req.payload;
        const admin = await Admin.findById(reqUserId);
        if (!admin) {
            return res.status(404).json({ msg: 'No Admin found!', success: false })
        }

        let unReadNotifications = await Services.NotificationService.getUnreadNotificationCount(admin._id);
        return res.status(200).json({ msg: `Success`, success: true, unReadNotifications })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.notificationsMarkAllAsRead = async (req, res) => {
    try {
        const { reqUserId } = req.payload;
        const admin = await Admin.findById(reqUserId);
        if (!admin) {
            return res.status(404).json({ msg: 'No Admin found!', success: false })
        }

        const result = await Services.NotificationService.markAllAsRead(admin._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.notificationsMarkAllAsRead = async (req, res) => {
    try {
        const { reqUserId } = req.payload;
        const admin = await Admin.findById(reqUserId);
        if (!admin) {
            return res.status(404).json({ msg: 'No Admin found!', success: false })
        }

        const result = await Services.NotificationService.markAllAsRead(admin._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.updateTrackingTimeByAdmin = async (req, res) => {
    const { jobId, startTime, endTime, date } = req.body;
    try {
        const SECONDS_IN_AN_HOUR = 3600;
        const MAX_REGULAR_HOURS_IN_SECONDS = 40 * SECONDS_IN_AN_HOUR; // 40 hours in seconds
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        let tracking = await Tracking.findOne({
            jobId,
            sessionDate: { $gte: startOfDay, $lte: endOfDay }
        });

        
        // Calculate elapsed time in seconds between updated startTime and stoppedTime
        const timeElapsedInSeconds = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;

        tracking.elapsedTime = timeElapsedInSeconds;


        const checkEmp = await Employee.findOne({ _id: tracking.userId });
        if (!checkEmp) {
            return res.status(404).json({ msg: "Employee data not found!", success: false });
        }


        // Calculate total worked time for the week
        const totalWorkedSeconds = Math.floor(tracking.elapsedTime);

        let amount = 0;
        if (totalWorkedSeconds <= MAX_REGULAR_HOURS_IN_SECONDS) {
            amount = calculateEarnings(checkEmp.rate, totalWorkedSeconds);
        } else {
            const extraTimeWorked = totalWorkedSeconds - MAX_REGULAR_HOURS_IN_SECONDS;
            const Overtimepayment = calculateEarnings(checkEmp.overTimeRate, extraTimeWorked);
            amount = Number(amount) + Number(Overtimepayment);
        }

        tracking.startTime = startTime;
        tracking.stoppedTime = endTime;
        tracking.amount = amount;
        await tracking.save();

        return res.status(200).json({
            msg: "Tracking time updated successfully",
            success: true,
            tracking
        });
    } catch (error) {
        console.error('Error updating tracking time:', error);
        return res.status(500).json({ error: 'Server error occurred while updating tracking.' });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const { search = '', date = '' } = req.query;
        let query = {};
        if (search) query.fileName = new RegExp(search, 'i');
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1); // Set endDate to the next day

            query.date = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const documents = await Document.find(query);
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
};

// Upload document
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, msg: 'No file uploaded' });
        }

        const uploadedDoc = req.files.file;

        //   // Ensure the file is present
        //   if (!uploadedDoc || uploadedDoc.mimetype !== 'application/pdf') { // Example: Check for PDF files
        //     return res.status(400).json({ success: false, msg: 'Invalid file type' });
        //   }

        const newDate = new Date();
        const fileName = `doc_${newDate.getTime()}_${uploadedDoc.name.replace(/\s+/g, '')}`;
        const documentPath = path.join(__dirname, '..', 'assets', 'documents', fileName);

        // Move file to the desired path
        uploadedDoc.mv(documentPath, async (err) => {
            if (err) {
                return res.status(500).json({ success: false, msg: 'Failed to move file', error: err });
            }

            // Extract file details
            const fileSize = uploadedDoc.size;
            const fileUrl = `documents/${fileName}`;
            const date = newDate;

            // Create a new document entry
            const newDocument = new Document({
                fileName,
                fileSize,
                date,
                fileUrl
            });

            await newDocument.save();

            // Send response
            res.status(201).json({ success: true, document: newDocument });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading document', error });
    }
};

// Delete document
exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await Document.findByIdAndDelete(id);
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error });
    }
};

