const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    addTaskComment,
    updateTaskTime,
    getMyTasks,
    markTaskAsInvoiced,
    uploadTagDocument,
    getTaskTagDocuments,
    remindClientForDocument
} = require('../controllers/task.controller');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { taskValidation } = require('../middleware/validator');
const { uploadTaskFile, uploadTagDocument: uploadTagDocumentMiddleware } = require('../middleware/upload');
const ensureFileArray = (req, res, next) => {
    if (!req.body) req.body = {}; // Ensure body exists
    req.body.file = req.file ? [req.file.filename] : []; // If file exists, assign filename array; else, empty array
    next(); // Continue to next middleware (validation)
};
  
/**
 * @swagger
 * /api/tasks/me:
 *   get:
 *     summary: Get tasks for current user
 *     description: Retrieve tasks assigned to the currently logged in user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g., to-do, in-progress, completed)
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Get tasks due in the next 7 days
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Get overdue tasks
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 */
router.route('/me')
    .get(protect, getMyTasks);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve a list of all tasks. Can be filtered by status, project, assignedTo, and more.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of tasks per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g., to-do, in-progress, completed)
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assignedTo user ID (admin only)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority (e.g., low, medium, high)
 *       - in: query
 *         name: dueBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due before this date
 *       - in: query
 *         name: dueAfter
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due after this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for task title or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort fields (e.g. dueDate,-priority,title)
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .get(protect, getTasks)
    /**
     * @swagger
     * /api/tasks:
     *   post:
     *     summary: Create a new task
     *     description: Create a new task
     *     tags: [Tasks]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/TaskInput'
     *     responses:
     *       201:
     *         description: Task created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    .post(protect, uploadTaskFile.single('file'), ensureFileArray, validate(taskValidation.create), createTask);
   
/**
 * @swagger
 * /api/tasks/all:
 *   get:
 *     summary: Get all tasks (no pagination)
 *     description: Retrieve a list of all tasks without pagination or limit. For dashboard use only.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 */
router.route('/all').get(protect, require('../controllers/task.controller').getAllTasksNoPagination);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     description: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this task
 */
router.route('/:id')
    .get(protect, getTask)
    /**
     * @swagger
     * /api/tasks/{id}:
     *   put:
     *     summary: Update a task
     *     description: Update a task by ID
     *     tags: [Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/TaskUpdateInput'
     *     responses:
     *       200:
     *         description: Task updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request
     *       404:
     *         description: Task not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Not authorized to update this task
     */
        .put(protect, uploadTaskFile.single('file'), updateTask)

    /**
     * @swagger
     * /api/tasks/{id}:
     *   delete:
     *     summary: Delete a task
     *     description: Delete a task by ID (Admin only)
     *     tags: [Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     responses:
     *       200:
     *         description: Task deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                 message:
     *                   type: string
     *       404:
     *         description: Task not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .delete(protect, authorize('admin'), deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     summary: Update task status
 *     description: Update the status of a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [to-do, in-progress, review, completed, cancelled]
 *                 description: Task status
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this task
 */
router.route('/:id/status')
    .put(protect, updateTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     description: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/comments')
    .post(protect, addTaskComment);

/**
 * @swagger
 * /api/tasks/{id}/time:
 *   put:
 *     summary: Add time entry to a task
 *     description: Add a time tracking entry to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: Hours spent
 *               description:
 *                 type: string
 *                 description: Description of work done
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the time entry (defaults to now)
 *     responses:
 *       200:
 *         description: Time entry added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     entry:
 *                       type: object
 *                     totalActualHours:
 *                       type: number
 *                     estimatedHours:
 *                       type: number
 *       400:
 *         description: Bad request
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this task
 */
router.route('/:id/time')
    .put(protect, updateTaskTime);

/**
 * @swagger
 * /api/tasks/{id}/invoice:
 *   put:
 *     summary: Mark task as invoiced
 *     description: Mark a completed task as invoiced (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 description: ID of the invoice
 *     responses:
 *       200:
 *         description: Task marked as invoiced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.route('/:id/invoice')
    .put(protect,  markTaskAsInvoiced);

/**
 * @swagger
 * /api/tasks/{id}/tag-documents:
 *   get:
 *     summary: Get documents for a task
 *     description: Retrieve a list of documents associated with a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/tag-documents')
    .get(protect, getTaskTagDocuments)
    .post(protect, uploadTagDocumentMiddleware.single('file'), uploadTagDocument);

/**
 * @swagger
 * /api/tasks/{id}/remind-client:
 *   post:
 *     summary: Send reminder to client for document
 *     description: Send a reminder to the client associated with the task's project for a specific document
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentName
 *               - documentType
 *               - tag
 *             properties:
 *               documentName:
 *                 type: string
 *                 description: Name of the document to remind about
 *                 example: "GST Registration Certificate"
 *               documentType:
 *                 type: string
 *                 description: Type of the document
 *                 example: "gst_certificate"
 *               tag:
 *                 type: string
 *                 description: Tag category for the document
 *                 example: "GST"
 *     responses:
 *       200:
 *         description: Reminder sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     documentName:
 *                       type: string
 *                     reminderSentBy:
 *                       type: string
 *                     reminderSentAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields or client has no phone
 *       403:
 *         description: Unauthorized to send reminders for this task
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/remind-client')
    .post(protect, remindClientForDocument);

module.exports = router; 