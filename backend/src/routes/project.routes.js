const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectTasks,
    updateProjectStatus,
    updateProjectInvoiceStatus,
    advanceProjectLevel
} = require('../controllers/project.controller');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { projectValidation } = require('../middleware/validator');

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve a list of all projects. Can be filtered by status, client, and assignedTo.
 *     tags: [Projects]
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
 *         description: Number of projects per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g., pending, in-progress, completed)
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assignedTo user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for project name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort fields (e.g. name,-createdAt,dueDate)
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
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .get(protect, getProjects)
    /**
     * @swagger
     * /api/projects:
     *   post:
     *     summary: Create a new project
     *     description: Create a new project
     *     tags: [Projects]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProjectInput'
     *     responses:
     *       201:
     *         description: Project created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Project'
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    .post(protect, validate(projectValidation.create), createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project
 *     description: Get a single project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
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
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this project
 */
router.route('/:id')
    .get(protect, getProject)
    /**
     * @swagger
     * /api/projects/{id}:
     *   put:
     *     summary: Update a project
     *     description: Update a project by ID
     *     tags: [Projects]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Project ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProjectUpdateInput'
     *     responses:
     *       200:
     *         description: Project updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Project'
     *       400:
     *         description: Bad request
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Not authorized to update this project
     */
    .put(protect, validate(projectValidation.update), updateProject)
    /**
     * @swagger
     * /api/projects/{id}:
     *   delete:
     *     summary: Delete a project
     *     description: Delete a project by ID (Admin only)
     *     tags: [Projects]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Project ID
     *     responses:
     *       200:
     *         description: Project deleted successfully
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
     *       400:
     *         description: Bad request (e.g., project has associated tasks)
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .delete(protect, authorize('admin'), deleteProject);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   get:
 *     summary: Get all tasks for a project
 *     description: Retrieve a list of all tasks for a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assignedTo user ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
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
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this project
 */
router.route('/:id/tasks')
    .get(protect, getProjectTasks);

/**
 * @swagger
 * /api/projects/{id}/status:
 *   put:
 *     summary: Update project status
 *     description: Update the status of a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, planning, in-progress, on-hold, completed, cancelled]
 *                 description: Project status
 *     responses:
 *       200:
 *         description: Project status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this project
 */
router.route('/:id/status')
    .put(protect, updateProjectStatus);

router.put("/:id/advance", protect, advanceProjectLevel);


router.put('/:id/invoice', protect, updateProjectInvoiceStatus);
module.exports = router;