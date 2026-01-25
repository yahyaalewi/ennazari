const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // e.g. "Terminale S1"
    },
    academicYear: {
        type: String,
        required: true, // e.g. "2023-2024"
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true,
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
