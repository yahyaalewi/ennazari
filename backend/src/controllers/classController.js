const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Manager)
const createClass = async (req, res) => {
    try {
        const { name, academicYear } = req.body;
        const newClass = await Class.create({ name, academicYear });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({});
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students in a class
// @route   GET /api/classes/:id/students
// @access  Private (Manager, Professor)
const getClassStudents = async (req, res) => {
    try {
        // Assuming User model has classId
        const students = await User.find({ classId: req.params.id, role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createClass, getClasses, getClassStudents };
