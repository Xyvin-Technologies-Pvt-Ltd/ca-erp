const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const clientRoutes = require('./client.routes');
const projectRoutes = require('./project.routes');
const taskRoutes = require('./task.routes');
const documentRoutes = require('./document.routes');
const settingRoutes = require('./setting.routes');
const financeRoutes = require('./finance.routes');
const positionRoutes = require('./position.routes');
const eventRoutes = require('./event.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/settings', settingRoutes);
router.use('/finance', financeRoutes);
router.use('/positions', positionRoutes);
router.use('/events', eventRoutes);

module.exports = router; 