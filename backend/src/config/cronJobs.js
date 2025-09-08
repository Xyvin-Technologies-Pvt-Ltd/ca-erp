const cron = require("node-cron");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
exports.autoAbsent = cron.schedule("0 20  * * 0", async () => {
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
