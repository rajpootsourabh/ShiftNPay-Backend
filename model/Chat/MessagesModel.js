const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const messagesModel = new Schema({
  sender: {
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    modelType: { 
      type: String, 
      enum: ['user', 'employee'], 
      required: true 
    }
  },
  conversationId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Conversation'
  },
  product: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Product',
    default: null,
    set: v => v === '' ? null : v
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['TEXT', 'OFFER'],
    default: 'TEXT'
  },
  file: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  isDeletedBy: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Users' }],
  isSeen: {
    type: Boolean,
    default: false
  },
  isOneTimeMessage: {
    type: String,
    enum: ['normal', 'oneTimeMessage'],
    default: 'normal'
  },
  offerSubtype: {
    type: String,
    default: ''
  },
  offerPeriod: {
    type: String,
    default: ''
  },
  offerQuantity: {
    type: Number,
    default: 0
  },
  offerAmount: {
    type: Number,
    default: 0
  },
  offerExpiryDate: {
    type: Date,
    default: Date.now
  },
  offerStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  added_to_cart: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Messages', messagesModel);