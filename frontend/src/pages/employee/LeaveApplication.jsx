import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import { format, differenceInDays, addMonths, subMonths, addDays } from "date-fns";
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
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { createLeave, getMyLeaves } from "../../api/Leave.js";

const LeaveApplication = () => {
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), 7),
    to: addDays(new Date(), 7),
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      try {
        if (!user) {
          toast.error("User information not found");
          setIsLoading(false);
          return;
        }

        const leaveResponse = await getMyLeaves();
        console.log("Leave response:", leaveResponse);

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

        console.log("Processed leaves data:", leavesData);

        const sortedApplications = leavesData
          .map((leave) => ({
            type:
              leave.leaveType.charAt(0).toUpperCase() +
              leave.leaveType.slice(1) +
              " Leave",
            from: format(new Date(leave.startDate), "yyyy-MM-dd"),
            to: format(new Date(leave.endDate), "yyyy-MM-dd"),
            status:
              leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
            approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
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
                differenceInDays(new Date(app.to), new Date(app.from)) + 1;
            } else if (app.status === "Pending") {
              balanceCalculation[type].pending +=
                differenceInDays(new Date(app.to), new Date(app.from)) + 1;
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
      console.log("Refreshed leave response:", leaveResponse);

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

      console.log("Processed refreshed leaves data:", leavesData);

      const sortedApplications = leavesData
        .map((leave) => ({
          type:
            leave.leaveType.charAt(0).toUpperCase() +
            leave.leaveType.slice(1) +
            " Leave",
          from: format(new Date(leave.startDate), "yyyy-MM-dd"),
          to: format(new Date(leave.endDate), "yyyy-MM-dd"),
          status:
            leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
          approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
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
              differenceInDays(new Date(app.to), new Date(app.from)) + 1;
          } else if (app.status === "Pending") {
            balanceCalculation[type].pending +=
              differenceInDays(new Date(app.to), new Date(app.from)) + 1;
          }
        }
      });

      setLeaveBalance(balanceCalculation);
    } catch (error) {
      console.error("Error refreshing leave data:", error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
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
      console.log("User data for submit:", user);

      if (!user) {
        toast.error("User information not found");
        return;
      }

      const leaveRequest = {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
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
      setDateRange({ from: addDays(new Date(), 7), to: addDays(new Date(), 7) });

      toast.success("Leave request submitted successfully");

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getFormattedDateRange = () => {
    if (dateRange && dateRange.from && dateRange.to) {
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{days} day{days > 1 ? "s" : ""}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-700">
            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Select date range</span>
      </div>
    );
  };

  const handleDateSelect = (range) => {
    if (range && range.from) {
      if (!range.to) {
        range.to = range.from;
      }
      setDateRange(range);
    } else {
      setDateRange({ from: addDays(new Date(), 7), to: addDays(new Date(), 7) });
    }
  };

  const disabledDays = {
    before: addDays(new Date(), 6),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600">
        Loading leave information...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Application</h1>
        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-sm rounded-lg transition-all duration-200"
          >
            <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Download Leave Policy</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 bg-white shadow-md rounded-xl border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Leave Type
                  </label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="w-full bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 rounded-lg shadow-sm transition-all duration-200">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg rounded-lg">
                      <SelectItem value="annual" className="hover:bg-gray-50">Annual Leave</SelectItem>
                      <SelectItem value="sick" className="hover:bg-gray-50">Sick Leave</SelectItem>
                      <SelectItem value="personal" className="hover:bg-gray-50">Personal Leave</SelectItem>
                      <SelectItem value="unpaid" className="hover:bg-gray-50">Unpaid Leave</SelectItem>
                      <SelectItem value="other" className="hover:bg-gray-50">Other Leave</SelectItem>
                      <SelectItem value="maternity" className="hover:bg-gray-50">Maternity Leave</SelectItem>
                      <SelectItem value="paternity" className="hover:bg-gray-50">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                    {getFormattedDateRange()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex flex-col items-center">
                    <div className="flex justify-center items-center gap-4 mb-4 pb-2 border-b border-gray-200 w-full">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        className="h-8 w-8 hover:bg-gray-50 border-gray-300 rounded-full transition-all duration-200"
                      >
                        <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                      <div className="text-sm font-semibold text-gray-700">
                        {format(currentMonth, "MMMM yyyy")}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 hover:bg-gray-50 border-gray-300 rounded-full transition-all duration-200"
                      >
                        <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                    <div className="flex justify-center w-full">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={1}
                        month={currentMonth}
                        className="w-full max-w-sm animate-fade-in"
                        showOutsideDays={false}
                        disabled={disabledDays}
                        classNames={{
                          months: "flex justify-center",
                          month: "space-y-4 w-full",
                          caption: "hidden",
                          nav: "hidden",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-gray-500 w-10 font-normal text-sm",
                          row: "flex w-full",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent",
                          day: "h-10 w-10 p-0 font-normal hover:bg-blue-100 cursor-pointer rounded-full transition-all duration-200",
                          day_range_end: "day-range-end",
                          day_range_start: "day-range-start",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                          day_disabled: "text-gray-400 cursor-not-allowed opacity-50",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request"
                  className="min-h-[100px] bg-white border-gray-300 focus:border-blue-500 rounded-lg shadow-sm transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                Submit Application
              </Button>
            </form>
          </Card>

          <Card className="p-6 bg-white shadow-md rounded-xl border-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h2>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No leave applications found</p>
              ) : (
                recentApplications.map((application, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{application.type}</p>
                        <p className="text-sm text-gray-500">
                          {application.from} to {application.to}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {getStatusIcon(application.status)}
                          <span>{application.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">{application.approvedBy}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white shadow-md rounded-xl border-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h2>
          <div className="space-y-6">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <div key={type} className="space-y-2 group relative">
                <div className="flex justify-between items-center">
                  <span className="capitalize text-gray-700 font-semibold">{type} Leave</span>
                  <span className="font-semibold text-gray-900">
                    {balance.total - balance.used} days
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative"
                  title={`Used: ${balance.used} days, Pending: ${balance.pending} days`}
                >
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300"
                    style={{
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
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Used: {balance.used} days</span>
                  <span>Pending: {balance.pending} days</span>
                </div>
                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  Used: {balance.used} days, Pending: {balance.pending} days
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeaveApplication;