const cron = require("node-cron");
const moment = require("moment-timezone");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const websocketService = require("../utils/websocket");
exports.autoAbsent = cron.schedule("45 23 * * *", async () => {
  try {
    console.log("autoAbsent cron job run");

    const activeEmployees = await User.find({ status: "active" }).select(
      "_id"
    );

    if (!activeEmployees.length) {
      console.log("No active employees found for autoAbsent");
      return;
    }

    const istNow = moment().tz("Asia/Kolkata");
    const istStart = istNow.clone().startOf("day");
    const istEnd = istNow.clone().endOf("day");

    const utcStart = istStart.clone().utc().toDate();
    const utcEnd = istEnd.clone().utc().toDate();

    const attendanceRecords = await Attendance.find({
      employee: { $in: activeEmployees.map((emp) => emp._id) },
      date: { $gte: utcStart, $lt: utcEnd },
      isDeleted: { $ne: true },
    }).select("employee");

    const presentEmployeeIds = new Set(
      attendanceRecords.map((record) => record.employee.toString())
    );

    const absentRecords = activeEmployees
      .filter((emp) => !presentEmployeeIds.has(emp._id.toString()))
      .map((emp) => ({
        employee: emp._id,
        status: "Absent",
        date: utcStart,
        shift: "Morning",
        totalSign: 0,
        lateHours: 0,
        lateMinutes: 0,
        workHours: 0,
        workMinutes: 0,
        checkIn: {
          times: [],
          device: "System",
          ipAddress: "System",
        },
        checkOut: {
          times: [],
          device: "System",
        },
        createdBy: emp._id,
        updatedBy: emp._id,
        notes: "Auto-marked absent - No check-in recorded",
      }));

    if (absentRecords.length > 0) {
      await Attendance.insertMany(absentRecords);
      console.log(
        `autoAbsent created ${absentRecords.length} absent records for ${istStart.format("YYYY-MM-DD")}`
      );
    } else {
      console.log("autoAbsent found no missing attendance records");
    }
  } catch (error) {
    console.error("autoAbsent cron job error:", error);
  }
});
exports.updateCasualLeaveCount = cron.schedule("0 0 1 * *", async () => {
  console.log("Cron job running on the 1st of every month at 12:00 AM 🚀");
  const users = await User.find({});
  for (const user of users) {
    if (user.emp_status === "Permanent") {
      await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(user._id) },
        { $inc: { casual: 1 } }
      );
    }
  }
});

exports.remindDuetask = cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Cron job running on every day at 2:00 AM 🚀");
    const today = new Date();
    const tomorrow = new Date(today);
    const tomorrowEnd = new Date(today);
    // move to tomorrow
    tomorrow.setDate(today.getDate() + 1);
    tomorrowEnd.setDate(today.getDate() + 1);

    // reset time to 00:00:00.000
    tomorrow.setHours(0, 0, 0, 0);
    tomorrowEnd.setHours(23, 59, 59, 999);
    let istDate = new Date(tomorrow.getTime() + (5 * 60 + 30) * 60 * 1000);
    let endofTommorow = new Date(
      tomorrowEnd.getTime() + (5 * 60 + 30) * 60 * 1000
    );
    console.log(istDate);
    console.log(endofTommorow);
    const dueTasks = await Task.find({
      dueDate: {
        $gte: istDate,
        $lte: endofTommorow,
      },
    });
    console.log(dueTasks.length);
    for (const dueTask of dueTasks) {
      console.log(123);
      const notification = await Notification.create({
        user: dueTask.assignedTo,
        sender: dueTask.createdBy,
        title: `Reminder for Due Task`,
        message: `Reminder for Due Task - ${dueTask.title}`,
        type: "Due_Task",
      });
      console.log(notification);
      websocketService.sendToUser(dueTask.assignedTo.toString(), {
        type: "notification",
        data: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: "TASK DUE",
          createdAt: "67f54137ca7f2422c0e39cdb",
          sender: {
            _id: "67f54137ca7f2422c0e39cdb",
            name: "ADMIN",
            email: "admin@gmail.com",
          },
          leaveId: notification._id,
        },
      });
      console.log("DONE");
    }
  } catch (error) {
    console.log(error);
  }
});

exports.markOverdueTasks = cron.schedule("5 0 * * *", async () => {
  try {
    console.log("Overdue task cron running...");

    // Current time 
    const now = new Date();

    const result = await Task.updateMany(
      {
        dueDate: { $lt: now },

        // Only tasks that are still active
        status: { $nin: ["completed", "cancelled", "overdue"] },

        // Important: do this only once
        wasOverdue: { $ne: true },
      },
      {
        $set: {
          status: "overdue",
          wasOverdue: true,
        },
      }
    );

    console.log(
      `Overdue cron completed. Tasks marked overdue: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Error in overdue cron job:", error);
  }
});