const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * @swagger
 * components:
 *   schemas:
 *     SuperAdmin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the superadmin
 *         email:
 *           type: string
 *           description: Email address, must be unique
 *         password:
 *           type: string
 *           description: Password (hashed)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the superadmin was created
 *       example:
 *         email: xyvinSuperadmin@gmail.com
 *         password: superadmin
 */
const SuperAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt before saving
SuperAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Sign JWT and return
SuperAdminSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, superadmin: true }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
SuperAdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('SuperAdmin', SuperAdminSchema); 