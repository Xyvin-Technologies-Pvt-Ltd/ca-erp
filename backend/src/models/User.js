const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           description: Email address, must be unique
 *         password:
 *           type: string
 *           description: Password (hashed)
 *         role:
 *           type: string
 *           enum: [admin, manager, staff, finance]
 *           description: User role
 *         phone:
 *           type: string
 *           description: Phone number
 *         department:
 *           type: string
 *           description: Department
 *         avatar:
 *           type: string
 *           description: Path to avatar image
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: User account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was created
 *         position:
 *           type: string
 *           description: Position (ObjectId reference)
 *       example:
 *         name: Admin User
 *         email: admin@ca-erp.com
 *         role: admin
 *         phone: "+1 (123) 456-7890"
 *         department: Management
 *         status: active
 */

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password in queries
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'staff', 'finance'],
            default: 'staff',
        },
        phone: {
            type: String,
            maxlength: [20, 'Phone number cannot be longer than 20 characters'],
        },
        department: {
            type: String,
            maxlength: [50, 'Department name cannot be more than 50 characters'],
        },
        avatar: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        position: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position',
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
    // Only run this if password was modified
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 