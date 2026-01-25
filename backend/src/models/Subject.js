const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: true,
        unique: true, // e.g. "MATH101"
    },
    // Optionally link professors here, or in User model. Doing both can be useful but requires sync.
    // For now, let's keep it simple.
}, {
    timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
