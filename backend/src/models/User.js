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
 *         workType:
 *           type: string
 *           enum: [onsite, remote]
 *           default: onsite
 *           description: Work type of the employee
 *         verificationStaff:
 *           type: boolean
 *           default: false
 *           description: Whether the employee is a verification staff member
 *         incentive:
 *           type: object
 *           description: Monthly incentive earned by the user (format: YYYY-MM -> amount)
 *         incentives:
 *           type: array
 *           items:
 *             type: string
 *             description: ObjectId reference to Incentive
 *           description: Array of Incentive ObjectIds for this user
 *       example:
 *         name: Admin User
 *         email: admin@ca-erp.com
 *         role: admin
 *         phone: "+1 (123) 456-7890"
 *         department: Management
 *         status: active
 *         workType: onsite
 *         verificationStaff: false
 */

const UserSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
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
    casual: {
    type: Number,
    default:1,
  },
    incentive: {
        type: Map,
        of: Number,
        default: new Map(),
        description: 'Monthly incentive earned by the user'
    },
    incentives: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incentive',
        description: 'References to Incentive documents'
    }],
    role: {
        type: String,
        enum: ['admin', 'staff', 'manager', 'finance'],
        default: 'staff',
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Please assign a department'],
        index: true
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
        required: [true, 'Please assign a position'],
        index: true
    },
    workType: {
        type: String,
        enum: ['onsite', 'remote'],
        default: 'onsite',
        required: [true, 'Please specify work type']
    },
    verificationStaff: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function (next) {
  // Only run this if password was modified
  if (!this.isModified("password")) {
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

// Add timestamps to the schema
UserSchema.set('timestamps', true);

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Get total incentive across all months
UserSchema.methods.getTotalIncentive = function () {
    if (!this.incentive || !(this.incentive instanceof Map)) {
        return 0;
    }
    let total = 0;
    for (const [key, value] of this.incentive) {
        if (typeof value === 'number') {
            total += value;
        }
    }
    return total;
};

// Get incentive for a specific month
UserSchema.methods.getIncentiveForMonth = function (year, month) {
    if (!this.incentive || !(this.incentive instanceof Map)) {
        return 0;
    }
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return this.incentive.get(monthKey) || 0;
};

module.exports = mongoose.model('User', UserSchema);