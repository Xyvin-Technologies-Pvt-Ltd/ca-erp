const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendance,
  createAttendance,
  createBulkAttendance,
  checkOut,
  deleteAttendance,
  getAttendanceStats,
  updateAttendance,
  getEmployeeAttendance,
  getAttendanceByEmployeeId
} = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-attendance', getEmployeeAttendance);
router.get('/employee/:employeeId',  getAttendanceByEmployeeId);
router.post('/bulk',  createBulkAttendance);
router.get('/stats',  getAttendanceStats);
router.route('/check-in')
  .get( getAllAttendance)
  .post( createAttendance);
router.route('/:id')
  .get( getAttendance)
  .put( updateAttendance)
  .delete( deleteAttendance);
router.post('/check-out',  checkOut);

module.exports = router; 