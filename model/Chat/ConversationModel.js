const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const conversationModel = new Schema({
  members: [{
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    modelType: { 
      type: String, 
     enum: ['user', 'employee'], 
      required: true 
    }
  }],
  isGroup: {
    type: String,
    default: "yes",
    enum: ["no", "yes"]
  },
  groupAdmin: [{
    id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    modelType: { 
      type: String, 
      enum: ['user', 'employee'], 
      required: true 
    }
  }],
  latestMessage: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Messages'
  },
  name: {
    type: String,
    default: ''
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  is_archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Conversation', conversationModel);