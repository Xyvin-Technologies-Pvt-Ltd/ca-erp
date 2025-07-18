const Activity = require('../models/Activity');

/**
 * Utility service for tracking activities across the application
 */
class ActivityTracker {
  /**
   * Create a new activity record
   * @param {Object} data Activity data
   * @param {String} data.type Activity type
   * @param {String} data.title Activity title
   * @param {String} data.description Activity description
   * @param {String} data.entityType Entity type (task, client, project, document)
   * @param {String} data.entityId Entity ID
   * @param {String} data.userId User ID who performed the action
   * @param {String} [data.link] Optional link related to the activity
   */
  static async track(data) {
    try {
      const activity = new Activity({
        type: data.type,
        title: data.title,
        description: data.description,
        user: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        link: data.link
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  }

  /**
   * Track task creation
   */
  static async trackTaskCreated(task, userId) {
    return this.track({
      type: 'task_created',
      title: 'New Task Created',
      description: `Task "${task.title}" was created`,
      entityType: 'task',
      entityId: task._id,
      userId,
      link: `/tasks/${task._id}`
    });
  }

  /**
   * Track task completion
   */
  static async trackTaskCompleted(task, userId) {
    return this.track({
      type: 'task_completed',
      title: 'Task Completed',
      description: `Task "${task.title}" was marked as completed`,
      entityType: 'task',
      entityId: task._id,
      userId,
      link: `/tasks/${task._id}`
    });
  }

  /**
   * Track client addition
   */
  static async trackClientAdded(client, userId) {
    return this.track({
      type: 'client_added',
      title: 'New Client Added',
      description: `Client "${client.name}" was added to the system`,
      entityType: 'client',
      entityId: client._id,
      userId,
      link: `/clients/${client._id}`
    });
  }

  /**
   * Track project creation
   */
  static async trackProjectCreated(project, userId) {
    return this.track({
      type: 'project_created',
      title: 'New Project Created',
      description: `Project "${project.name}" was created`,
      entityType: 'project',
      entityId: project._id,
      userId,
      link: `/projects/${project._id}`
    });
  }

  /**
   * Track project milestone
   */
  static async trackProjectMilestone(project, milestone, userId) {
    return this.track({
      type: 'project_milestone',
      title: 'Project Milestone Reached',
      description: `Milestone "${milestone}" reached in project "${project.name}"`,
      entityType: 'project',
      entityId: project._id,
      userId,
      link: `/projects/${project._id}`
    });
  }

  /**
   * Track deadline updates
   */
  static async trackDeadlineUpdated(entity, entityType, userId) {
    return this.track({
      type: 'deadline_updated',
      title: 'Deadline Updated',
      description: `Deadline updated for ${entityType} "${entity.name || entity.title}"`,
      entityType,
      entityId: entity._id,
      userId,
      link: `/${entityType}s/${entity._id}`
    });
  }

  /**
   * Track document uploads
   */
  static async trackDocumentUploaded(document, userId) {
    return this.track({
      type: 'document_uploaded',
      title: 'New Document Uploaded',
      description: `Document "${document.name}" was uploaded`,
      entityType: 'document',
      entityId: document._id,
      userId,
      link: `/documents/${document._id}`
    });
  }

  /**
   * Track cron job creation
   */
  static async trackCronJobCreated(cronJob, userId) {
    return this.track({
      type: 'cronjob_created',
      title: 'New Cron Job Created',
      description: `Cron job "${cronJob.name}" was created for ${cronJob.frequency} frequency`,
      entityType: 'cronjob',
      entityId: cronJob._id,
      userId,
      link: `/cronjobs/${cronJob._id}`
    });
  }

  /**
   * Track cron job execution
   */
  static async trackCronJobExecuted(cronJob, project, userId) {
    return this.track({
      type: 'cronjob_executed',
      title: 'Cron Job Executed',
      description: `Project "${project.name}" was created from cron job "${cronJob.name}"`,
      entityType: 'cronjob',
      entityId: cronJob._id,
      userId,
      link: `/projects/${project._id}`
    });
  }
}

module.exports = ActivityTracker;