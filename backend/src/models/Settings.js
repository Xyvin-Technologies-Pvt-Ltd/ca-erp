const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the settings
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             contactEmail:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: object
 *               properties:
 *                 country:
 *                   type: string
 *                 state:
 *                   type: string
 *                 city:
 *                   type: string
 *                 pin:
 *                   type: string
 *                 street:
 *                   type: string
 *             website:
 *               type: string
 *             taxId:
 *               type: string
 *             financialYearStart:
 *               type: string
 *             currency:
 *               type: string
 *             dateFormat:
 *               type: string
 *             logo:
 *               type: string
 *           description: Company information and settings
 *         system:
 *           type: object
 *           properties:
 *             emailNotifications:
 *               type: boolean
 *             taskAssignments:
 *               type: boolean
 *             taskStatusChanges:
 *               type: boolean
 *             projectUpdates:
 *               type: boolean
 *             requireMfa:
 *               type: boolean
 *             passwordExpiryDays:
 *               type: number
 *             sessionTimeoutMinutes:
 *               type: number
 *             clientPortalEnabled:
 *               type: boolean
 *             allowGuestAccess:
 *               type: boolean
 *             fileUploadMaxSize:
 *               type: number
 *             autoArchiveCompletedProjects:
 *               type: boolean
 *             autoArchiveDays:
 *               type: number
 *             autoAssignToProjectManager:
 *               type: boolean
 *           description: System-wide settings and preferences
 *         updatedBy:
 *           type: string
 *           description: User ID of the person who last updated settings
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the settings were last updated
 *       example:
 *         company:
 *           name: CA-ERP Solutions
 *           contactEmail: contact@ca-erp.com
 *           phone: "+1 234 567 8900"
 *           address:
 *             country: USA
 *             state: New York
 *             city: New York
 *             pin: 10001
 *             street: 123 Business Avenue, Suite 456
 *           website: https://ca-erp.com
 *           taxId: "12-3456789"
 *           financialYearStart: April
 *           currency: INR
 *           dateFormat: DD/MM/YYYY
 *         system:
 *           emailNotifications: true
 *           taskAssignments: true
 *           taskStatusChanges: true
 *           projectUpdates: true
 *           requireMfa: false
 *           passwordExpiryDays: 90
 *           clientPortalEnabled: true
 */

const SettingsSchema = new mongoose.Schema(
    {
        company: {
            name: {
                type: String,
                trim: true,
                default: 'CA-ERP Solutions',
            },
            contactEmail: {
                type: String,
                default: 'contact@ca-erp.com',
            },
            phone: {
                type: String,
            },
            address: {
                country: { type: String },
                state: { type: String },
                city: { type: String },
                pin: { type: String },
                street: { type: String }, 
            },
            website: {
                type: String,
            },
            taxId: {
                type: String,
            },
            financialYearStart: {
                type: String,
                default: 'April',
            },
            currency: {
                type: String,
                default: 'INR',
            },
            dateFormat: {
                type: String,
                default: 'DD/MM/YYYY',
            },
            logo: {
                type: String,
                default: '',
            },
        },
        system: {
            // Notification settings
            emailNotifications: {
                type: Boolean,
                default: true,
            },
            taskAssignments: {
                type: Boolean,
                default: true,
            },
            taskStatusChanges: {
                type: Boolean,
                default: true,
            },
            projectUpdates: {
                type: Boolean,
                default: true,
            },

            // Security settings
            requireMfa: {
                type: Boolean,
                default: false,
            },
            passwordExpiryDays: {
                type: Number,
                default: 90,
            },
            sessionTimeoutMinutes: {
                type: Number,
                default: 30,
            },

            // Access permissions
            clientPortalEnabled: {
                type: Boolean,
                default: true,
            },
            allowGuestAccess: {
                type: Boolean,
                default: false,
            },
            fileUploadMaxSize: {
                type: Number,
                default: 10, // in MB
            },

            // Automatic actions
            autoArchiveCompletedProjects: {
                type: Boolean,
                default: true,
            },
            autoArchiveDays: {
                type: Number,
                default: 30,
            },
            autoAssignToProjectManager: {
                type: Boolean,
                default: true,
            },
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Settings', SettingsSchema); 