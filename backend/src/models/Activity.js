const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'task_created',
      'task_completed',
      'task_deleted',
      'client_added',
      'project_created',
      'project_updated',
      'project_milestone',
      'deadline_updated',
      'document_uploaded',
      'document_reuploaded',
      'task_updated',
      'reminder_sent',

      'cronjob_created',
      'cronjob_executed',

      'task_time_entry'

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
    enum: ['task', 'client', 'project', 'document', 'cronjob']
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
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  }
});

// Index for efficient querying of recent activities
activitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);