const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalSign: {
      type: Number,
    },

    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      times: [Date],
      device: {
        type: String,
        enum: ["Web", "Mobile", "Biometric"],
      },
      // ipAddress: String
    },
    checkOut: {
      times: [Date],
      device: {
        type: String,
        enum: ["Web", "Mobile", "Biometric"],
      },
      // ipAddress: String
    },
    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Half-Day",
        "Late",
        "Early-Leave",
        "Holiday",
        "On-Leave",
        "Day-Off",
      ],
      required: true,
    },
    workHours: {
      type: Number,
      default: 0,
      set: (v) => (Number.isNaN(v) ? 0 : v), // 👈 replaces NaN with 0 automatically
    },
    workMinutes: {
      type: Number,
      default: 0,
      set: (v) => (Number.isNaN(v) ? 0 : v), // 👈 replaces NaN with 0 automatically
    },
    lateHours: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    overtime: {
      hours: {
        type: Number,
        default: 0,
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvalDate: Date,
    },
    breaks: [
      {
        startTime: Date,
        endTime: Date,
        duration: Number,
        type: {
          type: String,
          enum: ["Lunch", "Tea", "Other"],
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        name: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night"],
      required: true,
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    isWeekend: {
      type: Boolean,
      default: false,
    },
    isLeave: {
      type: Boolean,
      default: false,
    },
    leaveType: {
      type: String,
      enum: ["Other", "Sick", "Casual", "Emergency", "Exam", "Paid"],
      required: function () {
        return this.isLeave === true;
      },
    },
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      required: function () {
        return this.isLeave === true;
      },
    },
    sequence: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.pre("save", async function (next) {
  try {
    const model = mongoose.model("Attendance");
    await model.collection.dropIndexes();
  } catch (error) {
    console.log("No indexes to drop or already dropped");
  }
  next();
});

attendanceSchema.index(
  {
    employee: 1,
    date: 1,
    status: 1,
    isDeleted: 1,
  },
  {
    background: true,
    name: "attendance_query_index",
  }
);
attendanceSchema.index(
  {
    date: 1,
    isDeleted: 1,
  },
  {
    background: true,
    name: "attendance_date_index",
  }
);
attendanceSchema.index(
  {
    employee: 1,
    isDeleted: 1,
  },
  {
    background: true,
    name: "attendance_employee_index",
  }
);
attendanceSchema.index(
  {
    status: 1,
    isDeleted: 1,
  },
  {
    background: true,
    name: "attendance_status_index",
  }
);

attendanceSchema.pre("save", function (next) {
  if (this.isLeave) {
    this.workHours = 0;
    return next();
  }
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    const totalBreakDuration = this.breaks.reduce((total, breakItem) => {
      if (breakItem.startTime && breakItem.endTime) {
        return (
          total +
          (new Date(breakItem.endTime) - new Date(breakItem.startTime)) /
            (1000 * 60 * 60)
        );
      }
      return total;
    }, 0);
    this.workHours =
      (checkOutTime - checkInTime) / (1000 * 60 * 60) - totalBreakDuration;
    this.workHours = Math.round(this.workHours * 100) / 100;
  }
  next();
});

attendanceSchema.pre("save", function (next) {
  if (this.isLeave) {
    return next();
  }
  if (this.checkIn && this.checkOut && this.checkIn.time > this.checkOut.time) {
    throw new Error("Check-out time cannot be before check-in time");
  }
  next();
});

attendanceSchema.statics.isCheckedIn = async function (employeeId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendance = await this.findOne({
    employee: employeeId,
    date: today,
    isLeave: false,
    "checkIn.time": { $exists: true },
    "checkOut.time": { $exists: false },
  }).sort({ createdAt: -1 });
  return !!attendance;
};

module.exports = mongoose.model("Attendance", attendanceSchema);
