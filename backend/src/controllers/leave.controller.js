const Leave = require('../models/Leave');
const Employee = require('../models/User');
const Attendance = require('../models/Attendance');
const catchAsync = require('../utils/catchAsync');
const websocketService = require('../utils/websocket');
const Notification = require('../models/Notification');
const { createError } = require('../utils/errors');
const User = require('../models/User');

// Get all leave requests
exports.getAllLeaves = catchAsync(async (req, res) => {
  const { status, employeeId, departmentId, startDate, endDate, userId, page = 1, limit = 10 } = req.query;
  
  let query = {};
  
  // If user is not admin/manager, only show their own leaves
  // if (req.user.role !== 'admin' && req.user.role !== 'manager') {
  //   query.employee = req.user._id;
  // } else {
  //   // Status filter
  //   if (status) {
  //     query.status = status;
  //   }
    
  //   // Employee filter
  //   if (employeeId) {
  //     query.employee = employeeId;
  //   }
    
  //   // Department filter
  //   if (departmentId) {
  //     const employees = await Employee.find({ department: departmentId }).select('_id');
  //     query.employee = { $in: employees.map(emp => emp._id) };
  //   }
  // }
  
  // Date range filter
  if (startDate && endDate) {
    query.$or = [
      {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },
      {
        endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .populate({
        path: 'employee',
        select: 'name department position',
        populate: [
          { path: 'position', select: 'title' }
        ]
      })
      .populate({
        path: 'user',
        select: 'name'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Leave.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    results: leaves.length,
    data: { leaves },
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10))
  });
});
// exports.getAllMyLeaves = catchAsync(async (req, res) => {
//   const { status, employeeId, departmentId, startDate, endDate , userId} = req.query;
  
//   let query = {};
  
//   // If user is not admin/manager, only show their own leaves
//   if (req.user.role !== 'admin' && req.user.role !== 'manager') {
//     query.employee = req.user._id;
//   } else {
//     // Status filter
//     if (status) {
//       query.status = status;
//     }
    
//     // Employee filter
//     if (employeeId) {
//       query.employee = employeeId;
//     }
    
//     // Department filter
//     if (departmentId) {
//       const employees = await Employee.find({ department: departmentId }).select('_id');
//       query.employee = { $in: employees.map(emp => emp._id) };
//     }
//   }
  
//   // Date range filter
//   if (startDate && endDate) {
//     query.$or = [
//       {
//         startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
//       },
//       {
//         endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
//       }
//     ];
//   }

//   const leaves = await Leave.find(query)
//     .populate({
//       path: 'employee',
//       select: 'name department position',
//       populate: [
//         { path: 'position', select: 'title' }
//       ]
//     })
//     .populate({
//       path: 'user',
//       select: 'name'
//     })
//     .sort('-createdAt');

//   res.status(200).json({
//     status: 'success',
//     results: leaves.length,
//     data: { leaves }
//   });
// });
exports.getAllMyLeaves = catchAsync(async (req, res) => {
  const { status, startDate, endDate } = req.query;

  let query = {
    employee: req.user._id // Restrict to current user's leaves for all roles
  };

  // Status filter
  if (status) {
    query.status = status;
  }

  // Date range filter
  if (startDate && endDate) {
    query.$or = [
      {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },
      {
        endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    ];
  }

  const leaves = await Leave.find(query)
    .populate({
      path: 'employee',
      select: 'name department position',
      populate: [
        { path: 'position', select: 'title' }
      ]
    })
    .populate({
      path: 'user',
      select: 'name'
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: leaves.length,
    data: { leaves }
  });
});
// Get single leave request
exports.getLeave = catchAsync(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate({
      path: 'employee',
      select: 'name department position',
      populate: [
        { path: 'position', select: 'title' }
      ]
    })
    .populate({
      path: 'user',
      select: 'name'
    })

  if (!leave) {
    throw createError(404, 'No leave request found with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: { leave }
  });
});

// Create leave request
exports.createLeave = catchAsync(async (req, res) => {
  const { employee, type, startDate, endDate, reason, attachment, duration, leaveType, status } = req.body;

  // Check for overlapping leave requests
  const overlappingLeave = await Leave.findOne({
    employee,
    status: { $ne: 'rejected' },
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      }
    ]
  })
  .populate({
    path: 'user',
    select: 'name'
  });

  if (overlappingLeave) {
    throw createError(400, 'Employee already has a leave request for this period');
  }

  const leave = await Leave.create({
    employee,
    type,
    startDate,
    endDate,
    reason,
    attachment,
    duration,
    leaveType,
    status,
    createdBy: req.user.id
  });

  // Populate the created leave with employee details
  const populatedLeave = await Leave.findById(leave._id)
    .populate({
      path: 'employee',
      select: 'name department position',
      populate: [
        { path: 'position', select: 'title' }
      ]
    })
    .populate({
      path: 'user',
      select: 'name'
    });

  try {
    const hrUsers = await Employee.find({ role: { $regex: 'admin', $options: 'i' } }).select('_id name');

    for (const hr of hrUsers) {
      const notification = await Notification.create({
        user: hr._id,
        sender: req.user._id,
        title: `New Leave Request Submitted`,
        message: `A leave request has been submitted by ${req.user.name}`,
        type: 'LEAVE_REQUEST'
      });

      // Send real-time notification (if WebSocket connected)
      websocketService.sendToUser(hr._id.toString(), {
        type: 'notification',
        data: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          sender: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email
          },
          leaveId: leave._id
        }
      });
    }
  } catch (notificationError) {
    console.error('Failed to send HR leave request notification:', notificationError);
  }

  res.status(201).json({
    status: 'success',
    data: { leave: populatedLeave }
  });
});

// Update leave request
exports.updateLeave = catchAsync(async (req, res) => {
  const { type, startDate, endDate, reason, status, reviewNotes } = req.body;

  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { type, startDate, endDate, reason, status, reviewNotes },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'employee',
    select: 'name department position',
    populate: [
      { path: 'position', select: 'title' }
    ]
  })
  .populate({
    path: 'user',
    select: 'name'
  });

  if (!leave) {
    throw createError(404, 'No leave request found with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: { leave }
  });
});

// Delete leave request
exports.deleteLeave = catchAsync(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw createError(404, 'No leave request found with that ID');
  }

  // Only allow deletion of pending requests
  // if (leave.status !== 'pending') {
  //   throw new AppError('Can only delete pending leave requests', 400);
  // }

  await Leave.deleteOne({ _id: leave._id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Approve/Reject leave request
exports.reviewLeave = catchAsync(async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    // Validate required fields
    if (!status || !reviewNotes) {
      throw createError(400, 'Status and review notes are required');
    }

    // Normalize status to match the model's enum values
    const normalizedStatus = status.toLowerCase() === 'approved' ? 'Approved' : 'Rejected';
    
    if (!['Approved', 'Rejected'].includes(normalizedStatus)) {
      throw createError(400, 'Invalid status. Status must be either Approved or Rejected');
    }

    // Get leave with employee details
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'name department position'
      });

    if (!leave) {
      throw createError(404, 'No leave request found with that ID');
    }

    console.log('Leave request found:', {
      leaveId: leave._id,
      employeeId: leave.employee?._id,
      employeeName: leave.employee ? `${leave.employee.name}` : 'N/A',
      startDate: leave.startDate,
      endDate: leave.endDate,
      currentStatus: leave.status,
      leaveType: leave.leaveType
    });

    if (!leave.employee || !leave.employee._id) {
      throw createError(400, 'Leave request has no associated employee');
    }

    // Check if already reviewed
    if (leave.status !== 'Pending') {
      // If the status is being changed to the same value, throw error
      if (leave.status === normalizedStatus) {
        throw createError(400, `This leave request has already been ${leave.status.toLowerCase()}`);
      }
      
      // If changing from Approved to Rejected, delete any existing attendance records
      if (leave.status === 'Approved' && normalizedStatus === 'Rejected') {
        await Attendance.deleteMany({
          leaveId: leave._id,
          isLeave: true
        });
      }
    }

    // Update leave status
    leave.status = normalizedStatus;
    leave.reviewNotes = reviewNotes;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = Date.now();

    // Add to approval chain
    leave.approvalChain.push({
      approver: req.user._id,
      status: normalizedStatus,
      comment: reviewNotes,
      date: new Date()
    });

    // If approved, create attendance records
    if (normalizedStatus === 'Approved') {
      
      try {
        // Calculate date range
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw createError(400, 'Invalid leave dates');
        }

        // Set time to start and end of days
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        console.log('Processed dates:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        // Delete any existing attendance records for this leave
        await Attendance.deleteMany({
          leaveId: leave._id,
          isLeave: true
        });

        // Check for overlapping regular attendance records
        const existingAttendance = await Attendance.find({
          employee: leave.employee._id,
          isLeave: false,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        });

        if (existingAttendance.length > 0) {
          // Delete overlapping regular attendance records
          await Attendance.deleteMany({
            employee: leave.employee._id,
            isLeave: false,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          });
        }

        // Create array of dates
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }


        // Create attendance records for each day
        const createdRecords = [];
        for (const currentDate of dates) {
          try {
            // Remove unnecessary time settings since it's a leave day
            const attendanceDate = new Date(currentDate);
            attendanceDate.setHours(0, 0, 0, 0);

            
            const attendanceData = {
              employee: leave.employee._id,
              date: attendanceDate,
              status: 'On-Leave',
              notes: `${leave.leaveType} Leave - ${leave.reason || 'No reason provided'}`,
              shift: 'Morning',
              workHours: 0,
              overtime: { hours: 0, approved: false },
              isDeleted: false,
              createdBy: req.user._id,
              updatedBy: req.user._id,
              isLeave: true,
              leaveType: leave.leaveType === 'Other' ? 'Personal' : leave.leaveType,
              leaveId: leave._id,
              breaks: []
            };

            
            const attendance = await Attendance.create(attendanceData);
            console.log('Leave attendance created:', {
              id: attendance._id,
              date: attendance.date,
              status: attendance.status,
              isLeave: attendance.isLeave,
              leaveType: attendance.leaveType
            });
            
            createdRecords.push(attendance);
          } catch (err) {
            console.error('Failed to create attendance record:', {
              date: currentDate.toISOString(),
              error: err.message,
              stack: err.stack
            });
            // Delete any created records if there's an error
            if (createdRecords.length > 0) {
              await Attendance.deleteMany({
                _id: { $in: createdRecords.map(record => record._id) }
              });
            }
            throw createError(500, `Failed to create attendance record: ${err.message}`);
          }
        }

        if (createdRecords.length === 0) {
          throw createError(500, 'Failed to create any attendance records');
        }


        // Update leave duration
        leave.duration = createdRecords.length;

      } catch (error) {
        console.error('Attendance creation failed:', {
          error: error.message,
          stack: error.stack
        });
            throw createError(500, `Failed to create attendance records: ${error.message}`);
      }
    }


     await Notification.create({
      user: leave.employee._id,
      sender: req.user._id,
      title: `Leave ${normalizedStatus}`,
      message: `Your leave request from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been ${normalizedStatus.toLowerCase()} by Admin.`,
      type: 'LEAVE_REVIEW', 
      isRead: false
    });


    // Save the updated leave
    await leave.save();



    // Send Notification to the employee
   

   

    res.status(200).json({
      status: 'success',
      data: {
        leave,
        message: normalizedStatus === 'Approved' 
          ? `Leave approved and ${leave.duration} attendance records created` 
          : 'Leave request rejected'
      }
    });

  } catch (error) {
    console.error('Leave review process failed:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});

// Get leave statistics
exports.getLeaveStats = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;

  let matchStage = {};
  if (startDate && endDate) {
    matchStage.$or = [
      {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },
      {
        endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    ];
  }

  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select('_id');
    matchStage.employee = { $in: employees.map(emp => emp._id) };
  }

  const stats = await Leave.aggregate([
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalDays: {
          $sum: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        statusBreakdown: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalDays: '$totalDays'
          }
        },
        totalRequests: { $sum: '$count' },
        totalDays: { $sum: '$totalDays' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
}); 