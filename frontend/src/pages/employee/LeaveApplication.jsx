import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Textarea } from "../../components/ui/textarea";
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { createLeave, getMyLeaves } from "../../api/Leave.js";
import moment from 'moment';


const LeaveApplication = () => {
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState({
    from: moment().add(7, 'days').startOf('day').toDate(),
    to: moment().add(7, 'days').startOf('day').toDate(),
  });
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month').toDate());
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { total: 14, used: 0, pending: 0 },
    sick: { total: 7, used: 0, pending: 0 },
    personal: { total: 3, used: 0, pending: 0 },
    maternity: { total: 90, used: 0, pending: 0 },
    paternity: { total: 14, used: 0, pending: 0 },
    unpaid: { total: 0, used: 0, pending: 0 },
    other: { total: 0, used: 0, pending: 0 },
  });

  useEffect(() => {
    const fetchLeaveData = async () => {
      const loadingToast = toast.loading("Loading leave information...", {
        id: "loading-leave-data",
      });
      try {
        if (!user) {
          toast.error("User information not found");
          setIsLoading(false);
          return;
        }

        const leaveResponse = await getMyLeaves();

        let leavesData = [];
        if (Array.isArray(leaveResponse)) {
          leavesData = leaveResponse;
        } else if (leaveResponse?.data?.leaves) {
          leavesData = leaveResponse.data.leaves;
        } else if (leaveResponse?.leaves) {
          leavesData = leaveResponse.leaves;
        } else if (leaveResponse?.data && Array.isArray(leaveResponse.data)) {
          leavesData = leaveResponse.data;
        }

        const sortedApplications = leavesData
          .map((leave) => ({
            _id: leave._id,
            type:
              leave.leaveType.charAt(0).toUpperCase() +
              leave.leaveType.slice(1) +
              " Leave",
            from: moment(leave.startDate).format('YYYY-MM-DD'),
            to: moment(leave.endDate).format('YYYY-MM-DD'),
            status:
              leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
            approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
            reviewNotes: leave.reviewNotes || "",
            reviewedAt: leave.reviewedAt ? moment(leave.reviewedAt).format('MMM DD, YYYY') : "",
            reviewedBy: leave.reviewedBy || "",
            originalLeave: leave, 
          }))
          .sort((a, b) => new Date(b.from) - new Date(a.from));

        setRecentApplications(sortedApplications);

        const balanceCalculation = {
          annual: { total: 14, used: 0, pending: 0 },
          sick: { total: 7, used: 0, pending: 0 },
          personal: { total: 3, used: 0, pending: 0 },
          maternity: { total: 90, used: 0, pending: 0 },
          paternity: { total: 14, used: 0, pending: 0 },
          unpaid: { total: 0, used: 0, pending: 0 },
          other: { total: 0, used: 0, pending: 0 },
        };

        sortedApplications.forEach((app) => {
          const type = app.type.toLowerCase().replace(" leave", "");
          if (balanceCalculation[type]) {
            if (app.status === "Approved") {
              balanceCalculation[type].used +=
                moment(app.to).diff(moment(app.from), 'days') + 1;
            } else if (app.status === "Pending") {
              balanceCalculation[type].pending +=
                moment(app.to).diff(moment(app.from), 'days') + 1;
            }
          }
        });

        setLeaveBalance(balanceCalculation);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching leave data:", error);
        toast.error("Failed to fetch leave requests");
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  const refreshLeaveData = async () => {
    try {
      if (!user) return;

      const leaveResponse = await getMyLeaves();

      let leavesData = [];
      if (Array.isArray(leaveResponse)) {
        leavesData = leaveResponse;
      } else if (leaveResponse?.data?.leaves) {
        leavesData = leaveResponse.data.leaves;
      } else if (leaveResponse?.leaves) {
        leavesData = leaveResponse.leaves;
      } else if (leaveResponse?.data && Array.isArray(leaveResponse.data)) {
        leavesData = leaveResponse.data;
      }

      const sortedApplications = leavesData
        .map((leave) => ({
          _id: leave._id,
          type:
            leave.leaveType.charAt(0).toUpperCase() +
            leave.leaveType.slice(1) +
            " Leave",
          from: moment(leave.startDate).format('YYYY-MM-DD'),
          to: moment(leave.endDate).format('YYYY-MM-DD'),
          status:
            leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
          approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
          reviewNotes: leave.reviewNotes || "",
          reviewedAt: leave.reviewedAt ? moment(leave.reviewedAt).format('MMM DD, YYYY') : "",
          reviewedBy: leave.reviewedBy || "",
          originalLeave: leave,
        }))
        .sort((a, b) => new Date(b.from) - new Date(a.from));

      setRecentApplications(sortedApplications);

      const balanceCalculation = {
        annual: { total: 14, used: 0, pending: 0 },
        sick: { total: 7, used: 0, pending: 0 },
        personal: { total: 3, used: 0, pending: 0 },
        maternity: { total: 90, used: 0, pending: 0 },
        paternity: { total: 14, used: 0, pending: 0 },
        unpaid: { total: 0, used: 0, pending: 0 },
        other: { total: 0, used: 0, pending: 0 },
      };

      sortedApplications.forEach((app) => {
        const type = app.type.toLowerCase().replace(" leave", "");
        if (balanceCalculation[type]) {
          if (app.status === "Approved") {
            balanceCalculation[type].used +=
              moment(app.to).diff(moment(app.from), 'days') + 1;
          } else if (app.status === "Pending") {
            balanceCalculation[type].pending +=
              moment(app.to).diff(moment(app.from), 'days') + 1;
          }
        }
      });

      setLeaveBalance(balanceCalculation);
    } catch (error) {
      console.error("Error refreshing leave data:", error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => moment(prev).subtract(1, 'month').startOf('month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => moment(prev).add(1, 'month').startOf('month').toDate());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leaveType) {
      toast.error("Please select a leave type");
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your leave");
      return;
    }

    try {
      if (!user) {
        toast.error("User information not found");
        return;
      }

      const leaveRequest = {
        startDate: moment(dateRange.from).format('YYYY-MM-DD'),
        endDate: moment(dateRange.to).format('YYYY-MM-DD'),
        reason: reason.trim(),
        employee: user._id || user.id || user.employeeId,
        leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1),
        status: "Pending",
      };

      const response = await createLeave(leaveRequest);

      if (!response || !response.data) {
        toast.error("Failed to submit leave request");
        return;
      }

      setLeaveType("");
      setReason("");
      setDateRange({ from: moment().add(7, 'days').startOf('day').toDate(), to: moment().add(7, 'days').startOf('day').toDate() });

      if (response && response.data) {
        toast.success("Leave request submitted successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error("Failed to submit leave request");
      }

      await refreshLeaveData();
    } catch (error) {
      console.error("Leave request error:", error);
      const message =
        error.response?.data?.message ||
        (error.response?.status === 403
          ? "Insufficient permissions"
          : "Failed to submit leave request");
      toast.error(message);
    }
  };

  const handleLeaveClick = (application) => {
    if (application.approvedBy === "Reviewed" && application.reviewNotes) {
      setSelectedLeave(application);
      setShowReviewModal(true);
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedLeave(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="h-5 w-5 text-emerald-600" />;
      case "Rejected":
        return <XCircleIcon className="h-5 w-5 text-rose-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-amber-600" />;
    }
  };

  const handleDateClick = (date) => {
    if (!date || moment(date).isBefore(moment().add(6, 'days').startOf('day'))) {
      return; // Don't allow selection of disabled dates
    }

    const localDate = moment(date).startOf('day').toDate();

    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      // Start new selection
      setDateRange({ from: localDate, to: null });
    } else if (dateRange.from && !dateRange.to) {
      // Complete the range
      if (moment(localDate).isBefore(moment(dateRange.from))) {
        setDateRange({ from: localDate, to: dateRange.from });
      } else {
        setDateRange({ from: dateRange.from, to: localDate });
      }
    }
  };

  const isDateInRange = (date) => {
    if (!dateRange.from || !dateRange.to || !date) return false;
    const localDate = moment(date).startOf('day');
    return (moment(localDate).isSameOrAfter(moment(dateRange.from)) &&
            moment(localDate).isSameOrBefore(moment(dateRange.to)));
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const localDate = moment(date).startOf('day');
    return (dateRange.from && moment(localDate).isSame(moment(dateRange.from), 'day')) ||
           (dateRange.to && moment(localDate).isSame(moment(dateRange.to), 'day'));
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return moment(date).isBefore(moment().add(6, 'days').startOf('day'));
  };

  const isToday = (date) => {
    if (!date) return false;
    return moment(date).isSame(moment(), 'day');
  };

  const getDaysInMonth = (date) => {
    const year = moment(date).year();
    const month = moment(date).month();
    const firstDay = moment([year, month, 1]);
    const lastDay = moment([year, month]).endOf('month');
    const daysInMonth = lastDay.date();
    const startingDayOfWeek = firstDay.day();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(moment([year, month, day]).toDate());
    }
    
    return days;
  };

  const getFormattedDateRange = () => {
    if (dateRange && dateRange.from && dateRange.to) {
      const days = moment(dateRange.to).diff(moment(dateRange.from), 'days') + 1;
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#1c6ead]" />
          <span className="font-semibold text-gray-900">{days} day{days > 1 ? "s" : ""}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-700">
            {moment(dateRange.from).format('MMM D')} - {moment(dateRange.to).format('MMM D, YYYY')}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
        <span className="text-gray-500">Select date range</span>
      </div>
    );
  };

  const handleDateSelect = (range) => {
    if (range && range.from) {
      if (!range.to) {
        range.to = range.from;
      }
      setDateRange({
        from: moment(range.from).startOf('day').toDate(),
        to: moment(range.to).startOf('day').toDate(),
      });
    } else {
      setDateRange({ from: moment().add(7, 'days').startOf('day').toDate(), to: moment().add(7, 'days').startOf('day').toDate() });
    }
  };

  const disabledDays = {
    before: moment().add(6, 'days').startOf('day').toDate(),
  };

  const renderCalendar = (month) => {
    const days = getDaysInMonth(month);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10 w-10"></div>;
            }

            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const inRange = isDateInRange(date);
            const today = isToday(date);

            let dayClasses = "h-10 w-10 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ";

            if (disabled) {
              dayClasses += "text-gray-400 cursor-not-allowed opacity-50 ";
            } else if (selected) {
              dayClasses += "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white font-semibold shadow-lg transform scale-105 ring-2 ring-indigo-300 ring-offset-1 ";
            } else if (inRange) {
              dayClasses += "bg-gradient-to-r from-indigo-200 to-indigo-100 text-indigo-900 font-medium shadow-sm ";
            } else if (today) {
              dayClasses += "bg-indigo-50 text-indigo-600 font-semibold border-2 border-indigo-300 ";
            } else {
              dayClasses += "text-gray-700 hover:bg-indigo-100 hover:scale-105 hover:shadow-md ";
            }

            return (
              <motion.div
                key={date.toISOString()}
                className={dayClasses}
                onClick={() => handleDateClick(date)}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
              >
                {moment(date).date()}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600">
        Loading leave information...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8 text-[#1c6ead]" />
          <h1 className="text-3xl font-bold text-gray-900">Leave Application</h1>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0 flex items-center gap-2 bg-white hover:bg-indigo-50 border-indigo-300 shadow-sm rounded-lg transition-all duration-300 hover:shadow-md"
        >
          <DocumentTextIcon className="h-5 w-5 text-[#1c6ead]" />
          <span className="font-medium text-[#1c6ead] cursor-pointer">Download Leave Policy</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <UserIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                    Leave Type
                  </label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="w-full bg-white border-indigo-200 hover:border-indigo-300 focus:border-indigo-500 rounded-lg shadow-sm transition-all duration-300 cursor-pointer">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-indigo-100 shadow-lg rounded-lg cursor-pointer">
                      <SelectItem value="annual" className="hover:bg-indigo-50 cursor-pointer">Annual Leave</SelectItem>
                      <SelectItem value="sick" className="hover:bg-indigo-50 cursor-pointer">Sick Leave</SelectItem>
                      <SelectItem value="personal" className="hover:bg-indigo-50 cursor-pointer">Personal Leave</SelectItem>
                      <SelectItem value="unpaid" className="hover:bg-indigo-50 cursor-pointer">Unpaid Leave</SelectItem>
                      <SelectItem value="other" className="hover:bg-indigo-50 cursor-pointer">Other Leave</SelectItem>
                      <SelectItem value="maternity" className="hover:bg-indigo-50 cursor-pointer">Maternity Leave</SelectItem>
                      <SelectItem value="paternity" className="hover:bg-indigo-50 cursor-pointer">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <ClockIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                    Duration
                  </label>
                  <motion.div
                    className="text-sm bg-white border border-indigo-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    {getFormattedDateRange()}
                  </motion.div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <SunIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                  Date Range
                </label>
                <div className="rounded-lg border border-indigo-100 p-4 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex flex-col items-center">
                    <div className="flex justify-between items-center gap-4 mb-4 pb-2 border-b border-indigo-100 w-full">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        className="h-8 w-8 hover:bg-indigo-50 border-indigo-200 rounded-full transition-all duration-300"
                      >
                        <ChevronLeftIcon className="h-4 w-4 text-[#1c6ead]" />
                      </Button>
                      <div className="text-sm font-semibold text-gray-700">
                        {moment(currentMonth).format("MMMM YYYY")}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 hover:bg-indigo-50 border-indigo-200 rounded-full transition-all duration-300"
                      >
                        <ChevronRightIcon className="h-4 w-4 text-[#1c6ead]" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {renderCalendar(currentMonth)}
                      {renderCalendar(moment(currentMonth).add(1, 'month').toDate())}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <UserIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                  Reason
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  placeholder="Please provide a reason for your leave request"
                  className="min-h-[100px] bg-white border-indigo-200 focus:border-[#1c6ead] rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {reason.length}/500
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full group px-6 py-3 bg-[#1c6ead] text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
                >
                  Submit Application
                </Button>
              </motion.div>
            </motion.form>
          </Card>

          <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 text-[#1c6ead] mr-2" />
              Recent Applications
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {recentApplications.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-gray-500 py-8"
                  >
                    No leave applications found
                  </motion.p>
                ) : (
                  recentApplications.map((application, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white hover:bg-indigo-50 transition-all duration-300 shadow-sm hover:shadow-md ${
                        application.approvedBy === "Reviewed" && application.reviewNotes ? "cursor-pointer" : ""
                      }`}
                      onClick={() => handleLeaveClick(application)}
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="p-2 bg-indigo-100 rounded-full"
                          whileHover={{ scale: 1.1 }}
                        >
                          <CalendarIcon className="h-5 w-5 text-[#1c6ead]" />
                        </motion.div>
                        <div>
                          <p className="font-semibold text-gray-900">{application.type}</p>
                          <p className="text-sm text-gray-500">
                            {application.from} to {application.to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <motion.div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              application.status
                            )}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {getStatusIcon(application.status)}
                            <span>{application.status}</span>
                          </motion.div>
                          <p className="text-sm text-gray-500">{application.approvedBy}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SunIcon className="h-6 w-6 text-[#1c6ead] mr-2" />
            Leave Balance
          </h2>
          <div className="space-y-6">
            <AnimatePresence>
              {Object.entries(leaveBalance).map(([type, balance], index) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2 group relative"
                >
                  <div className="flex justify-between items-center">
                    <span className="capitalize text-gray-700 font-semibold flex items-center">
                      <UserIcon className="h-4 w-4 text-[#1c6ead] mr-2" />
                      {type} Leave
                    </span>
                    <motion.span
                      className="font-semibold text-[#1c6ead]"
                      whileHover={{ scale: 1.05 }}
                    >
                      {balance.total - balance.used} days
                    </motion.span>
                  </div>
                  <div
                    className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative"
                    title={`Used: ${balance.used} days, Pending: ${balance.pending} days`}
                  >
                    <motion.div
                      className="h-3 rounded-full bg-[#1c6ead]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          type === "unpaid" || type === "other"
                            ? balance.used > 0 || balance.pending > 0
                              ? 100
                              : 0
                            : balance.total > 0
                            ? ((balance.used + balance.pending) / balance.total) * 100
                            : 0
                        }%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Used: {balance.used} days</span>
                    <span>Pending: {balance.pending} days</span>
                  </div>
                  <motion.div
                    className="absolute hidden group-hover:block bg-[#1c6ead] text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Used: {balance.used} days, Pending: {balance.pending} days
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Review Notes Modal */}
      <AnimatePresence>
        {showReviewModal && selectedLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeReviewModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-blue-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                      <DocumentTextIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Review Details
                      </h2>
                      {/* <p className="text-sm text-gray-600 mt-1">
                        Leave request review information
                      </p> */}
                    </div>
                  </div>
                  <button 
                    onClick={closeReviewModal} 
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedLeave.type}
                    </h3>
                    {/* <p className="text-sm text-gray-600">
                      {selectedLeave.from} to {selectedLeave.to}
                    </p> */}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedLeave.status)}`}>
                      {getStatusIcon(selectedLeave.status)}
                      <span className="ml-1">{selectedLeave.status}</span>
                    </div>
                  </div>

                  {selectedLeave.reviewedAt && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Reviewed on:</span> {selectedLeave.reviewedAt}
                    </div>
                  )}

                  {selectedLeave.reviewNotes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Review Notes:</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedLeave.reviewNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <Button
                    onClick={closeReviewModal}
                    className="px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveApplication;