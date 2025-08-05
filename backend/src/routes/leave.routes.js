const express = require("express");
const router = express.Router();
const {
  getAllLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  reviewLeave,
  getLeaveStats,
  getAllMyLeaves,
  casualLeaveAvailable,
} = require("../controllers/leave.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/stats").get(getLeaveStats);
router.route("/casualLeaveAvailable").get(casualLeaveAvailable);
router.route("/").get(getAllLeaves).post(createLeave);
router.route("/my").get(getAllMyLeaves);
router.route("/:id").get(getLeave).patch(updateLeave).delete(deleteLeave);
router.route("/:id/review").patch(reviewLeave);

module.exports = router;
