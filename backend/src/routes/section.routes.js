const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const { protect } = require('../middleware/auth');

// Create section
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, client } = req.body;
    if (!name || !client) {
      return res.status(400).json({ success: false, error: 'Name and client are required' });
    }
    const section = await Section.create({
      name,
      client,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// List sections by client
router.get('/client/:clientId', protect, async (req, res, next) => {
  try {
    const sections = await Section.find({ client: req.params.clientId });
    res.status(200).json({ success: true, data: sections });
  } catch (err) {
    next(err);
  }
});

// Delete section
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 