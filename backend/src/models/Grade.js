const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        max: 20, // French system
    },
    coefficient: {
        type: Number,
        default: 1,
    },
    evaluationType: {
        type: String,
        default: 'Exam', // Exam, Quiz, Homework
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade;
