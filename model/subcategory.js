const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subcategorySchema = new Schema({
    title: { type: String, required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }]
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);
module.exports = Subcategory;
