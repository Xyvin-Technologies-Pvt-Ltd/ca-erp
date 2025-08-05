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
 *           additionalProperties:
 *             type: number
 *           description: Incentive earned by the user per month, keys are YYYY-MM
 *         totalIncentive:
 *           type: number
 *           description: Total incentive earned by the user (virtual)
 *         currentMonthIncentive:
 *           type: number
 *           description: Incentive earned by the user in the current month (virtual)
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
        type: Object,
        default: {},
        description: 'Monthly incentive earned by the user, keys are YYYY-MM',
    },
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

// Virtual for total incentive
UserSchema.virtual('totalIncentive').get(function() {
  if (!this.incentive) return 0;
  return Object.values(this.incentive).reduce((sum, v) => sum + v, 0);
});

// Virtual for current month incentive
UserSchema.virtual('currentMonthIncentive').get(function() {
  if (!this.incentive) return 0;
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return this.incentive[key] || 0;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);