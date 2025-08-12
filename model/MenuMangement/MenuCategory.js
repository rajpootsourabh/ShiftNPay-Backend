const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  path: { type: String, required: true },
  icon: { type: String, required: true },
  component: { type: String, required: true },
  isOuter: { type: Boolean, default: true },
});

const menuCategorySchema = new mongoose.Schema({
  cat: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  icon: { type: String, required: true },
  status: { type: Boolean, default: true },

  pricePerMonth: { type: Number, required: true, default: 0 },

  stripeProductId: { type: String }, // Store Stripe product ID
  stripePriceId: { type: String },   // Store Stripe price ID
  stripeInterval: {
    type: String,
    enum: ["day", "week", "month", "year"],
    default: "month",
  },

  subscribers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      subscribedAt: { type: Date, default: Date.now },
    }
  ],

  routes: [routeSchema],
}, { timestamps: true });


module.exports = mongoose.model('MenuCategory', menuCategorySchema);
