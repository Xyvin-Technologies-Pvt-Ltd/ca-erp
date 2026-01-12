const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Employee = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const { createError } = require("../utils/errors");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
moment.tz.setDefault("UTC");



const clampToWorkingBand = (date) => {
  const d = new Date(date);

  const start = new Date(d);
  start.setHours(8, 30, 0, 0); // 8:30 AM

  const end = new Date(d);
  end.setHours(18, 0, 0, 0); // 6:00 PM

  if (d < start) return start;
  if (d > end) return end;
  return d;
};

const calculateWorkHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return { hour: 0, minute: 0 };

  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return { hour: 0, minute: 0 };

  const validStart = clampToWorkingBand(checkIn);
  const validEnd = clampToWorkingBand(checkOut);

  if (validEnd <= validStart) return { hour: 0, minute: 0 };

  let durationMs = validEnd - validStart;
  let totalMinutes = Math.floor(durationMs / (1000 * 60));

  // Deduct 45 minutes mandatory break if working
  if (totalMinutes > 0) {
    totalMinutes -= 45;
  }

  // Ensure no negative work time
  if (totalMinutes < 0) totalMinutes = 0;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hour: hours,
    minute: minutes,
  };
};


exports.getAllAttendance = catchAsync(async (req, res) => {
  const {
    startDate,
    endDate,
    employeeId,
    departmentId,
    page = 1,
    limit = 10,
    employeeName,
    specificDate,
  } = req.query;

  console.log("getAllAttendance called with params:", {
    startDate,
    endDate,
    employeeId,
    departmentId,
    page,
    limit,
    employeeName,
    specificDate,
  });

  let query = { isDeleted: false };

  // Handle date filtering: specificDate takes precedence
  if (specificDate) {
    // If specific date is provided, use it instead of date range
    const specificDateTime = moment
      .tz(specificDate + "T00:00:00", "Asia/Kolkata")
      .toDate();
    const specificEndDateTime = moment
      .tz(specificDate + "T23:59:59", "Asia/Kolkata")
      .toDate();

    console.log("Specific date query:", {
      specificDateTime,
      specificEndDateTime,
    });

    query.date = {
      $gte: specificDateTime,
      $lte: specificEndDateTime,
    };
  } else if (startDate && endDate) {
    const startDateTime = moment.tz(startDate + "T00:00:00", "Asia/Kolkata").toDate();
    const endDateTime = moment.tz(endDate + "T23:59:59", "Asia/Kolkata").toDate();

    console.log("Date range query:", { startDateTime, endDateTime });

    query.date = {
      $gte: startDateTime,
      $lte: endDateTime,
    };
  } else {
    // Default to current month if no date filters provided
    const now = moment.tz("Asia/Kolkata");
    const startOfMonth = now.clone().startOf("month").toDate();
    const endOfMonth = now.clone().endOf("month").toDate();

    query.date = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };
  }

  // Employee filtering logic
  let employeeQueryIds = [];
  let employeeFilterApplied = false;

  if (employeeId) {
    // If specific employee ID is provided, use it directly
    query.employee = employeeId;
  } else {
    // Handle department and employee name filtering
    if (departmentId) {
      const departmentEmployees = await Employee.find({
        department: departmentId,
      }).select("_id");
      employeeQueryIds = departmentEmployees.map((emp) => emp._id);
      employeeFilterApplied = true;
    }

    if (employeeName && employeeName.trim()) {
      const nameSearchRegex = new RegExp(employeeName.trim(), "i");
      const nameFilter = {
        $or: [
          { name: nameSearchRegex },
          { firstName: nameSearchRegex },
          { lastName: nameSearchRegex },
        ],
      };

      let nameFilteredEmployees = await Employee.find(nameFilter).select("_id");
      let nameFilteredIds = nameFilteredEmployees.map((emp) => emp._id);

      if (employeeFilterApplied) {
        // If both department and name filters are applied, intersect the results
        employeeQueryIds = employeeQueryIds.filter((id) =>
          nameFilteredIds.includes(id)
        );
      } else {
        // Only name filter is applied
        employeeQueryIds = nameFilteredIds;
        employeeFilterApplied = true;
      }
    }

    // Apply the employee filter if any filtering was applied
    if (employeeFilterApplied) {
      if (employeeQueryIds.length > 0) {
        query.employee = { $in: employeeQueryIds };
      } else {
        // No employees match the combined filters, return empty result
        return res.status(200).json({
          status: "success",
          results: 0,
          data: { attendance: [] },
          total: 0,
          page: parseInt(page, 10),
          totalPages: 0,
        });
      }
    }
  }

  console.log("Final query:", JSON.stringify(query, null, 2));

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [attendance, total] = await Promise.all([
    Attendance.find(query)
      .populate({
        path: "employee",
        select: "name firstName lastName department position",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .sort("-date")
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Attendance.countDocuments(query),
  ]);

  console.log("Found attendance records:", attendance.length);

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: { attendance },
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
});
exports.getSearchedAttendance = catchAsync(async (req, res) => {
  console.log(req.body);
});
exports.getAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName department position",
    populate: [
      { path: "department", select: "name" },
      { path: "position", select: "title" },
    ],
  });

  if (!attendance) {
    throw createError(404, "No attendance record found with that ID");
  }

  res.status(200).json({
    status: "success",
    data: { attendance },
  });
});

exports.createBulkAttendance = catchAsync(async (req, res) => {
  const attendanceRecords = req.body;
  console.log(req.body);
  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    throw createError(400, "Please provide an array of attendance records");
  }
  for (const record of attendanceRecords) {
    console.log("RUN");
    console.log(record.checkOut);
    const userAttendance = await Attendance.findOne({
      employee: new mongoose.Types.ObjectId(record.employee),
      date: record.date,
    });
    console.log(userAttendance);
    if (userAttendance) {
      if (record?.checkOut === undefined) {
        console.log("HIII");
        console.log(new Date(record.checkIn.time));
        console.log(
          userAttendance?.checkOut.times[
          userAttendance?.checkOut.times.length - 1
          ]
        );


        const workHours = calculateWorkHours(
          record.checkIn.time,
          userAttendance?.checkOut.times[
          userAttendance?.checkOut.times.length - 1
          ]
        );

        console.log(workHours);


        await Attendance.updateOne(
          {
            employee: new mongoose.Types.ObjectId(record.employee),
            date: record.date,
          }, // filter
          {
            $set: {
              "checkIn.times": [record.checkIn.time],
              status: record.status,
              notes: record.notes,
              shift: record.shift,
              ...(arrivalStatus ? { arrivalStatus } : {}),
            },
          }
        );
        // res.status(201).json({
        //   status: "success",
        // });
      } else {
        console.log("done");
        console.log(new Date(record.checkOut.time));
        console.log(userAttendance?.checkIn.times[0]);

        const workHours = calculateWorkHours(
          userAttendance?.checkIn.times[0],
          new Date(record.checkOut.time)
        );
        console.log(workHours);
        await Attendance.updateOne(
          {
            employee: new mongoose.Types.ObjectId(record.employee),
            date: record.date,
          }, // filter
          {
            $set: {
              "checkOut.times": [record.checkOut.time],
              status: record.status,
              notes: record.notes,
              workHours: workHours.hour,
              workMinutes: workHours.minute,
              shift: record.shift,
            },
          }
        );
        // res.status(201).json({
        //   status: "success",
        // });
      }
    } else {
      if (record?.checkOut === undefined) {

        await Attendance.create({
          employee: record.employee,
          date: record.date,
          totalSign: 0,
          lateHours: 0,
          lateMinutes: 0,
          checkIn: {
            times: [record.checkIn.time],
            device: "Web",
            ipAddress: "OK",
          },
          status: record.status,
          notes: record.notes,
          shift: record.shift,
          workHours: 0, // Initialize work hours as 0
          workMinutes: 0,
          ...(arrivalStatus ? { arrivalStatus } : {}),
          createdBy: req.user._id,
          updatedBy: req.user._id,
        });
        // res.status(201).json({
        //   status: "success",
        // });
      } else {
        await Attendance.create({
          employee: record.employee,
          date: record.date,
          totalSign: 0,
          lateHours: 0,
          lateMinutes: 0,
          checkIn: {
            times: [record.checkOut.time],
            device: "Web",
            ipAddress: "OK",
          },
          status: record.present,
          notes: record.notes,
          shift: record.shift,
          workHours: 0, // Initialize work hours as 0
          workMinutes: 0,
          createdBy: req.user._id,
          updatedBy: req.user._id,
        });
        // res.status(201).json({
        //   status: "success",
        // });
      }
    }
  }
  res.status(201).json({
    status: "success",
  });
  return;
  for (const record of attendanceRecords) {
    console.log(record.checkOut);
    const userAttendance = await Attendance.findOne({
      employee: new mongoose.Types.ObjectId(record.employee),
      date: record.date,
    });
    if (userAttendance) {
      if (record?.checkOut === undefined) {
        await Attendance.updateOne(
          {
            employee: new mongoose.Types.ObjectId(record.employee),
            date: record.date,
          }, // filter
          {
            $set: {
              "checkIn.times": [record.checkIn.time],
              status: record.status,
              notes: record.notes,
              shift: record.shift,
            },
          }
        );
        res.status(201).json({
          status: "success",
        });
      } else {
        console.log("done");
        await Attendance.updateOne(
          {
            employee: new mongoose.Types.ObjectId(record.employee),
            date: record.date,
          }, // filter
          {
            $set: {
              "checkOut.times": [record.checkOut.time],
              status: record.status,
              notes: record.notes,
              shift: record.shift,
            },
          }
        );
        res.status(201).json({
          status: "success",
        });
      }
    } else {
      if (record?.checkOut === undefined) {
        await Attendance.create({
          employee: record.employee,
          date: record.date,
          totalSign: 0,
          lateHours: 0,
          lateMinutes: 0,
          checkIn: {
            times: [record.checkIn.time],
            device: "Web",
            ipAddress: "OK",
          },
          status: record.status,
          notes: record.notes,
          shift: record.shift,
          workHours: 0, // Initialize work hours as 0
          workMinutes: 0,
          createdBy: req.user._id,
          updatedBy: req.user._id,
        });
        res.status(201).json({
          status: "success",
        });
      } else {
        await Attendance.create({
          employee: record.employee,
          date: record.date,
          totalSign: 0,
          lateHours: 0,
          lateMinutes: 0,
          checkIn: {
            times: [record.checkOut.time],
            device: "Web",
            ipAddress: "OK",
          },
          status: record.present,
          notes: record.notes,
          shift: record.shift,
          workHours: 0, // Initialize work hours as 0
          workMinutes: 0,
          createdBy: req.user._id,
          updatedBy: req.user._id,
        });
        res.status(201).json({
          status: "success",
        });
      }
    }
  }
  res.status(201).json({
    status: "success",
  });
  return;

  attendanceRecords.forEach((record, index) => {
    if (!record.employee) {
      throw createError(
        400,
        `Employee ID is required for record at index ${index}`
      );
    }
    if (!record.date) {
      throw createError(400, `Date is required for record at index ${index}`);
    }

    const date = moment.tz(record.date, "UTC");
    if (!date.isValid()) {
      throw createError(
        400,
        `Invalid date format for record at index ${index}`
      );
    }
  });

  const employeeIds = [
    ...new Set(attendanceRecords.map((record) => record.employee)),
  ];

  if (employeeIds.length === 0) {
    throw createError(400, "No valid employee IDs provided");
  }

  const employees = await Employee.find({
    _id: { $in: employeeIds },
  }).select("_id status");

  if (employees.length !== employeeIds.length) {
    throw createError(400, "One or more employees not found");
  }

  const inactiveEmployees = employees.filter((emp) => emp.status !== "active");
  if (inactiveEmployees.length > 0) {
    throw createError(
      400,
      `Found ${inactiveEmployees.length} inactive employee(s)`
    );
  }

  const results = [];
  const errors = [];

  for (const record of attendanceRecords) {
    try {
      // Parse date using moment in UTC timezone
      let attendanceDate;
      if (record.date instanceof Date) {
        attendanceDate = moment.tz(record.date, "UTC").startOf("day").toDate();
      } else if (typeof record.date === "string") {
        // If it's a YYYY-MM-DD string, parse it as UTC date
        attendanceDate = moment.tz(record.date, "UTC").startOf("day").toDate();
      } else {
        attendanceDate = moment.tz(record.date, "UTC").toDate();
      }

      const existingAttendance = await Attendance.findOne({
        employee: record.employee,
        date: attendanceDate,
      });

      if (existingAttendance) {
        if (
          record.checkOut &&
          !["Holiday", "On-Leave"].includes(record.status)
        ) {
          const checkInTime = existingAttendance.checkIn?.time;
          let checkOutTime;

          if (record.checkOut.time instanceof Date) {
            // Extract time components and apply to the attendance date
            const checkOutMoment = moment.tz(record.checkOut.time, "UTC");
            const hours = checkOutMoment.hours();
            const minutes = checkOutMoment.minutes();
            const seconds = checkOutMoment.seconds();

            checkOutTime = moment
              .tz(attendanceDate, "UTC")
              .hours(hours)
              .minutes(minutes)
              .seconds(seconds)
              .toDate();
          } else {
            // Parse ISO string and convert to UTC
            checkOutTime = moment.tz(record.checkOut.time, "UTC").toDate();
          }

          // Calculate work hours
          const workHours = calculateWorkHours(checkInTime, checkOutTime);

          const updatedAttendance = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            {
              $set: {
                checkOut: {
                  time: checkOutTime,
                  device: record.checkOut.device || "Web",
                  ipAddress: record.checkOut.ipAddress,
                },
                workHours,
                status: determineStatus(checkInTime, checkOutTime, workHours),
                updatedBy: req.user._id,
              },
            },
            { new: true }
          ).populate({
            path: "employee",
            select: "firstName lastName department position",
            populate: [
              { path: "department", select: "name" },
              { path: "position", select: "title" },
            ],
          });

          results.push(updatedAttendance);
          continue;
        }
      }

      const attendanceData = {
        employee: record.employee,
        date: attendanceDate,
        status: record.status || "Present",
        notes: record.notes,
        shift: record.shift || "Morning",
        workHours: 0,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      };

      if (!["Holiday", "On-Leave"].includes(record.status)) {
        let checkInTime;

        if (record.checkIn?.time) {
          if (record.checkIn.time instanceof Date) {
            // Extract time components from the Date object
            const checkInMoment = moment.tz(record.checkIn.time, "UTC");
            const hours = checkInMoment.hours();
            const minutes = checkInMoment.minutes();
            const seconds = checkInMoment.seconds();

            // Create check-in time using the attendance date and extracted time
            checkInTime = moment
              .tz(attendanceDate, "UTC")
              .hours(hours)
              .minutes(minutes)
              .seconds(seconds)
              .toDate();
          } else {
            // This path is taken for ISO string from frontend
            // Parse the ISO string and convert to UTC
            checkInTime = moment.tz(record.checkIn.time, "UTC").toDate();
          }
        } else {
          checkInTime = new Date();
        }

        if (isNaN(checkInTime.getTime())) {
          throw createError(400, "Invalid check-in time format");
        }

        attendanceData.checkIn = {
          time: checkInTime,
          device: record.checkIn?.device || "Web",
          ipAddress: record.checkIn?.ipAddress,
        };
      } else {
        attendanceData.isHoliday = record.status === "Holiday";
        attendanceData.notes =
          record.notes || `Not checked in - ${record.status}`;
      }

      const newAttendance = await Attendance.create(attendanceData);

      const populatedAttendance = await Attendance.findById(
        newAttendance._id
      ).populate({
        path: "employee",
        select: "firstName lastName department position",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      });

      results.push(populatedAttendance);
    } catch (error) {
      errors.push({
        employee: record.employee,
        error: error.message,
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: "partial_success",
      message: `Created ${results.length} records, ${errors.length} failed`,
      data: { results, errors },
    });
  }

  res.status(201).json({
    status: "success",
    results: results.length,
    data: { results },
  });
});

// const calculateWorkHours = (checkInTime, checkOutTime) => {
//   if (!checkInTime || !checkOutTime) return 0;

//   const checkIn = new Date(checkInTime);
//   const checkOut = new Date(checkOutTime);

//   if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
//     return 0;
//   }

//   if (checkOut <= checkIn) {
//     return 0;
//   }

//   const diffInHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
//   return Math.max(0, Math.round(diffInHours * 100) / 100); // Round to 2 decimal places, ensure non-negative
// };

exports.createAttendance = catchAsync(async (req, res) => {
<<<<<<< HEAD
  const { now, location } = req.body;
  console.log("User location at check-in:", location);

  // Convert to IST
  function getISTParts(date) {
    const fmt = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    return {
      isthour: Number(parts.find((p) => p.type === "hour").value),
      istminute: Number(parts.find((p) => p.type === "minute").value),
    };
  }

  const today = new Date(now);
  const { isthour, istminute } = getISTParts(today);

  // Determine arrival status
  let arrivalStatus = "On-Time";
  let attendanceStatus = "Present";

  if (isthour < 9 || (isthour === 9 && istminute === 0)) {
    arrivalStatus = "Early-Logged";
    attendanceStatus = "Present";
  } else if (isthour === 9 && istminute > 0 && istminute <= 15) {
    arrivalStatus = "Late-Logged";
    attendanceStatus = "Late";
  } else if (
    (isthour === 9 && istminute > 15) ||
    (isthour === 10 && istminute === 0)
  ) {
    arrivalStatus = "Late-Logged";
    attendanceStatus = "Half-Day";
  } else if (isthour > 10 || (isthour === 10 && istminute > 0)) {
    arrivalStatus = "Late-Logged";
    attendanceStatus = "Absent";
  }

  // Convert UTC to IST (+5:30)
  const offset530 = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(today.getTime() + offset530);

  // Format date as YYYY-MM-DD
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  // Check if attendance already exists
  const existing = await Attendance.findOne({
=======
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  let attendance = await Attendance.findOne({
>>>>>>> testing
    employee: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    isDeleted: false,
  });

<<<<<<< HEAD
  if (existing) {
    // Add new check-in time + update arrival
    await Attendance.updateOne(
      { employee: req.user._id, date: formattedDate },
      {
        $push: { "checkIn.times": istDate },
        $set: {
          totalSign: (existing?.totalSign || 0) + 1,
          arrivalStatus,
        },
      }
    );
  } else {
    // Create new attendance 
    const attendanceData = {
      employee: req.user._id,
      date: formattedDate,
      totalSign: 1,
      checkIn: {
        times: [istDate],
        device: "Web",
        ipAddress: req.ip,
        location,
      },
      status: attendanceStatus,
      arrivalStatus,
      shift: "Morning",
      workHours: 0,
      notes: "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    await Attendance.create(attendanceData);
  }

  res.status(201).json({
    status: "success",
    location,
=======
  // If already exists → push check-in
  if (attendance) {
    attendance.checkIn.times.push(now);
    attendance.status = "Present";
    attendance.updatedBy = req.user._id;
    await attendance.save();

    return res.status(200).json({
      status: "success",
      message: "Check-in recorded",
    });
  }

  // First check-in of the day
  await Attendance.create({
    employee: req.user._id,
    date: startOfDay,
    checkIn: {
      times: [now],
      device: "Web",
    },
    checkOut: {
      times: [],
      device: "Web",
    },
    status: "Present",
    workHours: 0,
    workMinutes: 0,
    shift: "Morning",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    message: "Check-in created",
>>>>>>> testing
  });
});

exports.checkOut = catchAsync(async (req, res) => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    isDeleted: false,
  });

  if (!attendance || attendance.checkIn.times.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "No check-in found for today",
    });
  }

  attendance.checkOut.times.push(now);
  attendance.updatedBy = req.user._id;

  await attendance.save(); // Model hook handles calculations and status

  res.status(200).json({
    status: "success",
    message: "Checked out successfully",
    data: {
      workHours: attendance.workHours,
      workMinutes: attendance.workMinutes,
      status: attendance.status
    },
  });
});

const determineStatus = (checkInTime, checkOutTime, workHours) => {
  const fullDayHours = 8;
  const halfDayHours = 4;

  if (workHours >= fullDayHours) {
    return "Present";
  } else if (workHours >= halfDayHours) {
    return "Half-Day";
  } else if (workHours > 0) {
    return "Early-Leave";
  } else {
    return "Absent";
  }
};

exports.deleteAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw createError(404, "No attendance record found with that ID");
  }

  attendance.isDeleted = true;
  await attendance.save();

  res.status(200).json({
    status: "success",
    message: "Attendance record deleted successfully",
  });
});

exports.getAttendanceStats = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;

  try {
    const validStartDate = startDate
      ? moment.tz(startDate + "T00:00:00", "UTC").toDate()
      : new Date();
    validStartDate.setHours(0, 0, 0, 0);

    const validEndDate = endDate
      ? moment.tz(endDate + "T23:59:59", "UTC").toDate()
      : new Date();
    validEndDate.setHours(23, 59, 59, 999);

    if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
      throw createError(400, "Invalid date format provided");
    }

    let employeeQuery = { status: "active" };
    if (departmentId) {
      employeeQuery.department = departmentId;
    }
    const totalEmployees = await Employee.countDocuments(employeeQuery);
    const employees = await Employee.find(employeeQuery).select("_id");
    const employeeIds = employees.map((emp) => emp._id);

    let baseMatchStage = {
      isDeleted: false,
      employee: { $in: employeeIds },
    };

    let currentPeriodMatch = {
      ...baseMatchStage,
      date: {
        $gte: validStartDate,
        $lte: validEndDate,
      },
    };

    const currentPeriodStats = await Attendance.aggregate([
      {
        $match: currentPeriodMatch,
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: "$employeeDetails",
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          uniqueEmployees: { $addToSet: "$employee" },
          totalWorkHours: { $sum: "$workHours" },
          records: {
            $push: {
              _id: "$_id",
              date: "$date",
              employee: "$employeeDetails",
              checkIn: "$checkIn",
              checkOut: "$checkOut",
              status: "$status",
              workHours: "$workHours",
            },
          },
        },
      },
    ]);

    const prevPeriodStart = new Date(validStartDate);
    prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
    prevPeriodStart.setHours(0, 0, 0, 0);

    const prevPeriodEnd = new Date(validEndDate);
    prevPeriodEnd.setMonth(prevPeriodEnd.getMonth() - 1);
    prevPeriodEnd.setHours(23, 59, 59, 999);

    let prevPeriodMatch = {
      ...baseMatchStage,
      date: {
        $gte: prevPeriodStart,
        $lte: prevPeriodEnd,
      },
    };

    const prevPeriodStats = await Attendance.aggregate([
      {
        $match: prevPeriodMatch,
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: "$employeeDetails",
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          uniqueEmployees: { $addToSet: "$employee" },
          totalWorkHours: { $sum: "$workHours" },
        },
      },
    ]);

    const processedStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      earlyLeave: 0,
      onLeave: 0,
      holiday: 0,
      dayOff: 0,
      totalWorkHours: 0,
      records: [],
    };

    currentPeriodStats.forEach((stat) => {
      if (!stat._id) return;

      switch (stat._id) {
        case "Present":
          processedStats.present = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Absent":
          processedStats.absent = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Late":
          processedStats.late = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Half-Day":
          processedStats.halfDay = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Early-Leave":
          processedStats.earlyLeave = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "On-Leave":
          processedStats.onLeave = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Holiday":
          processedStats.holiday = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case "Day-Off":
          processedStats.dayOff = stat.count;
          processedStats.records.push(...stat.records);
          break;
      }
      processedStats.totalWorkHours += stat.totalWorkHours || 0;
    });

    const prevStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      earlyLeave: 0,
      onLeave: 0,
      holiday: 0,
      dayOff: 0,
      totalWorkHours: 0,
    };

    prevPeriodStats.forEach((stat) => {
      if (!stat._id) return;
      switch (stat._id) {
        case "Present":
          prevStats.present = stat.count;
          break;
        case "Absent":
          prevStats.absent = stat.count;
          break;
        case "Late":
          prevStats.late = stat.count;
          break;
        case "Half-Day":
          prevStats.halfDay = stat.count;
          break;
        case "Early-Leave":
          prevStats.earlyLeave = stat.count;
          break;
        case "On-Leave":
          prevStats.onLeave = stat.count;
          break;
        case "Holiday":
          prevStats.holiday = stat.count;
          break;
        case "Day-Off":
          prevStats.dayOff = stat.count;
          break;
      }
      prevStats.totalWorkHours += stat.totalWorkHours || 0;
    });

    const calculateChange = (currentValue, prevValue) => {
      if (prevValue === 0) return currentValue > 0 ? "+100%" : "0%";
      const change = ((currentValue - prevValue) / prevValue) * 100;
      return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    };

    const changes = {
      present: calculateChange(processedStats.present, prevStats.present),
      absent: calculateChange(processedStats.absent, prevStats.absent),
      late: calculateChange(processedStats.late, prevStats.late),
      halfDay: calculateChange(processedStats.halfDay, prevStats.halfDay),
      earlyLeave: calculateChange(
        processedStats.earlyLeave,
        prevStats.earlyLeave
      ),
      onLeave: calculateChange(processedStats.onLeave, prevStats.onLeave),
      holiday: calculateChange(processedStats.holiday, prevStats.holiday),
      dayOff: calculateChange(processedStats.dayOff, prevStats.dayOff),
      totalWorkHours: calculateChange(
        processedStats.totalWorkHours,
        prevStats.totalWorkHours
      ),
    };

    // Get previous month's employee count
    const prevMonthTotalEmployees = await Employee.countDocuments({
      ...employeeQuery,
      updatedAt: { $lte: prevPeriodEnd },
    });

    // Sort records by date
    processedStats.records.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      status: "success",
      data: {
        stats: processedStats,
        totalEmployees,
        changes: {
          ...changes,
          employees: calculateChange(totalEmployees, prevMonthTotalEmployees),
        },
        dateRange: {
          current: {
            startDate: validStartDate.toISOString(),
            endDate: validEndDate.toISOString(),
          },
          previous: {
            startDate: prevPeriodStart.toISOString(),
            endDate: prevPeriodEnd.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error("Stats calculation error:", error);
    throw error;
  }
});

exports.updateAttendance = catchAsync(async (req, res) => {
  const { date, checkIn, checkOut, status, notes, shift } = req.body;
  console.log(req.body);
  const attendance = await Attendance.findById(req.params.id);
  // console.log(attendance);
  let checkIndate = new Date(req.body.checkIn.time);
  let checkOutdate;
  console.log(req.body.checkOut);
  if (req.body.checkOut !== undefined) {
    checkOutdate = new Date(req.body.checkOut.time);
  }

  checkIndate.setHours(checkIndate.getHours() + 5);
  checkIndate.setMinutes(checkIndate.getMinutes() + 30);
  if (req.body.checkOut !== undefined) {
    checkOutdate.setHours(checkOutdate.getHours() + 5);
    checkOutdate.setMinutes(checkOutdate.getMinutes() + 30);
    console.log(checkIndate, checkOutdate);
  }
  if (!attendance) {
    throw createError(404, "No attendance record found with that ID");
  }

  // Calculate work hours if both checkIn and checkOut are provided
  let workHours = attendance.workHours;
  if (checkOutdate && checkOutdate) {
    const checkInTime = new Date(checkIn.time);
    const checkOutTime = new Date(checkOut.time);
    workHours = calculateWorkHours(checkInTime, checkOutTime);
    console.log(workHours);
  }
  await Attendance.updateOne(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
      date: date,
    }, // filter
    {
      $set: {
        "checkIn.times": [checkIndate],
        "checkOut.times": [checkOutdate],
        status: status || attendance.status,
        notes: notes !== undefined ? notes : attendance.notes,
        shift: shift || attendance.shift,
        workHours: workHours.hour,
        workMinutes: workHours.minute,
        // Recompute arrivalStatus from check-in in IST for updates too
        arrivalStatus: (() => {
          try {
            if (!checkIndate) return attendance.arrivalStatus;
            const fmt = new Intl.DateTimeFormat("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            const parts = fmt.formatToParts(checkIndate);
            const h = Number(parts.find((p) => p.type === "hour").value);
            const m = Number(parts.find((p) => p.type === "minute").value);
            if (h < 9 || (h === 9 && m === 0)) return "Early-Logged";
            if (h > 9 || (h === 9 && m > 15)) return "Late-Logged";
            return "On-Time";
          } catch (_) {
            return attendance.arrivalStatus;
          }
        })(),
      },
    }
  );

  res.status(200).json({
    status: "success",
  });
  return;
  if (!attendance) {
    throw createError(404, "No attendance record found with that ID");
  }

  // Calculate work hours if both checkIn and checkOut are provided
  // let workHours = attendance.workHours;
  if (checkIn?.time && checkOut?.time) {
    const checkInTime = new Date(checkIn.time);
    const checkOutTime = new Date(checkOut.time);
    workHours = calculateWorkHours(checkInTime, checkOutTime);
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      date: date
        ? moment.tz(date, "UTC").startOf("day").toDate()
        : attendance.date,
      checkIn: checkIn
        ? {
          time: checkIn.time
            ? moment.tz(checkIn.time, "UTC").toDate()
            : attendance.checkIn.time,
          device: checkIn.device || "Web",
          ipAddress: checkIn.ipAddress,
        }
        : attendance.checkIn,
      checkOut: checkOut
        ? {
          time: checkOut.time
            ? moment.tz(checkOut.time, "UTC").toDate()
            : attendance.checkOut.time,
          device: checkOut.device || "Web",
          ipAddress: checkOut.ipAddress,
        }
        : attendance.checkOut,
      status: status || attendance.status,
      notes: notes !== undefined ? notes : attendance.notes,
      shift: shift || attendance.shift,
      workHours,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate({
    path: "employee",
    select: "firstName lastName department position",
    populate: [
      { path: "department", select: "name" },
      { path: "position", select: "title" },
    ],
  });

  res.status(200).json({
    status: "success",
    data: { attendance: updatedAttendance },
  });
});

// Get employee attendance by date range
exports.getEmployeeAttendance = catchAsync(async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query;
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    console.log(startDate, endDate);

    const updatedDoc = await Attendance.find({
      employee: new mongoose.Types.ObjectId(req.user._id),
      date: { $gte: startDate, $lt: endDate },
      isDeleted: { $ne: true },
    });
    console.log(updatedDoc);
    let lateHours = 0;
    let lateMinutes = 0;
    let totalMinutes = 0;
    for (let i = 0; i < updatedDoc.length; i++) {
      totalMinutes = updatedDoc[i].lateMinutes;
      lateHours = updatedDoc[i].lateHours;
      let hours = Math.floor(totalMinutes / 60); // whole hours
      if (hours > 0) {
        lateHours = lateHours + hours;
        totalMinutes = totalMinutes % 60; // leftover minutes
      }
    }
    const overallStates = {
      total: updatedDoc.length,
      present: updatedDoc.filter((a) => a.status === "Present").length,
      absent: updatedDoc.filter((a) => a.status === "Absent").length,
      late: updatedDoc.filter((a) => a.status === "Late").length,
      halfDay: updatedDoc.filter((a) => a.status === "Half-Day").length,
      earlyLeave: updatedDoc.filter((a) => a.status === "Early-Leave").length,
      onLeave: updatedDoc.filter((a) => a.status === "On-Leave").length,
    };
    res.status(200).json({
      status: "success",
      data: {
        lateHours,
        totalMinutes,
        attendance: updatedDoc,
        overallStates,
      },
    });
    return;
    // Get employee ID from user object
    let employeeId;

    // If user has department, they are an Employee model instance
    if (req.user.department) {
      employeeId = req.user._id;
    } else {
      // Try to find associated employee by email
      const employee = await Employee.findOne({ email: req.user.email });
      if (!employee) {
        return next(createError(404, "No employee record found for this user"));
      }
      employeeId = employee._id;
    }

    let query = {
      employee: employeeId,
      isDeleted: false,
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      // Create dates in local timezone to avoid timezone conversion issues
      const startDateTime = moment.tz(startDate + "T00:00:00", "UTC").toDate();
      const endDateTime = moment.tz(endDate + "T23:59:59", "UTC").toDate();

      // Set hours to ensure the full day is covered in the local timezone
      startDateTime.setHours(0, 0, 0, 0);
      endDateTime.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: "employee",
        select: "firstName lastName department position email",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .sort("-date")
      .lean();

    // Get employee details
    const employeeDetails = attendance[0]?.employee || null;

    // Calculate overall statistics
    const overallStats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "Present").length,
      absent: attendance.filter((a) => a.status === "Absent").length,
      late: attendance.filter((a) => a.status === "Late").length,
      halfDay: attendance.filter((a) => a.status === "Half-Day").length,
      earlyLeave: attendance.filter((a) => a.status === "Early-Leave").length,
      onLeave: attendance.filter((a) => a.status === "On-Leave").length,
      totalWorkHours: Number(
        attendance
          .reduce((sum, record) => sum + (record.workHours || 0), 0)
          .toFixed(2)
      ),
      averageWorkHours: Number(
        (
          attendance.reduce((sum, record) => sum + (record.workHours || 0), 0) /
          (attendance.length || 1)
        ).toFixed(2)
      ),
    };

    // Format attendance records with proper date strings
    const formattedAttendance = attendance.map((record) => ({
      ...record,
      date: moment.tz(record.date, "UTC").toISOString(),
      checkIn: record.checkIn
        ? {
          ...record.checkIn,
          time: record.checkIn.time
            ? moment.tz(record.checkIn.time, "UTC").toISOString()
            : null,
        }
        : null,
      checkOut: record.checkOut
        ? {
          ...record.checkOut,
          time: record.checkOut.time
            ? moment.tz(record.checkOut.time, "UTC").toISOString()
            : null,
        }
        : null,
      monthYear: moment
        .tz(record.date, "UTC")
        .toLocaleString("default", { month: "long", year: "numeric" }),
    }));

    // Group by month for statistics
    const monthlyStats = formattedAttendance.reduce((acc, record) => {
      const monthYear = record.monthYear;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          earlyLeave: 0,
          onLeave: 0,
          totalWorkHours: 0,
          averageWorkHours: 0,
        };
      }

      acc[monthYear].total++;
      acc[monthYear][record.status.toLowerCase()] =
        (acc[monthYear][record.status.toLowerCase()] || 0) + 1;
      acc[monthYear].totalWorkHours += record.workHours || 0;
      acc[monthYear].averageWorkHours = Number(
        (acc[monthYear].totalWorkHours / acc[monthYear].total).toFixed(2)
      );

      return acc;
    }, {});

    res.status(200).json({
      status: "success",
      data: {
        employee: employeeDetails,
        attendance: formattedAttendance,
        monthlyStats,
        overallStats,
        dateRange: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error("Error in getEmployeeAttendance:", error);
    return next(createError(500, "Error retrieving attendance records"));
  }
});

// Get attendance records by employee ID
exports.getAttendanceByEmployeeId = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate, status } = req.query;

  // Build query
  let query = {
    employee: employeeId,
    isDeleted: false,
  };

  // Add date range filter if provided
  if (startDate && endDate) {
    // Create dates in local timezone to avoid timezone conversion issues
    const startDateTime = moment.tz(startDate + "T00:00:00", "UTC").toDate();
    const endDateTime = moment.tz(endDate + "T23:59:59", "UTC").toDate();

    // Set hours to ensure the full day is covered in the local timezone
    startDateTime.setHours(0, 0, 0, 0);
    endDateTime.setHours(23, 59, 59, 999);

    query.date = {
      $gte: startDateTime,
      $lte: endDateTime,
    };
  }

  // Add status filter if provided
  if (status) {
    query.status = status;
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: "employee",
      select: "firstName lastName department position",
      populate: [
        { path: "department", select: "name" },
        { path: "position", select: "title" },
      ],
    })
    .sort("-date");

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "Present").length,
    absent: attendance.filter((a) => a.status === "Absent").length,
    late: attendance.filter((a) => a.status === "Late").length,
    halfDay: attendance.filter((a) => a.status === "Half-Day").length,
    earlyLeave: attendance.filter((a) => a.status === "Early-Leave").length,
    onLeave: attendance.filter((a) => a.status === "On-Leave").length,
    totalWorkHours: attendance.reduce(
      (sum, record) => sum + (record.workHours || 0),
      0
    ),
  };

  res.status(200).json({
    status: "success",
    data: {
      attendance,
      stats,
    },
  });
});
