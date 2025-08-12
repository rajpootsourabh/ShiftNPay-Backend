const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 111000 }
});

const Sequence = mongoose.model('Sequence', SequenceSchema);

exports.getNextSequenceValue = async (sequenceName) => {
    const sequence = await Sequence.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1231 } },
        { new: true, upsert: true }
    );
    return sequence.sequence_value;
};