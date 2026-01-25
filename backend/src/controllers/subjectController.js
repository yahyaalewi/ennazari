const Subject = require('../models/Subject');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private (Manager)
const createSubject = async (req, res) => {
    try {
        const { name, code } = req.body;
        const subject = await Subject.create({ name, code });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({});
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createSubject, getSubjects };
