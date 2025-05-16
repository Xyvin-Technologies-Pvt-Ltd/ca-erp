const Settings = require('../models/Settings');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * @desc    Get settings
 * @route   GET /api/settings
 * @access  Private/Admin
 */
exports.getSettings = async (req, res, next) => {
    try {
        // There should only be one settings document in the system
        let settings = await Settings.findOne()
            .populate({
                path: 'updatedBy',
                select: 'name email'
            });

        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({
                company: {
                    name: 'Default Company',
                    contactEmail: 'contact@example.com',
                    phone: '',
                    address: '',
                    website: '',
                    taxId: '',
                    financialYearStart: new Date().toISOString().split('T')[0],
                    currency: 'USD',
                    dateFormat: 'MM/DD/YYYY',
                    logo: ''
                },
                system: {
                    emailNotifications: true,
                    taskAssignments: true,
                    requireMfa: false,
                    passwordExpiryDays: 90,
                    inactivityTimeoutMinutes: 30,
                    maxLoginAttempts: 5,
                    lockoutDurationMinutes: 30,
                    documentApprovals: false,
                    enableAuditLog: true,
                    backupFrequencyDays: 7,
                    retentionPeriodDays: 365,
                    mailServer: {
                        host: '',
                        port: 587,
                        secure: false,
                        auth: {
                            user: '',
                            pass: ''
                        }
                    }
                },
                updatedBy: req.user.id
            });

            // Log the settings creation
            logger.info(`Default settings created by ${req.user.name} (${req.user._id})`);
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.updatedBy = req.user.id;

        // There should only be one settings document in the system
        let settings = await Settings.findOne();

        if (!settings) {
            // If no settings exist, create with the provided data
            settings = await Settings.create(req.body);

            // Log the settings creation
            logger.info(`Settings created by ${req.user.name} (${req.user._id})`);
        } else {
            // Update existing settings
            settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
                new: true,
                runValidators: true,
            });

            // Log the settings update
            logger.info(`Settings updated by ${req.user.name} (${req.user._id})`);
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload company logo
 * @route   PUT /api/settings/logo
 * @access  Private/Admin
 */
exports.uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new ErrorResponse('Please upload a file', 400));
        }

        // There should only be one settings document in the system
        let settings = await Settings.findOne();

        if (!settings) {
            return next(new ErrorResponse('Settings not found', 404));
        }

        // Update logo path in settings while preserving other settings
        const logoPath = `/uploads/logos/${req.file.filename}`;
        logger.info(`Setting logo path: ${logoPath}`);
        
        // Update only the logo field while keeping other settings intact
        settings = await Settings.findOneAndUpdate(
            { _id: settings._id },
            { 
                $set: {
                    'company.logo': logoPath,
                    'updatedBy': req.user.id
                }
            },
            { new: true, runValidators: true }
        ).populate({
            path: 'updatedBy',
            select: 'name email'
        });

        if (!settings) {
            return next(new ErrorResponse('Failed to update settings', 500));
        }

        // Log the logo update
        logger.info(`Company logo updated by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get mail settings
 * @route   GET /api/settings/mail
 * @access  Private/Admin
 */
exports.getMailSettings = async (req, res, next) => {
    try {
        // There should only be one settings document in the system
        const settings = await Settings.findOne();

        if (!settings) {
            return next(new ErrorResponse('Settings not found', 404));
        }

        // Return only the mail settings
        res.status(200).json({
            success: true,
            data: settings.system.mailServer,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update mail settings
 * @route   PUT /api/settings/mail
 * @access  Private/Admin
 */
exports.updateMailSettings = async (req, res, next) => {
    try {
        // There should only be one settings document in the system
        let settings = await Settings.findOne();

        if (!settings) {
            return next(new ErrorResponse('Settings not found', 404));
        }

        // Update mail settings
        settings.system.mailServer = req.body;
        settings.updatedBy = req.user.id;
        await settings.save();

        // Log the mail settings update
        logger.info(`Mail settings updated by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: settings.system.mailServer,
        });
    } catch (error) {
        next(error);
    }
};