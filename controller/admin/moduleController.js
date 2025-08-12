const Module = require("../../model/Module");
const staticModules = require("../../config/menuCategories");
const VendorModuleTransaction = require("../../model/VendorModuleTransaction");
const VendorModuleAccess = require("../../model/MenuMangement/VendorMenuAccess");
const stripe = require("stripe")('sk_test_51HXRXfI1EP17yzxTOB0GaywXutqQtE0THPffJ9MaQpElKYtgf3G44WWCVHJVwW4kFhXRmkEiJnR3pFa2KWUxesM500umu1OFzI');
const MenuCategory = require('../../model/MenuMangement/MenuCategory');

exports.seedMenuCategories = async (req, res) => {
  try {
    const menuCategories = require('../../config/menuCategories');
    await MenuCategory.deleteMany({});
    const result = await MenuCategory.insertMany(menuCategories);
    return res.status(201).json({ message: 'Menu categories seeded successfully.', data: result });
  } catch (error) {
    console.error('Error seeding categories:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAllModules = async (req, res) => {
  try {
    
    const modules = await MenuCategory.find().lean();
    res.json(modules);
  } catch (error) {
    console.error("Error loading modules:", error);
    res.status(500).json({ message: "Error loading modules", error });
  }
}

exports.getVendorAccess = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const access = await VendorModuleAccess.findOne({ vendorId });

    if (!access) {
      return res.json({
        isTrial: false,
        trialEndDate: null,
        activeModules: []
      });
    }

    const menuCategories = await MenuCategory.find({
      cat: { $in: access.activeModules.map(m => m.cat) }
    });

    const enrichedAccess = access.activeModules.map(module => {
      const category = menuCategories.find(m => m.cat === module.cat);
      return {
        cat: module.cat,
        title: category?.title || "",
        icon: category?.icon || "",
        routes: category?.routes.filter(r => module.routes.includes(r.path)) || []
      };
    });

    res.json({
      isTrial: access.isTrial || false,
      trialEndDate: access.trialEndDate || null,
      activeModules: enrichedAccess
    });
  } catch (err) {
    console.error("Fetch Vendor Access Error:", err.message);
    res.status(500).json({ message: "Failed to fetch vendor access" });
  }
};


// PUT: Update vendor route-level access
exports.updateVendorAccess = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { permissions } = req.body;

    // Convert from title -> [routeTitle] to cat & [route paths]
    const categories = await MenuCategory.find({ title: { $in: Object.keys(permissions) } });

    const activeModules = categories.map(cat => {
      const allowedTitles = permissions[cat.title] || [];
      const allowedPaths = cat.routes
        .filter(r => allowedTitles.includes(r.title))
        .map(r => r.path);

      return {
        cat: cat.cat,
        routes: allowedPaths,
      };
    });

    await VendorModuleAccess.findOneAndUpdate(
      { vendorId },
      { vendorId, activeModules },
      { upsert: true, new: true }
    );

    res.json({ message: "Access updated successfully." });
  } catch (err) {
    console.error("Update Vendor Access Error:", err.message);
    res.status(500).json({ message: "Failed to update access" });
  }
};

exports.setModulePrice = async (req, res) => {
  try {
    const { cat, pricePerMonth, interval = "month" } = req.body;

    if (!cat || !pricePerMonth) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find module from DB
    let module = await MenuCategory.findOne({ cat });
    if (!module) {
      return res.status(404).json({ message: "Module not found with cat: " + cat });
    }

    // Create Stripe product if not already created
    let stripeProductId = module.stripeProductId;
    if (!stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name: module.title,
        metadata: { cat: cat.toString() },
      });
      stripeProductId = stripeProduct.id;
    }

    // Always create a new price in Stripe
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(pricePerMonth * 100),
      currency: "usd",
      recurring: { interval }, // 'month' or 'year'
      product: stripeProductId,
    });

    // Update DB with Stripe info and price
    module.pricePerMonth = pricePerMonth;
    module.stripeInterval = interval;
    module.stripePriceId = stripePrice.id;
    module.stripeProductId = stripeProductId;

    await module.save();

    res.json({
      message: "Stripe module pricing updated",
      module,
    });
  } catch (error) {
    console.error("Error setting Stripe price:", error);
    res.status(500).json({ message: "Error saving module price", error });
  }
};


exports.setStatus = async (req, res) => {
  try {
    const { cat, status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: "Invalid status value. Must be true or false." });
    }

    const module = await MenuCategory.findOne({ cat });
    if (!module) {
      return res.status(404).json({ message: "Module not found with cat: " + cat });
    }

    module.status = status;
    await module.save();

    res.json({
      message: "Module status updated successfully.",
      module,
    });
  } catch (error) {
    console.error("Error setting status:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.getSubscriptionModules = async (req, res) => {
  try {
    const modules = await MenuCategory.find({ stripeProductId: { $exists: true, $ne: null } }).lean();

    const enriched = modules.map((mod) => ({
      cat: mod.cat,
      pricePerMonth: mod.pricePerMonth,
      title: mod.title,
      description: `Access to ${mod.title}`,
      icon: mod.icon || "MdCategory",
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Error loading subscription modules:", err);
    res.status(500).json({ message: "Failed to load subscription modules." });
  }
};

exports.createStripeCheckout = async (req, res) => {
  const { moduleCats } = req.body;

  if (!Array.isArray(moduleCats) || !moduleCats.length) {
    return res.status(400).json({ message: "No modules selected." });
  }

  try {
    const selectedModules = await Module.find({ cat: { $in: moduleCats } });

    if (!selectedModules.length) {
      return res.status(404).json({ message: "No valid modules found." });
    }

    const line_items = selectedModules.map((mod) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Module #${mod.cat}`,
        },
        unit_amount: mod.pricePerMonth * 100,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: req.user.email || 'test@gmail.com',
      billing_address_collection: "required",
      line_items,
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/modules`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        moduleCats: moduleCats.join(","),
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ message: "Failed to create Stripe checkout session." });
  }
};

exports.createTrialCheckout = async (req, res) => {
  const { moduleCats, userId } = req.body;

  try {
    if (!moduleCats?.length) {
      return res.status(400).json({ message: "No modules selected." });
    }

    const modules = await MenuCategory.find({
      cat: { $in: moduleCats },
      stripePriceId: { $ne: null },
    });

    const line_items = modules.map((mod) => ({
      price: mod.stripePriceId,
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: req.user.email, // or lookup customer ID
      line_items,
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          userId,
         type: "trial",
        },
      },
       success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/modules`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        moduleCats: moduleCats.join(","),
         type: "trial",
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Error creating trial session:", err);
    res.status(500).json({ message: "Failed to create trial session" });
  }
};


exports.getSessionData = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'line_items.data.price.product', 'subscription'],
    });
    res.json(session);
  } catch (err) {
    console.error("Fetch session error:", err);
    res.status(500).json({ message: "Failed to fetch session details." });
  }
};

exports.saveTransaction = async (req, res) => {
  try {
    const { session } = req.body;
    const vendorId = req.user?._id;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID missing in request." });
    }

    const moduleCats = session.metadata.moduleCats.split(',').map(Number);
    const isTrial = session.metadata?.type === "trial";
    const trialEndDate = isTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const accessData = staticModules
      .filter(m => moduleCats.includes(m.cat))
      .map(m => ({
        cat: m.cat,
        routes: m.routes.map(r => r.path),
      }));

    if (!accessData.length) {
      return res.status(400).json({ message: "No valid modules found for access." });
    }

    const updatedAccess = await VendorModuleAccess.findOneAndUpdate(
      { vendorId },
      {
        vendorId,
        isTrial,
        hasUsedTrial: isTrial ? true : false,
        trialEndDate,
        activeModules: accessData,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripeSubscriptionId: session.subscription?.id || null,
      },
      { upsert: true, new: true }
    );

    console.log("VendorModuleAccess saved:", updatedAccess);

    res.status(200).json({ message: "Transaction saved successfully." });
  } catch (err) {
    console.error("Save Transaction Error:", err.message);
    res.status(500).json({ message: "Failed to save transaction." });
  }
};


exports.getVendorModules = async (req, res) => {
  try {
    const vendorAccess = await VendorModuleAccess.findOne({ vendorId: req.user._id });

    if (!vendorAccess || !vendorAccess.activeModules.length) {
      return res.json({ modules: [], isTrial: false });
    }

    // Create a map of enabled routes for each category
    const enabledRoutesMap = {};
    vendorAccess.activeModules.forEach(mod => {
      enabledRoutesMap[mod.cat] = new Set(mod.routes || []);
    });

    const moduleCats = vendorAccess.activeModules.map(mod => mod.cat);

    // Fetch full module info from MenuCategory
    const categories = await MenuCategory.find({ cat: { $in: moduleCats } });

    const enrichedModules = categories.map(cat => {
      // Filter routes to only include enabled ones
      const enabledRoutes = cat.routes.filter(route => 
        enabledRoutesMap[cat.cat].has(route.path) // Check if path is in the enabled set
      );

      return {
        cat: cat.cat,
        title: cat.title,
        icon: cat.icon,
        pricePerMonth: cat.pricePerMonth,
        routes: enabledRoutes.map(route => ({
          title: route.title,
          path: route.path,
          icon: route.icon,
          component: route.component,
          isOuter: route.isOuter,
        })),
      };
    });

    res.json({
      modules: enrichedModules,
      isTrial: vendorAccess.isTrial,
      trialEndDate: vendorAccess.trialEndDate,
      hasUsedTrial: vendorAccess.hasUsedTrial,
    });
  } catch (err) {
    console.error("Fetch Vendor Modules Error:", err.message);
    res.status(500).json({ message: "Failed to fetch vendor modules." });
  }
};
