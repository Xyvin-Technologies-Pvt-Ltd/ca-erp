const express = require("express");
const router = express.Router();

const {
  createPresetProject,
  getPresetProjects,
  getPresetProjectById,
  updatePresetProject,
  applyPresetToProject,
} = require("../controllers/presetProject.controller");

const { protect, authorize } = require("../middleware/auth");

// Admin & Manager only
router.use(protect, authorize("admin", "manager"));

router.post("/", createPresetProject);
router.get("/", getPresetProjects);
router.get("/:id", getPresetProjectById);
router.put("/:id", updatePresetProject);
router.post("/:id/apply", applyPresetToProject);


module.exports = router;