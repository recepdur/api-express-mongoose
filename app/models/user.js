const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: [true, 'Please fill your email'], unique: true, lowercase: true, validate: [validator.isEmail, ' Please provide a valid email'] },
    password: { type: String, required: [true, 'Please fill your password'], minLength: 6, select: false },
    name: { type: String },
    displayName: { type: String },
    phone: { type: String },
    role: { type: String, enum: ['admin', 'standart'], default: 'standart' },
    isActive: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

// Mongoose -> Document Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { // check the password if it is modified
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);    // Hashing the password
    this.passwordConfirm = undefined;    // Delete passwordConfirm field
    next();
});

userSchema.methods.correctPassword = async function (typedPassword, originalPassword) {
    return await bcrypt.compare(typedPassword, originalPassword);
};

module.exports = mongoose.model('User', userSchema);