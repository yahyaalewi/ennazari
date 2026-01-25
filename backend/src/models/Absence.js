const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: { // Optional, absence might be general (per day) or per subject. Requirement says "Absences", usually per subject/hour.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    date: {
        type: Date,
        required: true,
    },
    durationHours: {
        type: Number,
        default: 1,
    },
    justified: {
        type: Boolean,
        default: false,
    },
    justificationReason: {
        type: String,
    },
    justificationDocument: {
        type: String, // Path to uploaded document (PDF, image, etc.)
    },
    justificationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
    },
    justificationSubmittedAt: {
        type: Date,
    },
    justificationReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Manager who reviewed
    },
    justificationReviewedAt: {
        type: Date,
    },
    justificationReviewComment: {
        type: String, // Manager's comment on approval/rejection
    },
}, {
    timestamps: true,
});

const Absence = mongoose.model('Absence', absenceSchema);
module.exports = Absence;
