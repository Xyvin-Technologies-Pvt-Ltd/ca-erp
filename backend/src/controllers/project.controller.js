const Project = require("../models/Project");
const Task = require("../models/Task");
const Client = require("../models/Client");
const User = require("../models/User")
const Department = require("../models/department.model")
const Invoice = require("../models/Invoice");
const { ErrorResponse } = require("../middleware/errorHandler");
const { logger } = require("../utils/logger");
const ActivityTracker = require("../utils/activityTracker");
const mongoose = require('mongoose');

const updateProjectTeamFromTasks = async (projectId) => {
  try {
    const tasks = await Task.find({
      project: projectId,
      deleted: { $ne: true },
    }).populate("assignedTo", "_id name email");

    const assigneeIds = [
      ...new Set(
        tasks
          .filter((task) => task.assignedTo && task.assignedTo._id)
          .map((task) => task.assignedTo._id.toString())
      ),
    ];

    await Project.findByIdAndUpdate(projectId, {
      team: assigneeIds,
    });


    logger.info(
      `Updated project team for project ${projectId} with ${assigneeIds.length} members`
    );
  } catch (error) {
    logger.error(
      `Error updating project team for project ${projectId}: ${error.message}`
    );
    throw error;
  }
};

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    console.log("OK<VINU", req.query)
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // If limit is -1 or very large number, don't apply limit
    const shouldLimit = limit > 0 && limit <= 100;
    const startIndex = shouldLimit ? (page - 1) * limit : 0;
    const endIndex = shouldLimit ? page * limit : undefined;

    // Filtering
    const filter = { deleted: { $ne: true } };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.client) {
      filter.client = req.query.client;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    if (req.query.project) {
      filter._id = req.query.project
    }
    if (req.user.role === "staff") {
      const userId = new mongoose.Types.ObjectId(req.user._id);

      filter.$or = [
        { "assignedTo.user": userId }, // Matches user inside assignedTo array of objects
        { team: userId }               // Matches user inside team array
      ];
    }
    const total = await Project.countDocuments(filter);
    console.log(total)
    console.log(filter)
    const clients = await Client.find({});
    // If user is not admin, only show projects they are assigned to
    // if (req.user.role !== 'admin' && req.user.role !== 'finance' && req.user.role !== 'manager' ) {
    //     filter.assignedTo = req.user.id;
    // }

    // Search
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Sort
    const sort = {};
    if (req.query.sort) {
      const fields = req.query.sort.split(",");
      fields.forEach((field) => {
        if (field.startsWith("-")) {
          sort[field.substring(1)] = -1;
        } else {
          sort[field] = 1;
        }
      });
    } else {
      sort.createdAt = -1;
    }

    const raw = await Project.find(filter);
    console.log("RAW PROJECTS:", raw.map(p => ({ id: p._id, assignedTo: p.assignedTo })));

    // Query with filters and sort
    let query = Project.find(filter)
      .sort(sort)
      .populate({
        path: "client",
      })
      .populate({
        path: "team",
        model: "User",
        select: "name email role department avatar",
      })
      .populate({
        path: "assignedTo.user",
        select: "name email avatar",
      })
      .populate({
        path: "assignedTo.department",
        select: "name",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "documents",
        select: "name fileUrl category uploadedBy createdAt deleted",
        populate: {
          path: "uploadedBy",
          select: "name email",
        },
      });
    // Apply pagination only if limit is specified
    if (shouldLimit) {
      query = query.skip(startIndex).limit(limit);
    }

    const projects = await query;

    if (req.query.includeInvoiceStatus) {
      const projectsWithInvoiceStatus = await Promise.all(
        projects.map(async (project) => {
          const projectObj = project.toObject();

          // First check if the project already has an invoiceStatus
          if (project.invoiceStatus === "Created") {
            projectObj.invoiceStatus = "Created";
          } else {
            // If not, check for invoice in the Invoice collection
            const invoice = await Invoice.findOne({
              items: {
                $elemMatch: {
                  projectId: project._id,
                },
              },
            });

            projectObj.invoiceStatus = invoice ? "Created" : "Not Created";

            if (invoice && project.invoiceStatus !== "Created") {
              await Project.findByIdAndUpdate(project._id, {
                invoiceStatus: "Created",
              });
            }
          }

          // Calculate budget for this project
          const taskIds = project.tasks || [];
          const activeTasks = await Task.find({
            _id: { $in: taskIds },
            deleted: { $ne: true },
          });

          const totalAmount = activeTasks.reduce(
            (sum, task) => sum + (task.amount || 0),
            0
          );
          await Project.findByIdAndUpdate(project._id, { amount: totalAmount });

          projectObj.amount = totalAmount;

          return projectObj;
        })
      );
      const pagination = {};

      if (endIndex < total) {
        pagination.next = {
          page: page + 1,
          limit,
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit,
        };
      }
      const data = {
        success: true,
        count: projectsWithInvoiceStatus.length,
        pagination,
        total,
        projects: projectsWithInvoiceStatus,
      };

      return res.status(200).json(data);
    }

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskIds = project.tasks || [];

        const activeTasks = await Task.find({
          _id: { $in: taskIds },
          deleted: { $ne: true },
        });

        const totalTasks = activeTasks.length;

        let completedTasks = 0;

        if (totalTasks > 0) {
          completedTasks = activeTasks.filter(
            (task) => task.status === "completed"
          ).length;
        }

        let completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        if (
          completionPercentage == 100 &&
          (!project.invoiceStatus ||
            project.invoiceStatus !== "Created" ||
            !project.paymentStatus ||
            project.paymentStatus !== "Fully Paid")
        ) {
          completionPercentage = 99;
        }

        const projectObj = project.toObject();
        projectObj.totalTasks = totalTasks;
        projectObj.completedTasks = completedTasks;
        projectObj.completionPercentage = completionPercentage;

        return projectObj;
      })
    );

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      pagination,
      total,
      clients,
      data: projectsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: "client",
      })
      .populate({
        path: "team",
        model: "User",
        select: "name email role department avatar",
      })
      .populate({
        path: "assignedTo.user",
        select: "name email avatar",
      })
      .populate({
        path: "assignedTo.department",
        select: "name",
      })
      .populate({
        path: "createdBy",
        select: "name email avatar",
      })
      .populate({
        path: "documents",
        match: { deleted: false },
        select: "name fileUrl category uploadedBy createdAt deleted",
        populate: {
          path: "uploadedBy",
          select: "name email",
        },
      })
      .populate({
        path: "notes.author",
        select: "name email role avatar",
      });

    if (!project || project.deleted) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
      );
    }

    // Update team from tasks
    await updateProjectTeamFromTasks(project._id);

    const projectObject = project.toObject();
    const taskIds = project.tasks;

    const activeTasks = await Task.find({
      _id: { $in: taskIds },
      deleted: { $ne: true },
    });
    console.log("ASSIGNED TO =>", project.assignedTo);
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(
      (t) => t.status === "completed"
    ).length;

    let completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    if (
      completionPercentage === 100 &&
      project.invoiceStatus !== "Created" &&
      project.paymentStatus !== "Fully Paid"
    ) {
      completionPercentage = 99;
    }

    projectObject.totalTasks = totalTasks;
    projectObject.completedTasks = completedTasks;
    projectObject.completionPercentage = completionPercentage;

    const totalAmount = activeTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    await Project.findByIdAndUpdate(project._id, { amount: totalAmount });

    projectObject.amount = totalAmount;

    res.status(200).json({
      success: true,
      data: projectObject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    // Remove budget if present in payload
    if ("amount" in req.body) {
      delete req.body.amount;
    }
    // Check if client exists
    if (req.body.client) {
      const client = await Client.findById(req.body.client);
      if (!client) {
        return next(
          new ErrorResponse(
            `Client not found with id of ${req.body.client}`,
            404
          )
        );
      }
    }

    // Validate assignedTo mapping (levels)
    if (!Array.isArray(req.body.assignedTo) || req.body.assignedTo.length === 0) {
      return next(new ErrorResponse("At least one assignment level required", 400));
    }

    req.body.assignedTo = req.body.assignedTo.map((pair, index) => ({
      ...pair,
      levelIndex: index,
    }));

    // Validate assignedTo pairs
    for (const pair of req.body.assignedTo) {
      const dept = await Department.findById(pair.department);
      if (!dept)
        return next(new ErrorResponse(`Department not found: ${pair.department}`, 404));

      const usr = await User.findById(pair.user);
      if (!usr)
        return next(new ErrorResponse(`User not found: ${pair.user}`, 404));
    }


    // Generate project number if not provided
    if (!req.body.projectNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");

      const lastProject = await Project.findOne({}).sort({ createdAt: -1 });

      let sequence = "001";
      if (lastProject && lastProject.projectNumber) {
        const lastNumber = lastProject.projectNumber.split("-")[2];
        if (lastNumber) {
          sequence = (parseInt(lastNumber) + 1).toString().padStart(3, "0");
        }
      }

      req.body.projectNumber = `PRJ-${year}${month}-${sequence}`;
    }

    // Force starting department level to 0
    req.body.currentLevelIndex = 0;

    // Ensure assignedTo is used 
    const { assignedTo, ...rest } = req.body;

    // Collect all assigned users and add to team
    const assignedUserIds = assignedTo.map(a => a.user);
    // Merge with existing team
    const initialTeam = req.body.team || [];
    // Combine and deduplicate
    const team = [...new Set([...initialTeam, ...assignedUserIds, req.user.id])];


    const project = await Project.create({
      ...rest,
      assignedTo,
      team,
      currentLevelIndex: 0,
    });

    // Log the project creation
    logger.info(
      `Project created: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`
    );
    // Track activity
    try {
      await ActivityTracker.trackProjectCreated(project, req.user._id);
      logger.info(`Activity tracked for project creation ${project._id}`);
    } catch (activityError) {
      logger.error(
        `Failed to track activity for project creation ${project._id}: ${activityError.message}`
      );
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    logger.info(
      `Starting project update for ID: ${req.params.id} by user: ${req.user.name} (${req.user._id})`
    );

    let project = await Project.findById(req.params.id);
    if (!project) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
      );
    }

    const currentLevelIndex = project.currentLevelIndex;
    const currentLevel = project.assignedTo[currentLevelIndex];

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    const isCurrentLevelUser =
      currentLevel?.user?.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isCurrentLevelUser) {
      return next(
        new ErrorResponse(
          "You are not allowed to update this project at this stage.",
          403
        )
      );
    }

    if ("currentLevelIndex" in req.body) {
      delete req.body.currentLevelIndex;
    }

    if (isCurrentLevelUser && !isAdmin && !isManager) {
      // They can update description, status (inside dept), notes, etc.
      const forbidden = ["assignedTo", "departments", "client", "budget", "priority"];

      forbidden.forEach((field) => {
        if (field in req.body) delete req.body[field];
      });
    }

    // Validate assignedTo 
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return next(new ErrorResponse("assignedTo must be an array", 400));
      }

      req.body.assignedTo = req.body.assignedTo.map((pair, index) => ({
        ...pair,
        levelIndex: index,
      }));

      // Validate departments & users
      for (const pair of req.body.assignedTo) {
        const deptExists = await Department.findById(pair.department);
        const userExists = await User.findById(pair.user);
      }
    }

    // Existing logic for validation (client, notes, etc.)

    if (req.body.client) {
      const client = await Client.findById(req.body.client);
      if (!client) {
        return next(
          new ErrorResponse(
            `Client not found with id of ${req.body.client}`,
            404
          )
        );
      }
    }

    if (req.body.notes && Array.isArray(req.body.notes)) {
      req.body.notes = req.body.notes.map((note) => ({
        ...note,
        author: req.user._id,
        createdAt: note.createdAt || new Date(),
      }));
    }

    // Save changes
    const originalProject = project.toObject();

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "client",
        select: "name contactName contactEmail contactPhone",
      })
      .populate({
        path: "assignedTo.user",
        select: "name email avatar",
      })
      .populate({
        path: "assignedTo.department",
        select: "name",
      });

    logger.info(
      `Project updated: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`
    );

    // Track activity
    const changedFields = Object.keys(req.body);
    if (changedFields.length > 0) {
      const changesSummary = changedFields
        .map((field) => {
          const oldValue = JSON.stringify(originalProject[field]);
          const newValue = JSON.stringify(req.body[field]);
          return `${field}: ${oldValue} → ${newValue}`;
        })
        .join(", ");

      await ActivityTracker.track({
        type: "project_updated",
        title: "Project Updated",
        description: `Project "${project.name}" updated: ${changesSummary}`,
        entityType: "project",
        entityId: project._id,
        userId: req.user._id,
        link: `/projects/${project._id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    logger.error(`Project update error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if project has associated tasks
    const taskCount = await Task.countDocuments({ project: req.params.id });
    if (taskCount > 0) {
      return next(
        new ErrorResponse(
          `Cannot delete project with ${taskCount} associated tasks`,
          400
        )
      );
    }

    // Log the project deletion
    logger.info(
      `Project deleted: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`
    );

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project tasks
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
exports.getProjectTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
      );
    }

    const currentLevel = project.currentLevelIndex;
    const currentLevelInfo = project.assignedTo[currentLevel];

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";

    let userDepartment = req.user.department?.toString();
    let allowedDepartment = currentLevelInfo?.department?.toString();

    const isTeamMember =
      project.team &&
      project.team.some(
        (teamMember) => teamMember.toString() === req.user.id.toString()
      );

    // Global project access (admin, manager, team)
    if (!isAdmin && !isTeamMember && !isManager) {
      return next(
        new ErrorResponse("User not authorized to access this project", 403)
      );
    }

    // Department-based Level Restriction
    // Admin and manager can see everything, skip check
    if (!isAdmin && !isManager) {
      if (userDepartment !== allowedDepartment) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: "Your department cannot view tasks until your level begins.",
        });
      }
    }

    // Filtering
    const filter = { project: req.params.id, deleted: false };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, priority: -1 })
      .populate("assignedTo", "name email avatar")
      .populate("department", "name")
      .populate({
        path: "createdBy",
        select: "name email",
      });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project status
 * @route   PUT /api/projects/:id/status
 * @access  Private
 */
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Assuming status is passed in the request body

    // Check if the status is valid (you can add additional checks here)
    const validStatuses = ["Not Started", "In Progress", "Completed"];
    if (!validStatuses.includes(status)) {
      return next(new ErrorResponse("Invalid status value", 400));
    }

    // Find project by ID
    let project = await Project.findById(id);

    if (!project) {
      return next(new ErrorResponse(`Project not found with id of ${id}`, 404));
    }

    // Check if the user is authorized to update the project (admin or assigned user)

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    const isTeamMember =
      project.team &&
      Array.isArray(project.team) &&
      project.team.some(
        (teamMember) =>
          teamMember && teamMember.toString() === req.user.id.toString()
      );

    if (!isAdmin && !isTeamMember && !isManager) {
      return next(
        new ErrorResponse("User not authorized to access this project", 403)
      );
    }
    // Update the project status
    project.status = status;

    // Save the updated project
    project = await project.save();

    // Log the project status update
    logger.info(
      `Project status updated: ${project.name} (${project._id}) to ${status} by ${req.user.name} (${req.user._id})`
    );

    // Send success response
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invoiceNumber, invoiceDate } = req.body;

    const project = await Project.findByIdAndUpdate(
      id,
      {
        status: "completed", // Keep it as completed
        invoiceStatus: "Created",
        invoiceNumber,
        invoiceDate,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "client",
      select: "name contactName contactEmail contactPhone",
    });

    if (!project) {
      return next(new ErrorResponse(`Project not found with id of ${id}`, 404));
    }

    // Log the invoice status update
    logger.info(
      `Project invoice status updated: ${project.name} (${project._id}) by ${req.user.name}`
    );

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

exports.advanceProjectLevel = async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project)
    return next(new ErrorResponse("Project not found", 404));

  const current = project.currentLevelIndex;

  // Only admin, manager, or verification user of current level can move forward
  const currentLevel = project.assignedTo[current];
  const isCurrentUser =
    currentLevel.user.toString() === req.user._id.toString();

  if (!["admin", "manager"].includes(req.user.role) && !isCurrentUser) {
    return next(new ErrorResponse("Unauthorized", 403));
  }

  // Check if all tasks of this level are completed
  const pending = await Task.countDocuments({
    project: project._id,
    levelIndex: current,
    status: { $ne: "completed" },
    deleted: false
  });

  if (pending > 0)
    return next(new ErrorResponse("Complete all tasks first", 400));

  // Move to next level or invoice
  if (current + 1 < project.assignedTo.length) {
    project.currentLevelIndex++;
    await project.save();
    return res.json({ success: true, message: "Moved to next level" });
  }

  // Last level completed → move to invoice process
  project.status = "completed";
  await project.save();

  res.json({ success: true, message: "Project completed. Move to invoice." });
};
