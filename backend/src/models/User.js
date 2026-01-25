const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'professor', 'manager'],
        default: 'student',
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    // Optional fields for specific roles, can be moved to separate profile models if complex
    studentMatricule: { type: String }, // For student
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // For professor
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // For student
    profilePicture: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
