const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const eventController = require('../controllers/event.controller');

router.use(protect);

router.route('/')
  .post(eventController.createEvent)
  .get(eventController.getEvents);

router.route('/:id')
  .get(eventController.getEvent)
  .put(eventController.updateEvent)
  .delete(eventController.deleteEvent);

module.exports = router; 