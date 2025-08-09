const Invoice = require('../models/Invoice');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Client = require('../models/Client');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const path = require('path');

/**
 * @desc    Get all invoices
 * @route   GET /api/finance/invoices
 * @access  Private/Finance,Admin
 */
exports.getInvoices = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Filtering
        const filter = {};

        // Filter by status
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by client
        if (req.query.client) {
            filter.client = req.query.client;
        }

        // Filter by project
        if (req.query.project) {
            filter.project = req.query.project;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            filter.issueDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            filter.issueDate = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            filter.issueDate = { $lte: new Date(req.query.endDate) };
        }

        // Get total count
        const total = await Invoice.countDocuments(filter);

        // Query with filters
        const invoices = await Invoice.find(filter)
            .populate({
                path: 'client',
                select: 'name contactEmail contactPhone'
            })
            .populate({
                path: 'project',
                select: 'name'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .skip(startIndex)
            .limit(limit)
            .sort({ issueDate: -1 });

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: invoices.length,
            pagination,
            total,
            data: invoices
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single invoice
 * @route   GET /api/finance/invoices/:id
 * @access  Private/Finance,Admin
 */
exports.getInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: 'client',
                select: 'name contactEmail contactPhone address'
            })
            .populate({
                path: 'project',
                select: 'name description'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .populate({
                path: 'items.task',
                select: 'title description'
            });

        if (!invoice) {
            return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new invoice
 * @route   POST /api/finance/invoices
 * @access  Private/Finance,Admin
 */
exports.createInvoice = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        // Validate client exists
        const client = await Client.findById(req.body.client);
        if (!client) {
            return next(new ErrorResponse(`Client not found with id of ${req.body.client}`, 404));
        }

        // Validate projects if provided
        if (req.body.projects && req.body.projects.length > 0) {
            for (const projectData of req.body.projects) {
                const project = await Project.findById(projectData.projectId);
                if (!project) {
                    return next(new ErrorResponse(`Project not found with id of ${projectData.projectId}`, 404));
                }
                // Check if project belongs to the client
                if (project.client.toString() !== req.body.client) {
                    return next(new ErrorResponse(`Project ${project.name} does not belong to the selected client`, 400));
                }
                // Check if project is completed
                if (project.status !== 'completed') {
                    return next(new ErrorResponse(`Project ${project.name} is not completed and cannot be invoiced`, 400));
                }
                // Check if project is already invoiced
                if (project.invoiceStatus === 'Created') {
                    return next(new ErrorResponse(`Project ${project.name} is already invoiced`, 400));
                }
            }
        }

        // Generate invoice number if not provided
        if (!req.body.invoiceNumber) {
            const prefix = 'INV';
            const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const count = await Invoice.countDocuments() + 1;
            req.body.invoiceNumber = `${prefix}-${date}-${count.toString().padStart(4, '0')}`;
        }

        // Create invoice items from projects
        if (req.body.projects && req.body.projects.length > 0) {
            req.body.items = req.body.projects.map(projectData => ({
                description: projectData.name || 'Project Services',
                quantity: 1,
                rate: projectData.amount || 0,
                amount: projectData.amount || 0,
                projectId: projectData.projectId
            }));
        }

        // Calculate totals
        const subtotal = req.body.items ? req.body.items.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
        const taxAmount = (subtotal * (req.body.taxRate || 0)) / 100;
        const total = subtotal + taxAmount - (req.body.discount || 0);

        req.body.subtotal = subtotal;
        req.body.taxAmount = taxAmount;
        req.body.total = total;

        // Create invoice
        const invoice = await Invoice.create(req.body);

        // Update project invoice status and link projects to invoice
        if (req.body.projects && req.body.projects.length > 0) {
            for (const projectData of req.body.projects) {
                await Project.findByIdAndUpdate(
                    projectData.projectId,
                    {
                        invoiceStatus: 'Created',
                        invoiceNumber: req.body.invoiceNumber,
                        invoiceDate: req.body.issueDate,
                        invoiceId: invoice._id,
                        updatedAt: new Date()
                    }
                );

                // Update tasks in the project to invoiced status
                const project = await Project.findById(projectData.projectId).populate('tasks');
                if (project.tasks && project.tasks.length > 0) {
                    for (const task of project.tasks) {
                        await Task.findByIdAndUpdate(
                            task._id,
                            {
                                'invoiceDetails.invoiced': true,
                                'invoiceDetails.invoiceDate': invoice.issueDate,
                                'invoiceDetails.invoiceNumber': invoice.invoiceNumber,
                                'invoiceDetails.invoiceId': invoice._id,
                                status: 'invoiced'
                            }
                        );
                    }
                }
            }
        }

        // Update task status to invoiced if tasks are included directly
        if (req.body.items && req.body.items.length > 0) {
            for (const item of req.body.items) {
                if (item.task) {
                    await Task.findByIdAndUpdate(
                        item.task,
                        {
                            'invoiceDetails.invoiced': true,
                            'invoiceDetails.invoiceDate': invoice.issueDate,
                            'invoiceDetails.invoiceNumber': invoice.invoiceNumber,
                            'invoiceDetails.invoiceId': invoice._id,
                            status: 'invoiced'
                        }
                    );
                }
            }
        }

        // Log the invoice creation
        logger.info(`Invoice created: ${invoice.invoiceNumber} (${invoice._id}) by ${req.user.name} (${req.user._id})`);

        res.status(201).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update invoice
 * @route   PUT /api/finance/invoices/:id
 * @access  Private/Finance,Admin
 */
exports.updateInvoice = async (req, res, next) => {
    try {
        let invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
        }

        // Don't allow updating if invoice is already paid
        if (invoice.status === 'paid' && !req.user.role.includes('admin')) {
            return next(new ErrorResponse(`Cannot update a paid invoice`, 400));
        }

        // Update the invoice
        invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Log the invoice update
        logger.info(`Invoice updated: ${invoice.invoiceNumber} (${invoice._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete invoice
 * @route   DELETE /api/finance/invoices/:id
 * @access  Private/Admin
 */
exports.deleteInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
        }

        // Don't allow deleting if invoice is already sent or paid
        if (['sent', 'paid'].includes(invoice.status)) {
            return next(new ErrorResponse(`Cannot delete an invoice that has been sent or paid`, 400));
        }

        // Update tasks to remove invoice reference
        for (const item of invoice.items) {
            if (item.task) {
                await Task.findByIdAndUpdate(
                    item.task,
                    {
                        'invoiceDetails.invoiced': false,
                        'invoiceDetails.invoiceDate': null,
                        'invoiceDetails.invoiceNumber': null,
                        status: 'completed'
                    }
                );
            }
        }

        // Delete the invoice
        await invoice.deleteOne();

        // Log the invoice deletion
        logger.info(`Invoice deleted: ${invoice.invoiceNumber} (${invoice._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update invoice status
 * @route   PUT /api/finance/invoices/:id/status
 * @access  Private/Finance,Admin
 */
exports.updateInvoiceStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        // Validate the status
        if (!['draft', 'sent', 'paid', 'cancelled', 'overdue'].includes(status)) {
            return next(new ErrorResponse(`Invalid status: ${status}`, 400));
        }

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
        }

        // If setting to paid, update paidDate
        if (status === 'paid' && invoice.status !== 'paid') {
            invoice.paidDate = new Date();
            invoice.paidAmount = invoice.total;
        }

        // If setting to sent, update sentDate
        if (status === 'sent' && invoice.status !== 'sent') {
            invoice.sentDate = new Date();
        }

        invoice.status = status;
        await invoice.save();

        // Log the status update
        logger.info(`Invoice status updated: ${invoice.invoiceNumber} (${invoice._id}) to ${status} by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get completed tasks available for invoicing
 * @route   GET /api/finance/tasks/completed
 * @access  Private/Finance,Admin
 */
exports.getCompletedTasks = async (req, res, next) => {
    try {
        // Filter only completed tasks that haven't been invoiced
        const filter = {
            status: 'completed',
            'invoiceDetails.invoiced': { $ne: true }
        };

        // Filter by project if provided
        if (req.query.project) {
            filter.project = req.query.project;
        }

        // Filter by client via project
        if (req.query.client) {
            const projects = await Project.find({ client: req.query.client }).select('_id');
            filter.project = { $in: projects.map(p => p._id) };
        }

        const tasks = await Task.find(filter)
            .populate({
                path: 'project',
                select: 'name client',
                populate: {
                    path: 'client',
                    select: 'name'
                }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email'
            });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get invoice statistics
 * @route   GET /api/finance/stats
 * @access  Private/Finance,Admin
 */
exports.getInvoiceStats = async (req, res, next) => {
    try {
        // Get total counts by status
        const statusCounts = await Invoice.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Get monthly totals for the current year
        const currentYear = new Date().getFullYear();

        const monthlyTotals = await Invoice.aggregate([
            {
                $match: {
                    issueDate: {
                        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$issueDate' },
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get overdue invoices
        const overdue = await Invoice.countDocuments({
            status: 'overdue'
        });

        const overdueAmount = await Invoice.aggregate([
            {
                $match: { status: 'overdue' }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Get top clients by invoice amount
        const topClients = await Invoice.aggregate([
            {
                $group: {
                    _id: '$client',
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'clientDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    total: 1,
                    count: 1,
                    clientName: { $arrayElemAt: ['$clientDetails.name', 0] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                statusCounts,
                monthlyTotals,
                overdue: {
                    count: overdue,
                    amount: overdueAmount.length > 0 ? overdueAmount[0].total : 0
                },
                topClients
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Record payment for a project
 * @route   POST /api/finance/projects/:id/payment
 * @access  Private/Finance,Admin
 */
exports.recordPayment = async (req, res, next) => {
    try {
        const { amount, method, reference, notes } = req.body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return next(new ErrorResponse('Payment amount is required and must be greater than 0', 400));
        }

        if (!method) {
            return next(new ErrorResponse('Payment method is required', 400));
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        // Create payment record
        const paymentRecord = {
            amount: Number(amount),
            method,
            reference: reference || '',
            notes: notes || '',
            recordedBy: req.user.id
        };

        // Add payment to history
        project.paymentHistory.push(paymentRecord);
        
        // Update received amount
        project.receivedAmount += Number(amount);
        
        // Update last payment date
        project.lastPaymentDate = new Date();
        
        // Save project (this will trigger the pre-save middleware to update balance and status)
        await project.save();

        // Log the payment
        logger.info(`Payment recorded for project ${project.name} (${project._id}): ${amount} by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: {
                project,
                payment: paymentRecord
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get payment history for a project
 * @route   GET /api/finance/projects/:id/payments
 * @access  Private/Finance,Admin
 */
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate({
                path: 'paymentHistory.recordedBy',
                select: 'name email'
            })
            .populate({
                path: 'client',
                select: 'name'
            });

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: {
                project: {
                    _id: project._id,
                    name: project.name,
                    amount: project.amount,
                    receivedAmount: project.receivedAmount,
                    balanceAmount: project.balanceAmount,
                    paymentStatus: project.paymentStatus,
                    lastPaymentDate: project.lastPaymentDate,
                    client: project.client
                },
                paymentHistory: project.paymentHistory
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get financial summary for all projects
 * @route   GET /api/finance/summary
 * @access  Private/Finance,Admin
 */
exports.getFinancialSummary = async (req, res, next) => {
    try {
        // Get total amounts by payment status
        const paymentStatusSummary = await Project.aggregate([
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalReceived: { $sum: '$receivedAmount' },
                    totalBalance: { $sum: '$balanceAmount' }
                }
            }
        ]);

        // Get total financial overview
        const totalOverview = await Project.aggregate([
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalReceived: { $sum: '$receivedAmount' },
                    totalBalance: { $sum: '$balanceAmount' },
                    totalInvoiced: { $sum: { $cond: [{ $eq: ['$invoiceStatus', 'Created'] }, 1, 0] } },
                    totalNotInvoiced: { $sum: { $cond: [{ $eq: ['$invoiceStatus', 'Not Created'] }, 1, 0] } }
                }
            }
        ]);

        // Get recent payments
        const recentPayments = await Project.aggregate([
            {
                $unwind: '$paymentHistory'
            },
            {
                $sort: { 'paymentHistory.date': -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'paymentHistory.recordedBy',
                    foreignField: '_id',
                    as: 'recordedBy'
                }
            },
            {
                $lookup: {
                    from: 'clients',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $project: {
                    projectName: '$name',
                    payment: '$paymentHistory',
                    recordedBy: { $arrayElemAt: ['$recordedBy.name', 0] },
                    clientName: { $arrayElemAt: ['$client.name', 0] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                paymentStatusSummary,
                totalOverview: totalOverview[0] || {},
                recentPayments
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update project payment status manually
 * @route   PUT /api/finance/projects/:id/payment-status
 * @access  Private/Finance,Admin
 */
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus, receivedAmount } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        // Update payment status and received amount
        if (paymentStatus) {
            project.paymentStatus = paymentStatus;
        }

        if (receivedAmount !== undefined) {
            project.receivedAmount = Number(receivedAmount);
        }

        // Save project (this will trigger the pre-save middleware)
        await project.save();

        // Log the update
        logger.info(`Payment status updated for project ${project.name} (${project._id}) to ${project.paymentStatus} by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};


/**
 * @desc    Upload receipt for a project (image or document)
 * @route   POST /api/finance/projects/:id/upload-receipt
 * @access  Private/Finance,Admin
 */
exports.uploadReceipt = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        if (!req.file) {
            return next(new ErrorResponse('Please upload a file', 400));
        }
         console.log(req.file, "File uploaded successfully");
        const receiptPath = `/uploads/receipts/${req.file.originalname}`;
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { receipts: receiptPath },
            { new: true, runValidators: true }
        );

        logger.info(`Receipt uploaded for project: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        console.error("Error in uploadReceipt:", error);
        next(error);
    }
};