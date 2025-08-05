const Event = require('../models/Event');
const catchAsync = require('../utils/catchAsync');
const { createError } = require('../utils/errors');

// Create a new event
const createEvent = catchAsync(async (req, res) => {
  const { title, description, startDate, endDate } = req.body;
  const event = await Event.create({
    title,
    description,
    startDate,
    endDate,
    createdBy: req.user._id
  });
  res.status(201).json({
    status: 'success',
    data: event
  });
});

// Get all events
const getEvents = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find()
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments()
  ]);

  res.status(200).json({
    status: 'success',
    data: events,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Get single event
const getEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'name email');
  if (!event) {
    throw createError(404, 'Event not found');
  }
  res.status(200).json({
    status: 'success',
    data: event
  });
});

// Update event
const updateEvent = catchAsync(async (req, res) => {
  const { title, description, startDate, endDate } = req.body;
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { title, description, startDate, endDate },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');
  if (!event) {
    throw createError(404, 'Event not found');
  }
  res.status(200).json({
    status: 'success',
    data: event
  });
});

// Delete event
const deleteEvent = catchAsync(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    throw createError(404, 'Event not found');
  }
  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully'
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
}; 