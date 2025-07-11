const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'task_created',
      'task_completed',
      'client_added',
      'project_created',
      'project_updated',
      'project_milestone',
      'deadline_updated',
      'document_uploaded',
      'task_updated',
      'reminder_sent'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['task', 'client', 'project', 'document']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  link: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying of recent activities
activitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);