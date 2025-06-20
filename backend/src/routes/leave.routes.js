const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(leaveController.getAllLeaves)
  .post(leaveController.createLeave);

router.route('/my')
  .get(leaveController.getAllMyLeaves);

router.route('/:id')
  .get(leaveController.getLeave)
  .patch(leaveController.updateLeave)
  .delete(leaveController.deleteLeave);

router.route('/:id/review')
  .patch(leaveController.reviewLeave);

module.exports = router; 