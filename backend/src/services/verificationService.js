const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { logger } = require('../utils/logger');
const Notification = require('../models/Notification');
const websocketService = require('../utils/websocket');
const Incentive = require('../models/Incentive');
const mongoose = require('mongoose');

class VerificationService {
    constructor() {
        this.currentIndex = 0;
        this.verificationStaff = [];
        this.lastUpdate = null;
        this.projectAssignmentHistory = new Map(); // Track last assigned user per project
    }

   
    resetState() {
        this.currentIndex = 0;
        this.verificationStaff = [];
        this.lastUpdate = null;
        this.projectAssignmentHistory.clear();
        logger.info('Verification service state reset');
    }

   
    async getVerificationStaff() {
        try {
            const staff = await User.find({ verificationStaff: true, status: 'active' })
                .populate('department', 'name')
                .select('_id name email role department')
                .sort('name');
            
            this.verificationStaff = staff;
            this.lastUpdate = Date.now();
            
            logger.info(`Loaded ${staff.length} verification staff members`);
            return staff;
        } catch (error) {
            logger.error('Error fetching verification staff:', error);
            throw error;
        }
    }

    
    async getNextVerificationStaff(projectId = null) {
        try {
            // Get project details to find department
            const project = await Project.findById(projectId)
                .populate('team', 'department position')
                .populate('department', 'name');
            
            if (!project) {
                logger.error(`Project not found: ${projectId}`);
                return null;
            }

            // Get all users already assigned to this project's tasks
            const projectTasks = await Task.find({ 
                project: projectId, 
                deleted: { $ne: true },
                assignedTo: { $exists: true, $ne: null }
            }).select('assignedTo');

            const projectAssignedUsers = [...new Set(projectTasks.map(task => task.assignedTo.toString()))];
            logger.info(`Project ${projectId}: ${projectAssignedUsers.length} users already assigned to project tasks`);

            // Get project department from project itself or team members
            const projectDepartmentId = project.department ? project.department._id.toString() : null;
            
            // If project doesn't have department, get departments from team members
            let projectDepartmentIds = [];
            if (projectDepartmentId) {
                projectDepartmentIds = [projectDepartmentId];
            } else {
                const projectTeamMembers = await User.find({ 
                    _id: { $in: project.team } 
                }).select('department');
                
                projectDepartmentIds = [...new Set(projectTeamMembers
                    .map(member => member.department ? member.department.toString() : null)
                    .filter(Boolean)
                )];
            }

            logger.info(`Project ${projectId} department IDs: ${projectDepartmentIds.join(', ')}`);

            // Get ALL active staff for department filtering
            const allActiveStaff = await User.find({ status: 'active' })
                .populate('department', 'name')
                .select('_id name email department role workType verificationStaff')
                .limit(200);

            // PRIORITY 1: Same Department + Verification Enabled + Not involved in project
            const priority1Staff = allActiveStaff.filter(staff => {
                const staffDeptId = staff.department ? staff.department._id.toString() : null;
                const isSameDepartment = projectDepartmentIds.includes(staffDeptId);
                const isVerificationEnabled = staff.verificationStaff === true;
                const notInProject = !projectAssignedUsers.includes(staff._id.toString());
                return isSameDepartment && isVerificationEnabled && notInProject;
            });

            if (priority1Staff.length > 0) {
                const selected = this.selectFromAvailableStaff(priority1Staff, projectId);
                logger.info(`PRIORITY 1: Assigned to same department + verification enabled staff: ${selected.name}`);
                return selected;
            }

            // PRIORITY 2: Same Department + Any Staff + Not involved in project (verification status doesn't matter)
            const priority2Staff = allActiveStaff.filter(staff => {
                const staffDeptId = staff.department ? staff.department._id.toString() : null;
                const isSameDepartment = projectDepartmentIds.includes(staffDeptId);
                const notInProject = !projectAssignedUsers.includes(staff._id.toString());
                return isSameDepartment && notInProject;
            });

            if (priority2Staff.length > 0) {
                const selected = this.selectFromAvailableStaff(priority2Staff, projectId);
                logger.info(`PRIORITY 2: Assigned to same department staff: ${selected.name}`);
                return selected;
            }

            // If no same department staff available, return null (cannot assign to other departments)
            logger.warn(`No same department staff available for verification task in project ${projectId}`);
            return null;

        } catch (error) {
            logger.error('Error getting next verification staff:', error);
            throw error;
        }
    }

    // Helper method for staff selection with rotation
    selectFromAvailableStaff(availableStaff, projectId) {
        if (availableStaff.length === 0) return null;

        const lastAssignedUserId = this.projectAssignmentHistory.get(projectId);
        
        // Try to assign to someone different than last time
        if (lastAssignedUserId && availableStaff.length > 1) {
            const differentStaff = availableStaff.find(staff => 
                staff._id.toString() !== lastAssignedUserId
            );
            if (differentStaff) {
                this.projectAssignmentHistory.set(projectId, differentStaff._id.toString());
                return differentStaff;
            }
        }

        // Round-robin selection
        const selectedIndex = this.currentIndex % availableStaff.length;
        const selectedStaff = availableStaff[selectedIndex];
        this.currentIndex = (this.currentIndex + 1) % availableStaff.length;
        
        this.projectAssignmentHistory.set(projectId, selectedStaff._id.toString());
        return selectedStaff;
    }

   
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

            // Get next verification staff member (only from same department)
            const assignedTo = await this.getNextVerificationStaff(projectId);
            if (!assignedTo) {
                logger.error('No same department staff available for verification assignment');
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

            try {
                let senderUser = null;
                try {
                    senderUser = await User.findById(createdBy).select('name email');
                } catch (_) {
                }

                const notification = await Notification.create({
                    user: assignedTo._id,
                    sender: createdBy,
                    title: `New Task Assigned: Project Verification Task`,
                    message: `You have been assigned a verification task for project: ${project.name}`,
                    type: 'TASK_ASSIGNED'
                });

                websocketService.sendToUser(assignedTo._id.toString(), {
                    type: 'notification',
                    data: {
                        _id: notification._id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        read: notification.read,
                        createdAt: notification.createdAt,
                        sender: senderUser
                            ? { _id: createdBy, name: senderUser.name, email: senderUser.email }
                            : { _id: createdBy },
                        taskId: verificationTask._id,
                        taskNumber: verificationTask.taskNumber,
                        priority: verificationTask.priority,
                        status: verificationTask.status,
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
                    const verificationIncentivePercentage = task.verificationIncentivePercentage || 1; 
                    const verificationIncentive = task.amount * (verificationIncentivePercentage / 100); 
                    // Update monthly incentive
                    const now = new Date();
                    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    await User.findByIdAndUpdate(
                        completedBy,
                        { $inc: { [`incentive.${monthKey}`]: verificationIncentive } }
                    );
                    await Incentive.create({
                        userId: completedBy,
                        taskId: task._id,
                        projectId: task.project,
                        taskAmount: task.amount,
                        incentiveAmount: verificationIncentive,
                        date: now,
                        incentiveType: 'Verification'
                    });
                    totalVerificationIncentive += verificationIncentive;
                    tasksProcessed++;
                    logger.info(`Verification incentive ${verificationIncentive} (${verificationIncentivePercentage}%) distributed to verification staff ${completedBy} for task ${task._id}`);
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