const Leave = require('../models/Leave');
const User = require('../models/User');
const createError = require('http-errors');
const catchAsync = require('../utils/catchAsync');

// Get all leave requests
exports.getAllLeaves = catchAsync(async (req, res) => {
  const { status, employeeId, departmentId, startDate, endDate } = req.query;
  let query = {};
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;
  // Date range filter
  if (startDate && endDate) {
    query.$or = [
      { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
    ];
  }
  const leaves = await Leave.find(query)
    .populate({ path: 'employee', select: 'name department position' })
    .sort('-createdAt');
  res.status(200).json({ status: 'success', results: leaves.length, data: { leaves } });
});

// Get my leaves
exports.getAllMyLeaves = catchAsync(async (req, res) => {
  let query = { employee: req.user._id };
  const leaves = await Leave.find(query)
    .populate({ path: 'employee', select: 'name department position' })
    .sort('-createdAt');
  res.status(200).json({ status: 'success', results: leaves.length, data: { leaves } });
});

// Get single leave
exports.getLeave = catchAsync(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate({ path: 'employee', select: 'name department position' });
  if (!leave) throw createError(404, 'No leave request found with that ID');
  res.status(200).json({ status: 'success', data: { leave } });
});

// Create leave
exports.createLeave = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason, status } = req.body;
  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    startDate,
    endDate,
    reason,
    status,
    user: req.user._id
  });
  res.status(201).json({ status: 'success', data: { leave } });
});

// Update leave
exports.updateLeave = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason, status } = req.body;
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { leaveType, startDate, endDate, reason, status },
    { new: true, runValidators: true }
  ).populate({ path: 'employee', select: 'name department position' });
  if (!leave) throw createError(404, 'No leave request found with that ID');
  res.status(200).json({ status: 'success', data: { leave } });
});

// Delete leave
exports.deleteLeave = catchAsync(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw createError(404, 'No leave request found with that ID');
  await Leave.deleteOne({ _id: leave._id });
  res.status(204).json({ status: 'success', data: null });
});

// Review leave
exports.reviewLeave = catchAsync(async (req, res) => {
  const { status, reviewNotes } = req.body;
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw createError(404, 'No leave request found with that ID');
  leave.status = status;
  leave.reviewNotes = reviewNotes;
  leave.approvalChain.push({ approver: req.user._id, status, comment: reviewNotes, date: new Date() });
  await leave.save();
  res.status(200).json({ status: 'success', data: { leave } });
}); 