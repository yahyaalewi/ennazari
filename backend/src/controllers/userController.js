const User = require('../models/User');
const Course = require('../models/Course'); // Not needed here but keeping pattern
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Images
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename(req, file, cb) {
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype.toLowerCase());

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only (jpg, jpeg, png, webp)!'));
    }
};

const uploadProfile = multer({
    storage,
    fileFilter: function (req, file, cb) {
        // Ensure directory exists
        const dir = 'uploads/profiles/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        checkFileType(file, cb);
    },
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Manager)
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};

        const users = await User.find(query)
            .select('-password')
            .populate('classId', 'name')
            .populate('subjects', 'name');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a user (Student or Professor)
// @route   POST /api/users
// @access  Private (Manager)
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, classId, subjects } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Password hashing handled in Model pre-save
        const user = await User.create({
            firstName,
            lastName,
            email,
            password, // Plain text here, model hashes it
            role,
            classId: role === 'student' ? classId : undefined,
            subjects: role === 'professor' ? subjects : undefined,
        });

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Manager)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                user.password = req.body.password; // Model will hash this if modified
            }
            if (user.role === 'student') {
                user.classId = req.body.classId;
            } else if (user.role === 'professor') {
                user.subjects = req.body.subjects;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                email: updatedUser.email,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Manager)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            // Use deleteOne() instead of remove() in newer Mongoose versions
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update profile picture
// @route   PATCH /api/users/profile-picture
// @access  Private
const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = `/${req.file.path.replace(/\\/g, '/')}`;
        await user.save();

        res.json({
            _id: user._id,
            profilePicture: user.profilePicture
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('classId', 'name')
            .populate('subjects', 'name');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const unlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isLocked = false;
            user.failedLoginAttempts = 0;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                isLocked: updatedUser.isLocked,
                message: 'Compte débloqué avec succès'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    updateProfilePicture,
    uploadProfile,
    getProfile,
    unlockUser
};
