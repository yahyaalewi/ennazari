const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })
            .populate('classId', 'name')
            .populate('subjects', 'name');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if locked
        if (user.isLocked) {
            return res.status(403).json({
                message: 'Compte bloqué après 5 tentatives échouées. Veuillez contacter l\'administrateur.'
            });
        }

        if (await user.matchPassword(password)) {
            // Reset attempts on successful login
            user.failedLoginAttempts = 0;
            await user.save();

            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                classId: user.classId,
                subjects: user.subjects,
                profilePicture: user.profilePicture,
                token: generateToken(user._id, user.role),
            });
        } else {
            // Increment failed attempts for students and professors
            if (user.role !== 'manager') {
                user.failedLoginAttempts += 1;
                if (user.failedLoginAttempts >= 5) {
                    user.isLocked = true;
                    await user.save();
                    return res.status(403).json({
                        message: 'Compte bloqué après 5 tentatives échouées. Veuillez contacter l\'administrateur.'
                    });
                }
                await user.save();
            }
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  DISABLED (Was Public) - Security Risk: Allowed creating Managers publicly.
const registerUser = async (req, res) => {
    // 🔒 SECURITY BLOCK: Prevent usage if route is accidentally enabled
    return res.status(403).json({ message: "Public registration is disabled. Please contact an administrator." });

    /* ORIGINAL CODE DISABLED
    const { firstName, lastName, email, password, role } = req.body;
    
    try {
        const userExists = await User.findOne({ email });
    
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
    
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
        });
    
        if (user) {
            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
        */
};

module.exports = { loginUser, registerUser };
