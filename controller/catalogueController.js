const Catalogue = require('./../model/catalogue');  // Adjust the path as necessary
const Subcategory = require('./../model/subcategory');  // Adjust the path as necessary
const Item = require('./../model/item');  // Adjust the path as necessary

// Create a new catalogue
exports.createCatalogue = async (req, res) => {
    try {
        const newCatalogue = new Catalogue(req.body);
        const catalogue = await newCatalogue.save();
        res.status(201).json(catalogue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all catalogues
exports.getCatalogues = async (req, res) => {
    try {
        const catalogues = await Catalogue.find().populate({
            path: 'subcategories',
            populate: {
                path: 'items'
            }
        });
        res.json(catalogues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a catalogue
exports.updateCatalogue = async (req, res) => {
    try {
        const catalogue = await Catalogue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });
        res.json(catalogue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a catalogue
exports.deleteCatalogue = async (req, res) => {
    try {
        const catalogue = await Catalogue.findByIdAndDelete(req.params.id);
        if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });
        res.json({ message: 'Catalogue deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a subcategory to a catalogue
exports.addSubcategory = async (req, res) => {
    try {
        const catalogue = await Catalogue.findById(req.params.catalogueId);
        if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

        const subcategory = new Subcategory(req.body);
        await subcategory.save();

        catalogue.subcategories.push(subcategory._id);
        await catalogue.save();

        res.status(201).json(subcategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a subcategory
exports.updateSubcategory = async (req, res) => {
    try {
        const subcategory = await Subcategory.findByIdAndUpdate(req.params.subcategoryId, req.body, { new: true });
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

        res.json(subcategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a subcategory
exports.deleteSubcategory = async (req, res) => {
    try {
        const catalogue = await Catalogue.findById(req.params.catalogueId);
        if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

        const subcategory = await Subcategory.findByIdAndDelete(req.params.subcategoryId);
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

        catalogue.subcategories = catalogue.subcategories.filter(id => id.toString() !== req.params.subcategoryId);
        await catalogue.save();

        res.json({ message: 'Subcategory deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add an item to a subcategory
exports.addItem = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.subcategoryId);
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

        const item = new Item(req.body);
        await item.save();

        subcategory.items.push(item._id);
        await subcategory.save();

        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an item
exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.itemId, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an item
exports.deleteItem = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.subcategoryId);
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

        const item = await Item.findByIdAndDelete(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        subcategory.items = subcategory.items.filter(id => id.toString() !== req.params.itemId);
        await subcategory.save();

        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

