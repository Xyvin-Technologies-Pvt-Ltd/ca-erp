const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    logout,
    updatePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validator');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff, finance]
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.post('/register', validate(userValidation.register), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user or superadmin
 *     description: Login with email and password. Supports both regular users and superadmin accounts.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (user or superadmin)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
 *     responses:
 *       200:
 *         description: User or superadmin logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     superadmin:
 *                       type: boolean
 *                       description: True if logged in as superadmin
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(userValidation.login), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: User logged out successfully
 */
router.get('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/updatepassword:
 *   put:
 *     summary: Update user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 