const express = require('express');
const router = express.Router();
const {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    uploadLogo,
    getClientProjects
} = require('../controllers/client.controller');

const { protect, authorize } = require('../middleware/auth');
const { uploadLogo: uploadLogoMiddleware } = require('../middleware/upload');
const { validate, clientValidation } = require('../middleware/validator');

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     description: Retrieve a list of all clients. Can be filtered by status and industry.
 *     tags: [Clients]
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
 *         description: Number of clients per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (active, inactive, etc.)
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for client name or contact info
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort fields (e.g. name,-createdAt)
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
 *                     $ref: '#/components/schemas/Client'
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .get(protect, getClients)
    /**
     * @swagger
     * /api/clients:
     *   post:
     *     summary: Create a new client
     *     description: Create a new client
     *     tags: [Clients]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ClientInput'
     *     responses:
     *       201:
     *         description: Client created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Client'
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    .post(protect, validate(clientValidation.create), createClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get a single client
 *     description: Get a single client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
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
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id')
    .get(protect, getClient)
    /**
     * @swagger
     * /api/clients/{id}:
     *   put:
     *     summary: Update a client
     *     description: Update a client by ID
     *     tags: [Clients]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Client ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ClientUpdateInput'
     *     responses:
     *       200:
     *         description: Client updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Client'
     *       400:
     *         description: Bad request
     *       404:
     *         description: Client not found
     *       401:
     *         description: Unauthorized
     */
    .put(protect, validate(clientValidation.update), updateClient)
    /**
     * @swagger
     * /api/clients/{id}:
     *   delete:
     *     summary: Delete a client
     *     description: Delete a client by ID (Admin only)
     *     tags: [Clients]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Client ID
     *     responses:
     *       200:
     *         description: Client deleted successfully
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
     *         description: Bad request (e.g., client has associated projects)
     *       404:
     *         description: Client not found
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    .delete(protect, authorize('admin', 'manager'), deleteClient);

/**
 * @swagger
 * /api/clients/{id}/logo:
 *   put:
 *     summary: Upload client logo
 *     description: Upload a logo for a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Client logo image
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/logo')
    .put(
        protect,
        uploadLogoMiddleware.single('logo'),
        uploadLogo
    );

/**
 * @swagger
 * /api/clients/{id}/projects:
 *   get:
 *     summary: Get all projects for a client
 *     description: Retrieve a list of all projects for a specific client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
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
 *                     $ref: '#/components/schemas/Project'
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/projects')
    .get(protect, getClientProjects);

module.exports = router; 