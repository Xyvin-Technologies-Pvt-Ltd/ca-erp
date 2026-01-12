const mongoose = require("mongoose");
const PresetProject = require("../models/PresetProject");
const Project = require("../models/Project");
const Task = require("../models/Task");

exports.createPresetProject = async (req, res) => {
  try {
    const { name, description, levels, tasks } = req.body;

    if (!name || !levels?.length || !tasks?.length) {
      return res.status(400).json({
        success: false,
        message: "Name, levels and tasks are required",
      });
    }

    const normalizedLevels = levels.map((lvl, index) => ({
      levelIndex: index,
      department:
        typeof lvl.department === "string"
          ? lvl.department
          : lvl.department?.name,
    }));

    const preset = await PresetProject.create({
      name,
      description,
      levels: normalizedLevels,
      tasks,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: preset,
    });
  } catch (error) {
    console.error("Create Preset Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPresetProjects = async (req, res) => {
  try {
    const presents = await PresetProject.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select(" name description levels tasks createdAt ");

    res.json({ success: true, data: presents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.getPresetProjectById = async (req, res) => {
  try {
    const preset = await PresetProject.findById(req.params.id);
    console.log("PRESET LEVELS 👉", JSON.stringify(preset.levels, null, 2));
    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset project not found",
      });
    }

    res.json({ success: true, data: preset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.updatePresetProject = async (req, res) => {
  try {
    const preset = await PresetProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset project not found",
      });
    }

    res.json({ success: true, data: preset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.applyPresetToProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { projectData, tasks } = req.body;
    const presetId = req.params.id;

    const preset = await PresetProject.findById(presetId).session(session);
    if (!preset) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    /* ============ CREATE PROJECT ============ */

    const [project] = await Project.create(
      [
        {
          ...projectData,
          levels: preset.levels,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    /* ============ CREATE TASKS ============ */

    const tasksToCreate = tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      levelIndex: task.levelIndex,
      assignedTo: task.assignedTo,
      department: task.department,
      dueDate: task.dueDate,
      amount: task.amount,
      tags: task.tags || [],
      project: project._id,
      status: "pending",
      isPresetPending: true,
      createdBy: req.user._id,
    }));

    await Task.insertMany(tasksToCreate, { session });

    /* ============ COMMIT ============ */

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      projectId: project._id,
      message: "Preset applied successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Apply Preset Failed:", error);

    res.status(500).json({
      success: false,
      message: `Failed to apply preset. All changes rolled back. Error: ${error.message}`,
      error: error.toString()
    });
  }
};