const express = require('express');
const {
    getCronJobs,
    getCronJob,
    createCronJob,
    updateCronJob,
    deleteCronJob,
    getSections
} = require('../controllers/cronJob.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.route('/')
    .get(getCronJobs)
    .post(createCronJob);

router.route('/:id')
    .get(getCronJob)
    .put(updateCronJob)
    .delete(deleteCronJob);

router.route('/sections/:clientId')
    .get(getSections);

module.exports = router; 