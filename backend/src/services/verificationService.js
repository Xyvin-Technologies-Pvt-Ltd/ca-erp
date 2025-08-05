const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { logger } = require('../utils/logger');
const Notification = require('../models/Notification');
const websocketService = require('../utils/websocket');
const INCENTIVE_ON_VERIFY = 0.01;

class VerificationService {
    constructor() {
        this.currentIndex = 0;
        this.verificationStaff = [];
        this.lastUpdate = null;
    }

    /**
     * Get all verification staff members
     */
    async getVerificationStaff() {
        try {
            const staff = await User.find({ verificationStaff: true, status: 'active' })
                .select('_id name email role')
                .sort('name');
            
            this.verificationStaff = staff;
            this.lastUpdate = Date.now();
            
            return staff;
        } catch (error) {
            logger.error('Error fetching verification staff:', error);
            throw error;
        }
    }

    /**
     * Get next verification staff member using round-robin, excluding those already assigned to project tasks
     */
    async getNextVerificationStaff(projectId = null) {
        try {
            if (!this.lastUpdate || Date.now() - this.lastUpdate > 300000) {
                await this.getVerificationStaff();
            }

            if (this.verificationStaff.length === 0) {
                logger.warn('No verification staff members found');
                return null;
            }

            let availableStaff = [...this.verificationStaff];

            if (projectId) {
                try {
                    const projectTasks = await Task.find({ 
                        project: projectId, 
                        deleted: { $ne: true },
                        assignedTo: { $exists: true, $ne: null }
                    }).select('assignedTo');

                    const assignedUserIds = [...new Set(projectTasks.map(task => task.assignedTo.toString()))];

                    availableStaff = this.verificationStaff.filter(staff => 
                        !assignedUserIds.includes(staff._id.toString())
                    );

                    logger.info(`Project ${projectId}: ${assignedUserIds.length} users already assigned, ${availableStaff.length} verification staff available`);
                } catch (error) {
                    logger.error('Error filtering verification staff for project:', error);
                    availableStaff = [...this.verificationStaff];
                }
            }

            if (availableStaff.length === 0) {
                logger.warn(`No available verification staff for project ${projectId} - all staff members were already assigned to project tasks`);
                return null;
            }

            let staffMember = null;
            let attempts = 0;
            const maxAttempts = this.verificationStaff.length;

            while (!staffMember && attempts < maxAttempts) {
                const nextStaff = this.verificationStaff[this.currentIndex];
                this.currentIndex = (this.currentIndex + 1) % this.verificationStaff.length;

                const isAvailable = availableStaff.some(staff => staff._id.toString() === nextStaff._id.toString());
                
                if (isAvailable) {
                    staffMember = nextStaff;
                }

                attempts++;
            }

            if (staffMember) {
                logger.info(`Assigned verification task to: ${staffMember.name} (${staffMember._id}) for project ${projectId}`);
            } else {
                logger.warn(`No available verification staff found after ${attempts} attempts for project ${projectId}`);
            }

            return staffMember;
        } catch (error) {
            logger.error('Error getting next verification staff:', error);
            throw error;
        }
    }

    /**
     * Check if all tasks in a project are completed
     */
    async areAllTasksCompleted(projectId) {
        try {
            const tasks = await Task.find({ 
                project: projectId, 
                deleted: { $ne: true } 
            });

            if (tasks.length === 0) {
                return false; 
            }

            const allCompleted = tasks.every(task => task.status === 'completed');
            
            if (allCompleted) {
                logger.info(`All tasks completed for project ${projectId}`);
            }

            return allCompleted;
        } catch (error) {
            logger.error('Error checking if all tasks are completed:', error);
            throw error;
        }
    }

    /**
     * Check if verification task already exists for the project
     */
    async verificationTaskExists(projectId) {
        try {
            const existingTask = await Task.findOne({
                project: projectId,
                title: 'Project Verification Task',
                deleted: { $ne: true }
            });

            return !!existingTask;
        } catch (error) {
            logger.error('Error checking if verification task exists:', error);
            throw error;
        }
    }

    /**
     * Create verification task for a project
     */
    async createVerificationTask(projectId, createdBy) {
        try {
            // Check if verification task already exists
            const exists = await this.verificationTaskExists(projectId);
            if (exists) {
                logger.info(`Verification task already exists for project ${projectId}`);
                return null;
            }

            // Get project details
            const project = await Project.findById(projectId);
            if (!project) {
                logger.error(`Project not found: ${projectId}`);
                return null;
            }

            // Get next verification staff member, excluding those already assigned to this project
            const assignedTo = await this.getNextVerificationStaff(projectId);
            if (!assignedTo) {
                logger.error('No verification staff available for assignment');
                return null;
            }

            const verificationTask = new Task({
                title: 'Project Verification Task',
                description: `Please verify all completed tasks for project: ${project.name}`,
                project: projectId,
                assignedTo: assignedTo._id,
                status: 'pending',
                priority: 'high',
                createdBy: createdBy,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                // tags: ['verification', 'project-review']
            });

            await verificationTask.save();

            // Create notification for the assigned verification staff
            try {
                const notification = await Notification.create({
                    user: assignedTo._id,
                    sender: createdBy,
                    title: 'New Verification Task Assigned',
                    message: `You have been assigned a verification task for project: ${project.name}`,
                    type: 'VERIFICATION_TASK_ASSIGNED'
                });

                // Send WebSocket notification
                websocketService.sendToUser(assignedTo._id.toString(), {
                    type: 'notification',
                    data: {
                        _id: notification._id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        read: notification.read,
                        createdAt: notification.createdAt,
                        taskId: verificationTask._id,
                        projectId: projectId
                    }
                });

                logger.info(`Notification sent to verification staff ${assignedTo.name} for task ${verificationTask._id}`);
            } catch (notificationError) {
                logger.error('Error creating notification for verification task:', notificationError);
            }

            logger.info(`Verification task created for project ${projectId} assigned to ${assignedTo.name}`);

            return verificationTask;
        } catch (error) {
            logger.error('Error creating verification task:', error);
            throw error;
        }
    }

    /**
     * Handle task completion and create verification task if needed
     */
    async handleTaskCompletion(taskId, projectId, createdBy) {
        try {
            const allCompleted = await this.areAllTasksCompleted(projectId);
            
            if (allCompleted) {
                const verificationTask = await this.createVerificationTask(projectId, createdBy);
                
                if (verificationTask) {
                    logger.info(`Verification task created automatically for project ${projectId} after all tasks completed`);
                    return verificationTask;
                }
            }

            return null;
        } catch (error) {
            logger.error('Error handling task completion:', error);
            throw error;
        }
    }
    async handleVerificationTaskCompletion(verificationTaskId, completedBy) {
        try {
            const verificationTask = await Task.findById(verificationTaskId);
            if (!verificationTask) {
                logger.error(`Verification task not found: ${verificationTaskId}`);
                return null;
            }

            const projectId = verificationTask.project;
            
            const completedTasks = await Task.find({
                project: projectId,
                status: 'completed'
            });

            let totalVerificationIncentive = 0;
            let tasksProcessed = 0;

            for (const task of completedTasks) {
                if (task.amount && task.amount > 0) {
                    const verificationIncentive = task.amount * INCENTIVE_ON_VERIFY; 
                    // Update monthly incentive
                    const now = new Date();
                    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    await User.findByIdAndUpdate(
                        completedBy,
                        { $inc: { [`incentive.${monthKey}`]: verificationIncentive } }
                    );
                    totalVerificationIncentive += verificationIncentive;
                    tasksProcessed++;
                    logger.info(`Verification incentive ${verificationIncentive} distributed to verification staff ${completedBy} for task ${task._id}`);
                }
            }

            return { totalVerificationIncentive, tasksProcessed };
        } catch (error) {
            logger.error('Error handling verification task completion:', error);
            throw error;
        }
    }
}

module.exports = new VerificationService(); 