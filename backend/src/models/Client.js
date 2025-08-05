const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - name
 *         - contactEmail
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the client
 *         name:
 *           type: string
 *           description: Name of the client organization
 *         contactName:
 *           type: string
 *           description: Name of the primary contact person
 *         contactEmail:
 *           type: string
 *           description: Email address of the primary contact
 *         contactPhone:
 *           type: string
 *           description: Phone number of the primary contact
 *         country:
 *           type: string
 *           description: Country of the client
 *         state:
 *           type: string
 *           description: State of the client
 *         city:
 *           type: string
 *           description: City of the client
 *         pin:
 *           type: string
 *           description: PIN/Postal code of the client
 *         gstin:
 *           type: string
 *           description: GSTIN of the client
 *         pan:
 *           type: string
 *           description: PAN of the client
 *         cin:
 *           type: string
 *           description: CIN of the client
 *         currencyFormat:
 *           type: string
 *           description: Currency format of the client
 *         website:
 *           type: string
 *           description: Website of the client
 *         industry:
 *           type: string
 *           description: Industry the client operates in
 *         notes:
 *           type: string
 *           description: Additional notes about the client
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: Client account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the client was created
 *       example:
 *         name: XYZ Corporation
 *         contactName: John Smith
 *         contactEmail: john@xyzcorp.com
 *         contactPhone: "+1 (987) 654-3210"
 *         country: USA
 *         state: California
 *         city: Corporate City
 *         pin: 54321
 *         gstin: 1234567890
 *         pan: ABCDE1234F
 *         cin: 1234567890123
 *         currencyFormat: USD
 *         website: https://xyzcorp.com
 *         industry: Technology
 *         status: active
 */

const ClientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a client name'],
            trim: true,
            maxlength: [100, 'Client name cannot be more than 100 characters'],
        },
        contactName: {
            type: String,
            trim: true,
            maxlength: [50, 'Contact name cannot be more than 50 characters'],
        },
        contactEmail: {
            type: String,
            required: [true, 'Please add a contact email'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        contactPhone: {
            type: String,
            maxlength: [20, 'Phone number cannot be longer than 20 characters'],
        },
        country: {
            type: String,
            maxlength: [50, 'Country cannot be more than 50 characters'],
        },
        state: {
            type: String,
            maxlength: [50, 'State cannot be more than 50 characters'],
        },
        city: {
            type: String,
            maxlength: [50, 'City cannot be more than 50 characters'],
        },
        pin: {
            type: String,
            maxlength: [20, 'PIN/Postal code cannot be more than 20 characters'],
        },
        gstin: {
            type: String,
            maxlength: [20, 'GSTIN cannot be more than 20 characters'],
        },
        pan: {
            type: String,
            maxlength: [10, 'PAN cannot be more than 10 characters'],
        },
        cin: {
            type: String,
            maxlength: [21, 'CIN cannot be more than 21 characters'],
        },
        currencyFormat: {
            type: String,
            maxlength: [10, 'Currency format cannot be more than 10 characters'],
        },
        website: {
            type: String,
            match: [
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                'Please use a valid URL with HTTP or HTTPS',
            ],
        },
        directors: {
        type: [String], // Array of strings
        default: [],
        validate: {
            validator: function(directors) {
                // Filter out empty strings and check minimum requirement
                const validDirectors = directors.filter(d => d && d.trim());
                return validDirectors.length >= 2;
            },
            message: 'At least 2 directors are required'
        }
    },
        industry: {
            type: String,
            maxlength: [50, 'Industry cannot be more than 50 characters'],
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Reverse populate with virtuals
ClientSchema.virtual('projects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'client',
    justOne: false,
});

// Cascade delete projects when a client is deleted
ClientSchema.pre('remove', async function (next) {
    await this.model('Project').deleteMany({ client: this._id });
    next();
});

module.exports = mongoose.model('Client', ClientSchema); 