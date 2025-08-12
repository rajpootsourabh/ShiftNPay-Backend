const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const catalogueSchema = new Schema({
    title: { type: String, required: true },
    subcategories: [{ type: Schema.Types.ObjectId, ref: 'Subcategory' }]
});


const Catalogue = mongoose.model('Catalogue', catalogueSchema);
module.exports = Catalogue;