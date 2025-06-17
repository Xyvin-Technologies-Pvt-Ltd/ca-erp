const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Get next department code
router.get('/code/next', departmentController.getNextDepartmentCode);

// Department routes
router.route('/')
    .get(departmentController.getAllDepartments)
    .post(authorize('admin', 'manager'), departmentController.createDepartment);

router.route('/:id')
    .get(departmentController.getDepartment)
    .put(departmentController.updateDepartment)
    .delete(departmentController.deleteDepartment);

module.exports = router; 