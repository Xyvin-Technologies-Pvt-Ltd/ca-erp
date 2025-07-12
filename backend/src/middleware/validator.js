const Joi = require('joi');
const { ErrorResponse } = require('./errorHandler');

// Function to validate request against a Joi schema
const validate = (schema) => {
    return (req, res, next) => {

        const options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
        };

        // Validate request body, params, and query against schema
        const { error, value } = schema.validate(
            {
                body: req.body,
                params: req.params,
                query: req.query,
            },
            options
        );

        if (error) {
            // Generate error messages from Joi validation
            const errorMessage = error.details
                .map((details) => details.message)
                .join(', ');

            return next(new ErrorResponse(errorMessage, 400));
        }

        // Replace request with validated data
        req.body = value.body;
        req.params = value.params;
        req.query = value.query;

        next();
    };
};

// User validation schemas
const userValidation = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().max(50).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6),
            role: Joi.string().valid('admin', 'manager', 'staff', 'finance'),
            department: Joi.string().max(50),
            position: Joi.string().max(50),
            phone: Joi.string().max(20),
        }),
    }),

    register: Joi.object({
        body: Joi.object({
            name: Joi.string().max(50).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6),
            role: Joi.string().valid('admin', 'manager', 'staff', 'finance'),
            department: Joi.string().max(50),
            position: Joi.string().max(50),
            phone: Joi.string().max(20),
        }),
    }),

    login: Joi.object({
        body: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            name: Joi.string().max(50),
            email: Joi.string().email(),
            password: Joi.string().min(6),
            role: Joi.string().valid('admin', 'manager', 'staff', 'finance'),
            department: Joi.string().max(50),
            position: Joi.string().max(50),
            phone: Joi.string().max(20),
            status: Joi.string().valid('active', 'inactive'),
        }),
    }),
};

// Client validation schemas
const clientValidation = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().max(100).required(),
            contactName: Joi.string().max(50).allow("").optional(),
            contactEmail: Joi.string().email().required(),
            contactPhone: Joi.string().max(20).allow("").optional(),
            country: Joi.string().max(50).allow("").optional(),
            state: Joi.string().max(50).allow("").optional(),
            city: Joi.string().max(50).allow("").optional(),
            pin: Joi.string().max(20).allow("").optional(),
            gstin: Joi.string().max(20).allow("").optional(),
            pan: Joi.string().max(10).allow("").optional(),
            cin: Joi.string().max(21).allow("").optional(),
            currencyFormat: Joi.string().max(10).allow("").optional(),
            website: Joi.string().allow("").optional(),
            industry: Joi.string().max(50).allow("").optional(),
            notes: Joi.string().allow("").optional(),
            directors: Joi.array().items(Joi.string().max(50)).min(2).required(),
            status: Joi.string().valid("active", "inactive").allow("").optional(),
        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            name: Joi.string().max(100).optional(),
            contactName: Joi.string().max(50).allow("").optional(),
            contactEmail: Joi.string().email().optional(),
            contactPhone: Joi.string().max(20).allow("").optional(),
            country: Joi.string().max(50).allow("").optional(),
            state: Joi.string().max(50).allow("").optional(),
            city: Joi.string().max(50).allow("").optional(),
            pin: Joi.string().max(20).allow("").optional(),
            gstin: Joi.string().max(20).allow("").optional(),
            pan: Joi.string().max(10).allow("").optional(),
            cin: Joi.string().max(21).allow("").optional(),
            currencyFormat: Joi.string().max(10).allow("").optional(),
            website: Joi.string().allow("").optional(),
            industry: Joi.string().max(50).allow("").optional(),
            notes: Joi.string().allow("").optional(),
            directors: Joi.array().items(Joi.string().max(50)).min(2).optional(),
            status: Joi.string().valid('active', 'inactive').allow("").optional(),
        }),
    }),
};

// Project validation schemas
const projectValidation = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().max(100).required(),
            description: Joi.string().max(500),
            client: Joi.string().required(),
            manager: Joi.string(),
            priority: Joi.string(),
            team: Joi.array().items(Joi.string()),
            status: Joi.string().valid('planning', 'in-progress', 'on-hold', 'completed', 'archived'),
            startDate: Joi.date().allow(null),
            dueDate: Joi.date().allow(null),
            budget: Joi.number().min(0),
        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            name: Joi.string().max(100),
            description: Joi.string().max(500),
            client: Joi.string(),
            manager: Joi.string(),
            team: Joi.array().items(Joi.string()),
            status: Joi.string().valid('planning', 'in-progress', 'on-hold', 'completed', 'archived'),
            startDate: Joi.date().allow(null),
            dueDate: Joi.date().allow(null),
            budget: Joi.number().min(0),
            deleted: Joi.boolean(),
            notes: Joi.array().items(
                Joi.object({
                    content: Joi.string().required(),
                    createdAt: Joi.date(),
                    deleted: Joi.boolean(),
                })
            ),
        }),
    }),
};

// Task validation schemas
const taskValidation = {
    create: Joi.object({
        body: Joi.object({
            title: Joi.string().max(100).required(),
            description: Joi.string().max(500).required(),
            project: Joi.string().required(),
            assignedTo: Joi.string().required(),
            amount: Joi.number().min(0),
            status: Joi.string().valid('pending', 'in-progress', 'under-review', 'completed', 'invoiceable', 'invoiced', 'cancelled', 'review'),
            priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
            dueDate: Joi.date().required(),
            estimatedHours: Joi.number().min(0),
            parent: Joi.string(),
            tags: Joi.array().items(Joi.string()).default([]),
            fileUrl: Joi.string().uri(),
            fileType: Joi.string(),
            fileSize: Joi.number(),
            team: Joi.array().items(Joi.string()),
            file: Joi.array().items(Joi.string()).default([]).optional(),

        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            title: Joi.string().max(100),
            description: Joi.string().max(500),
            project: Joi.string(),
            assignedTo: Joi.string(),
            status: Joi.string().valid('pending', 'in-progress', 'under-review', 'completed', 'invoiceable', 'invoiced', 'cancelled', 'review'),
            priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
            dueDate: Joi.date(),
            estimatedHours: Joi.number().min(0),
            parent: Joi.string(),
            deleted: Joi.boolean(),
            tags: Joi.array().items(Joi.string()),
            fileUrl: Joi.string().uri(),
            fileType: Joi.string(),
            fileSize: Joi.number(),
            amount: Joi.number().min(0),
            team: Joi.array().items(Joi.string()),
        }),
    }),

    addTimeEntry: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            hours: Joi.number().min(0.1).required(),
            description: Joi.string(),
            date: Joi.date(),
        }),
    }),
};

// Document validation schemas
const documentValidation = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().max(100).required(),
            description: Joi.string().max(500),
            category: Joi.string().valid('financial', 'legal', 'compliance', 'tax', 'general'),
            project: Joi.string(),
            task: Joi.string(),
            client: Joi.string(),
            tags: Joi.array().items(Joi.string()),
        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            name: Joi.string().max(100),
            description: Joi.string().max(500),
            category: Joi.string().valid('financial', 'legal', 'compliance', 'tax', 'general'),
            project: Joi.string(),
            task: Joi.string(),
            client: Joi.string(),
            tags: Joi.array().items(Joi.string()),
            isArchived: Joi.boolean(),
            deleted: Joi.boolean(),
        }),
    }),
};

// Invoice validation schemas
const invoiceValidation = {
    create: Joi.object({
        body: Joi.object({
            invoiceNumber: Joi.string().required(),
            client: Joi.string().required(),
            project: Joi.string(),
            items: Joi.array().items(
                Joi.object({
                    description: Joi.string().required(),
                    quantity: Joi.number().min(0).required(),
                    rate: Joi.number().min(0).required(),
                    amount: Joi.number().min(0).required(),
                    task: Joi.string(),
                })
            ).required(),
            amount: Joi.number().min(0).required(),
            tax: Joi.number().min(0),
            status: Joi.string().valid('draft', 'sent', 'paid', 'cancelled', 'overdue'),
            issueDate: Joi.date(),
            dueDate: Joi.date().required(),
            notes: Joi.string().max(500),
        }),
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().required(),
        }),
        body: Joi.object({
            status: Joi.string().valid('draft', 'sent', 'paid', 'cancelled', 'overdue'),
            paidDate: Joi.date(),
            notes: Joi.string().max(500),
        }),
    }),
};

// Settings validation schema
const settingsValidation = {
    update: Joi.object({
        body: Joi.object({
            company: Joi.object({
                name: Joi.string(),
                contactEmail: Joi.string().email(),
                phone: Joi.string(),
                address: Joi.object({
                    country: Joi.string(),
                    state: Joi.string(),
                    city: Joi.string(),
                    pin: Joi.string(),
                    street: Joi.string(),
                }),
                website: Joi.string(),
                taxId: Joi.string(),
                financialYearStart: Joi.string(),
                currency: Joi.string(),
                dateFormat: Joi.string(),
            }),
            system: Joi.object({
                emailNotifications: Joi.boolean(),
                taskAssignments: Joi.boolean(),
                taskStatusChanges: Joi.boolean(),
                projectUpdates: Joi.boolean(),
                requireMfa: Joi.boolean(),
                passwordExpiryDays: Joi.number().min(0),
                sessionTimeoutMinutes: Joi.number().min(5),
                clientPortalEnabled: Joi.boolean(),
                allowGuestAccess: Joi.boolean(),
                fileUploadMaxSize: Joi.number().min(1),
                autoArchiveCompletedProjects: Joi.boolean(),
                autoArchiveDays: Joi.number().min(1),
                autoAssignToProjectManager: Joi.boolean(),
            }),
        }),
    }),
};

module.exports = {
    validate,
    userValidation,
    clientValidation,
    projectValidation,
    taskValidation,
    documentValidation,
    invoiceValidation,
    settingsValidation,
}; 