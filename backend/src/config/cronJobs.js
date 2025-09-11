const cron = require("node-cron");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const websocketService = require("../utils/websocket");
exports.autoAbsent = cron.schedule("45 23 * * *", async () => {
  console.log("cron job run");
  const employee = await User.find({});
  // console.log(employee,employee.length)
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  let istDate = new Date(date.getTime() + (5 * 60 + 30) * 60 * 1000);
  console.log(istDate);
  for (const record of employee) {
    console.log(record._id);
    const att = await Attendance.findOne({
      employee: record._id,
      date: istDate,
    });
    console.log(att);
    if (att === null) {
      await Attendance.create({
        employee: record._id,
        status: "Absent",
        date: istDate,

        updatedBy: record._id,
        createdBy: record._id,
        shift: "Morning",
        workHours: 0,
      });
    }
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
        sender: "67f54137ca7f2422c0e39cdb",
        title: `Reminder for Due Task`,
        message: `Reminder for Due Task ${dueTask.title}`,
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
