const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'DOCUMENT_REQUIRED', 'COMPLIANCE_DUE', 'INVOICE_REQUIRED','LEAVE_REVIEW','LEAVE_REQUEST']
  },
  read: {
    type: Boolean,
    default: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);