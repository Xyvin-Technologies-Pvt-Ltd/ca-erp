const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    uploadLogo,
    getMailSettings,
    updateMailSettings,
    getCompanyInfo
} = require('../controllers/settings.controller');

const { protect, authorizeSuperadmin } = require('../middleware/auth');
const { uploadLogo: uploadLogoMiddleware } = require('../middleware/upload');
const { validate } = require('../middleware/validator');
const { settingsValidation } = require('../middleware/validator');

/**
 * @swagger
 * /api/settings/company-info:
 *   get:
 *     summary: Get company information
 *     description: Get company name and logo (all authenticated users)
 *     tags: [Settings]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         logo:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/company-info', protect, getCompanyInfo);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get application settings
 *     description: Get the application settings (Superadmin only)
 *     tags: [Settings]
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
 *                 data:
 *                   $ref: '#/components/schemas/Settings'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
 */
router.route('/')
    .get(protect, authorizeSuperadmin(), getSettings)
    /**
     * @swagger
     * /api/settings:
     *   put:
     *     summary: Update application settings
     *     description: Update the application settings (Superadmin only)
     *     tags: [Settings]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SettingsInput'
     *     responses:
     *       200:
     *         description: Settings updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Settings'
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Superadmin access required
     */
    .put(protect, authorizeSuperadmin(), validate(settingsValidation.update), updateSettings);

/**
 * @swagger
 * /api/settings/logo:
 *   put:
 *     summary: Upload company logo
 *     description: Upload a logo for the company (Superadmin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Company logo image
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
 *                   $ref: '#/components/schemas/Settings'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Settings not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
 */
router.route('/company/logo')
    .put(
        protect,
        authorizeSuperadmin(),
        uploadLogoMiddleware.single('logo'),
        uploadLogo
    );

/**
 * @swagger
 * /api/settings/mail:
 *   get:
 *     summary: Get mail settings
 *     description: Get the mail server settings (Superadmin only)
 *     tags: [Settings]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     host:
 *                       type: string
 *                     port:
 *                       type: number
 *                     secure:
 *                       type: boolean
 *                     auth:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: string
 *                         pass:
 *                           type: string
 *       404:
 *         description: Settings not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
 */
router.route('/mail')
    .get(protect, authorizeSuperadmin(), getMailSettings)
    /**
     * @swagger
     * /api/settings/mail:
     *   put:
     *     summary: Update mail settings
     *     description: Update the mail server settings (Superadmin only)
     *     tags: [Settings]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               host:
     *                 type: string
     *               port:
     *                 type: number
     *               secure:
     *                 type: boolean
      *               auth:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   pass:
 *                     type: string
 *     responses:
 *       200:
 *         description: Mail settings updated successfully
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
 *                     host:
 *                       type: string
 *                     port:
 *                       type: number
 *                     secure:
 *                       type: boolean
 *                     auth:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: string
 *                         pass:
 *                           type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Settings not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
     */
    .put(protect, authorizeSuperadmin(), updateMailSettings);

module.exports = router; 