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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  casualLeaveAvailable,
  createLeave,
  getMyLeaves,
} from "../../api/Leave.js";
import moment from "moment";

const LeaveApplication = () => {
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState({
    from: moment().add(1, "days").startOf("day").toDate(),
    to: moment().add(1, "days").startOf("day").toDate(),
  });
  const [currentMonth, setCurrentMonth] = useState(
    moment().startOf("month").toDate()
  );
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [probation, setprobation] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({
    sick: { total: 7, used: 0, pending: 0 },
    casual: { total: 1, used: 0, pending: 0 },
    paid: { total: 10, used: 0, pending: 0 },
    Emergency: { total: 14, used: 0, pending: 0 },
    Exam: { total: 14, used: 0, pending: 0 },
    other: { total: 10, used: 0, pending: 0 },
  });
  const [availableCasualLeaves, setAvailableCasualLeaves] = useState(0);
  const now = new Date();
  
  const leavePolicyHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Leave, Attendance & Working Hours Policy</title>
  <style>
  /* Style Definitions */
  table.MsoNormalTable
    {mso-style-name:"Table Normal";
    mso-tstyle-rowband-size:0;
    mso-tstyle-colband-size:0;
    mso-style-noshow:yes;
    mso-style-priority:99;
    mso-style-parent:"";
    mso-padding-alt:0cm 5.4pt 0cm 5.4pt;
    mso-para-margin-top:0cm;
    mso-para-margin-right:0cm;
    mso-para-margin-bottom:8.0pt;
    mso-para-margin-left:0cm;
    line-height:107%;
    mso-pagination:widow-orphan;
    font-size:11.0pt;
    font-family:"Calibri",sans-serif;
    mso-ascii-font-family:Calibri;
    mso-ascii-theme-font:minor-latin;
    mso-hansi-font-family:Calibri;
    mso-hansi-theme-font:minor-latin;
    mso-bidi-font-family:"Times New Roman";
    mso-bidi-theme-font:minor-bidi;}
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111827; }
  h1,h2,h3 { color: #0f172a }
  </style>
</head>
<body>
<h1>LEAVE, ATTENDANCE & WORKING HOURS POLICY</h1>
<h2>ACAS Advisory</h2>
<h3>PART A – OBJECTIVE & APPLICABILITY</h3>
<h4>1. OBJECTIVE</h4>
<p>This Policy is formulated to regulate working hours, attendance, leave entitlement, employee availability, and discipline within ACAS Advisory (“Company”) and to ensure operational efficiency, professional accountability, and compliance with applicable labour laws.</p>
<h4>2. APPLICABILITY</h4>
<p>This Policy shall apply to all employees, trainees, probationers, interns, consultants, contractual staff, and permanent employees of the Company, unless specifically exempted by Management through written communication.</p>
<p><strong>Employee on Probation</strong><br/>An Employee who is undergoing the initial probation period prescribed by the Company, which shall ordinarily be 6 months unless a lesser period is specified by the Management, and whose employment is subject to performance evaluation and confirmation.</p>
<p><strong>Permanent Employee</strong><br/>An Employee who has successfully completed the prescribed probation period and whose employment has been confirmed in writing by the Company.</p>
<h3>PART B – WORKING DAYS, HOURS & ATTENDANCE</h3>
<h4>4. WORKING DAYS</h4>
<p>The normal working schedule of the Company shall be:</p>
<p>Monday to Saturday – Working Days<br/>Second Saturday - Holiday<br/>Sunday – Weekly Holiday</p>
<p>The Company reserves the right to modify working schedules, shifts, or weekly offs depending upon operational requirements and business exigencies.</p>
<h4>5. OFFICE TIMINGS & WORKING HOURS</h4>
<p><strong>5.1 Flexible Reporting Window</strong><br/>Employees may report to office between: 8:30 AM to 9:30 AM</p>
<p><strong>5.2 Working Hours</strong><br/>Employees are required to complete: Minimum 8 Working Hours per day excluding approved break timings.</p>
<p><strong>5.3 Exit Timing</strong><br/>Final exit timing shall depend upon actual reporting time and completion of mandatory working hours.</p>
<p><strong>5.4 Core Availability</strong><br/>Employees shall remain available during core business hours for client coordination, internal meetings, operational communication, and official responsibilities.</p>
<h4>6. BREAK TIMINGS</h4>
<p><strong>Lunch Break:</strong> 30 Minutes<br/><strong>Tea Break:</strong> 10 Minutes</p>
<h4>7. ATTENDANCE RECORDING</h4>
<p>All employees shall compulsorily record attendance through the ACAS ERP/Attendance System. Mandatory attendance entries include Entry Punch, Lunch Out Punch, Lunch In Punch, Final Exit Punch.</p>
<h4>8. HALF DAY & ABSENCE RULE</h4>
<p>Minimum 4 working hours attendance is required for Half Day eligibility. Attendance below 4 working hours may be treated as Absent unless otherwise approved.</p>
<h4>9. GENERAL LEAVE RULES</h4>
<p>All leave applications shall be submitted through the ERP system or approved communication channel and must receive prior approval from Reporting Authority/Management except in emergencies.</p>
<h4>10. CASUAL LEAVE (CL)</h4>
<p>Entitlement: 6 Days Casual Leave per Year for permanent employees. Accrual: 1 leave for every two completed months of service. Casual Leave cannot ordinarily be combined with Earned Leave and shall lapse at year end; not encashable.</p>
<h4>11. SICK LEAVE (SL)</h4>
<p>Entitlement: 6 Days Sick Leave per Year. Sick Leave requires a valid Medical Certificate. Unused Sick Leave shall lapse at year end.</p>
<h4>12. EARNED LEAVE (EL)</h4>
<p>Entitlement: 12 Days Earned Leave annually, eligibility after 240 working days of continuous service. May be accumulated subject to limits; unused may be encashed as per policy.</p>
<h4>13. PUBLIC HOLIDAYS</h4>
<p>Company may declare holidays: VISHU, INTERNATIONAL LABOUR DAY, EID-UL-FITR, EID-UL-ADHA, INDEPENDENCE DAY, THIRUVONAM, GANDHI JAYANTI, DEEPAVALI, CHRISTMAS, REPUBLIC DAY, GOOD FRIDAY, etc.</p>
<h4>14. SANDWICH LEAVE POLICY</h4>
<p>Leave taken immediately before and after weekly offs or public holidays may result in intervening days treated as leave, subject to Management discretion.</p>
<h4>15. LOSS OF PAY (LOP)</h4>
<p>Situations leading to LOP include exhaustion of leave balance, unauthorized absence, attendance irregularities, unapproved leave.</p>
<h4>16. DISCIPLINARY ACTION</h4>
<p>Violations such as habitual absenteeism, attendance manipulation, false leave claims, unauthorized absence can attract disciplinary action including warning, salary deduction, suspension, or termination.</p>
<h4>17. MANAGEMENT RIGHTS</h4>
<p>The Company reserves the right to Interpret, Modify, Amend, Suspend, or Withdraw provisions of this Policy. Management decisions are final and binding.</p>
<p>-- End of Policy --</p>
</body>
</html>`;

  const downloadLeavePolicy = () => {
    try {
      const blob = new Blob([leavePolicyHtml], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ACAS_Leave_Policy.doc";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download leave policy");
    }
  };
  useEffect(() => {
    const fetchLeaveData = async () => {
      // const loadingToast = toast.loading("Loading leave information...", {
      //   id: "loading-leave-data",
      // });
      try {
        if (!user) {
          toast.error("User information not found");
          setIsLoading(false);
          return;
        }
        const CasualLeaveTaken = await casualLeaveAvailable();
        console.log(CasualLeaveTaken?.data?.data?.casual);
        setAvailableCasualLeaves(CasualLeaveTaken?.data?.data?.casual);
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
            from: moment(leave.startDate).format("YYYY-MM-DD"),
            to: moment(leave.endDate).format("YYYY-MM-DD"),
            status:
              leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
            approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
            reviewNotes: leave.reviewNotes || "",
            reviewedAt: leave.reviewedAt
              ? moment(leave.reviewedAt).format("MMM DD, YYYY")
              : "",
            reviewedBy: leave.reviewedBy || "",
            originalLeave: leave,
          }))
          .sort((a, b) => new Date(b.from) - new Date(a.from));

        setRecentApplications(sortedApplications);
        if (CasualLeaveTaken?.data?.data?.emp_status === "Probation") {
          const balanceCalculation = {
            sick: { total: 7, used: 0, pending: 0 },
            paid: { total: 10, used: 0, pending: 0 },
            Emergency: { total: 14, used: 0, pending: 0 },
            Exam: { total: 14, used: 0, pending: 0 },
            other: { total: 0, used: 0, pending: 0 },
          };
          sortedApplications.forEach((app) => {
            const type = app.type.toLowerCase().replace(" leave", "");
            if (balanceCalculation[type]) {
              if (app.status === "Approved") {
                balanceCalculation[type].used +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              } else if (app.status === "Pending") {
                balanceCalculation[type].pending +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              }
            }
          });

          setLeaveBalance(balanceCalculation);
          setIsLoading(false);
        } else {
          if (CasualLeaveTaken?.data?.data.casual === 0) {
            const balanceCalculation = {
              sick: { total: 7, used: 0, pending: 0 },
              casual: { total: 0, used: 0, pending: 0 },
              paid: { total: 10, used: 0, pending: 0 },
              Emergency: { total: 14, used: 0, pending: 0 },
              Exam: { total: 14, used: 0, pending: 0 },
              other: { total: 0, used: 0, pending: 0 },
            };
            sortedApplications.forEach((app) => {
              const type = app.type.toLowerCase().replace(" leave", "");
              if (balanceCalculation[type]) {
                if (app.status === "Approved") {
                  balanceCalculation[type].used +=
                    moment(app.to).diff(moment(app.from), "days") + 1;
                } else if (app.status === "Pending") {
                  balanceCalculation[type].pending +=
                    moment(app.to).diff(moment(app.from), "days") + 1;
                }
              }
            });

            setLeaveBalance(balanceCalculation);
            setIsLoading(false);
          } else {
            // setcasualLeaveIsHidden(false);
            const balanceCalculation = {
              sick: { total: 7, used: 0, pending: 0 },
              casual: {
                total: CasualLeaveTaken?.data?.data.casual,
                used: 0,
                pending: 0,
              },
              paid: { total: 10, used: 0, pending: 0 },
              Emergency: { total: 14, used: 0, pending: 0 },
              Exam: { total: 14, used: 0, pending: 0 },
              other: { total: 0, used: 0, pending: 0 },
            };
            sortedApplications.forEach((app) => {
              const type = app.type.toLowerCase().replace(" leave", "");
              if (balanceCalculation[type]) {
                if (app.status === "Approved") {
                  balanceCalculation[type].used +=
                    moment(app.to).diff(moment(app.from), "days") + 1;
                } else if (app.status === "Pending") {
                  balanceCalculation[type].pending +=
                    moment(app.to).diff(moment(app.from), "days") + 1;
                }
              }
            });
            setLeaveBalance(balanceCalculation);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
        toast.error("Failed to fetch leave requests");
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, []);
  useEffect(() => {
    if (leaveType === "emergency") {
      setDateRange((prev) => ({
        ...prev,
        from: moment().add(1, "days").startOf("day").toDate(),
        to: moment().add(1, "days").startOf("day").toDate(),
      }));
    } else if (leaveType === "sick") {
      setDateRange((prev) => ({
        ...prev,
        from: moment().add(1, "days").startOf("day").toDate(),
        to: moment().add(1, "days").startOf("day").toDate(),
      }));
    } else {
      setDateRange((prev) => ({
        ...prev,
        from: moment().add(8, "days").startOf("day").toDate(),
        to: moment().add(8, "days").startOf("day").toDate(),
      }));
    }
  }, [leaveType]);
  const refreshLeaveData = async () => {
    try {
      if (!user) return;
      const CasualLeaveTaken = await casualLeaveAvailable();
      setAvailableCasualLeaves(CasualLeaveTaken?.data?.data?.casual);
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
          from: moment(leave.startDate).format("YYYY-MM-DD"),
          to: moment(leave.endDate).format("YYYY-MM-DD"),
          status: leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
          approvedBy: leave.approvalChain?.length ? "Reviewed" : "",
          reviewNotes: leave.reviewNotes || "",
          reviewedAt: leave.reviewedAt
            ? moment(leave.reviewedAt).format("MMM DD, YYYY")
            : "",
          reviewedBy: leave.reviewedBy || "",
          originalLeave: leave,
        }))
        .sort((a, b) => new Date(b.from) - new Date(a.from));

      setRecentApplications(sortedApplications);

      if (CasualLeaveTaken?.data?.data?.emp_status === "Probation") {
        const balanceCalculation = {
          sick: { total: 7, used: 0, pending: 0 },
          paid: { total: 10, used: 0, pending: 0 },
          Emergency: { total: 14, used: 0, pending: 0 },
          Exam: { total: 14, used: 0, pending: 0 },
          other: { total: 0, used: 0, pending: 0 },
        };
        sortedApplications.forEach((app) => {
          const type = app.type.toLowerCase().replace(" leave", "");
          if (balanceCalculation[type]) {
            if (app.status === "Approved") {
              balanceCalculation[type].used +=
                moment(app.to).diff(moment(app.from), "days") + 1;
            } else if (app.status === "Pending") {
              balanceCalculation[type].pending +=
                moment(app.to).diff(moment(app.from), "days") + 1;
            }
          }
        });

        setLeaveBalance(balanceCalculation);
        setIsLoading(false);
      } else {
        if (CasualLeaveTaken?.data?.data.casual === 0) {
          const balanceCalculation = {
            sick: { total: 7, used: 0, pending: 0 },
            casual: { total: 0, used: 0, pending: 0 },
            paid: { total: 10, used: 0, pending: 0 },
            Emergency: { total: 14, used: 0, pending: 0 },
            Exam: { total: 14, used: 0, pending: 0 },
            other: { total: 0, used: 0, pending: 0 },
          };
          sortedApplications.forEach((app) => {
            const type = app.type.toLowerCase().replace(" leave", "");
            if (balanceCalculation[type]) {
              if (app.status === "Approved") {
                balanceCalculation[type].used +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              } else if (app.status === "Pending") {
                balanceCalculation[type].pending +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              }
            }
          });

          setLeaveBalance(balanceCalculation);
          setIsLoading(false);
        } else {
          // setcasualLeaveIsHidden(false);
          const balanceCalculation = {
            sick: { total: 7, used: 0, pending: 0 },
            casual: {
              total: CasualLeaveTaken?.data?.data.casual,
              used: 0,
              pending: 0,
            },
            paid: { total: 10, used: 0, pending: 0 },
            Emergency: { total: 14, used: 0, pending: 0 },
            Exam: { total: 14, used: 0, pending: 0 },
            other: { total: 0, used: 0, pending: 0 },
          };
          sortedApplications.forEach((app) => {
            const type = app.type.toLowerCase().replace(" leave", "");
            if (balanceCalculation[type]) {
              if (app.status === "Approved") {
                balanceCalculation[type].used +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              } else if (app.status === "Pending") {
                balanceCalculation[type].pending +=
                  moment(app.to).diff(moment(app.from), "days") + 1;
              }
            }
          });
          setLeaveBalance(balanceCalculation);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error refreshing leave data:", error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) =>
      moment(prev).subtract(1, "month").startOf("month").toDate()
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) =>
      moment(prev).add(1, "month").startOf("month").toDate()
    );
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
      const date1 = new Date(dateRange.from);
      const date2 = new Date(dateRange.to);

      const diffInMs = date2 - date1;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      let a = diffInDays + 1;
      if (leaveType === "casual") {
        if (availableCasualLeaves < a) {
          toast.error(
            `Only ${availableCasualLeaves} casual leave available...`
          );
          console.log("error");
          return;
        }
      }else if(leaveType==="sick"){
        if(leaveBalance.sick.total<a){
          toast.error(
            `Only ${leaveBalance.sick.total} sick leave available...`
          );
          console.log("error");
          return;
        }
      }else if(leaveType==="paid"){
        if(leaveBalance.paid.total<a){
          toast.error(
            `Only ${leaveBalance.paid.total} paid leave available...`
          );
          console.log("error");
          return;
        }
      }else if(leaveType==="emergency"){
        if(leaveBalance.Emergency.total<a){
          toast.error(
            `Only ${leaveBalance.Emergency.total} Emergency leave available...`
          );
          console.log("error");
          return;
        }
      }
      else if(leaveType==="exam"){
        if(leaveBalance.Exam.total<a){
          toast.error(
            `Only ${leaveBalance.Exam.total} Exam leave available...`
          );
          console.log("error");
          return;
        }
      }
     
      let leaveRequest = {};
      if (leaveType === "casual") {
        leaveRequest = {
          startDate: moment(dateRange.from).format("YYYY-MM-DD"),
          endDate: moment(dateRange.to).format("YYYY-MM-DD"),
          reason: reason.trim(),
          employee: user._id || user.id || user.employeeId,
          leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1),
          status: "Pending",
          casual: true,
        };
      } else {
        leaveRequest = {
          startDate: moment(dateRange.from).format("YYYY-MM-DD"),
          endDate: moment(dateRange.to).format("YYYY-MM-DD"),
          reason: reason.trim(),
          employee: user._id || user.id || user.employeeId,
          leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1),
          status: "Pending",
        };
      }
      const response = await createLeave(leaveRequest);

      console.log(response);
      if (!response || !response.data) {
        toast.error("Failed to submit leave request");
        return;
      }

      setLeaveType("");
      setReason("");
      setDateRange({
        from: moment().add(7, "days").startOf("day").toDate(),
        to: moment().add(7, "days").startOf("day").toDate(),
      });

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
  if (!date) return;

  const tomorrow = moment().add(1, "day").startOf("day");
  const isTomorrow = moment(date).isSame(tomorrow, "day");

  // Block past dates except tomorrow for emergency/sick leave
  if (
    moment(date).isBefore(moment().startOf("day")) && // before today
    !(isTomorrow && (leaveType === "emergency" || leaveType === "sick"))
  ) {
    return; // Don't allow selection
  }

  const localDate = moment(date).startOf("day").toDate();

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
    const localDate = moment(date).startOf("day");
    return (
      moment(localDate).isSameOrAfter(moment(dateRange.from)) &&
      moment(localDate).isSameOrBefore(moment(dateRange.to))
    );
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const localDate = moment(date).startOf("day");
    return (
      (dateRange.from &&
        moment(localDate).isSame(moment(dateRange.from), "day")) ||
      (dateRange.to && moment(localDate).isSame(moment(dateRange.to), "day"))
    );
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    if (leaveType === "emergency") {
      return moment(date).isBefore(moment().add(1, "days").startOf("day"));
    } else if (leaveType === "sick") {
      return moment(date).isBefore(moment().add(1, "days").startOf("day"));
    } else {
      return moment(date).isBefore(moment().add(8, "days").startOf("day"));
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    return moment(date).isSame(moment(), "day");
  };

  const getDaysInMonth = (date) => {
    const year = moment(date).year();
    const month = moment(date).month();
    const firstDay = moment([year, month, 1]);
    const lastDay = moment([year, month]).endOf("month");
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
      const days =
        moment(dateRange.to).diff(moment(dateRange.from), "days") + 1;
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#1c6ead]" />
          <span className="font-semibold text-gray-900">
            {days} day{days > 1 ? "s" : ""}
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-700">
            {moment(dateRange.from).format("MMM D")} -{" "}
            {moment(dateRange.to).format("MMM D, YYYY")}
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
        from: moment(range.from).startOf("day").toDate(),
        to: moment(range.to).startOf("day").toDate(),
      });
    } else {
      setDateRange({
        from: moment().add(7, "days").startOf("day").toDate(),
        to: moment().add(7, "days").startOf("day").toDate(),
      });
    }
  };

  const disabledDays = {
    before: moment().add(6, "days").startOf("day").toDate(),
  };

  const renderCalendar = (month) => {
    const days = getDaysInMonth(month);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="w-full">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
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

            let dayClasses =
              "h-10 w-10 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ";

            if (disabled) {
              dayClasses += "text-gray-400   cursor-not-allowed opacity-50 ";
            } else if (selected) {
              dayClasses +=
                "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white font-semibold shadow-lg transform scale-105 ring-2 ring-indigo-300 ring-offset-1 ";
            } else if (inRange) {
              dayClasses +=
                "bg-gradient-to-r from-indigo-200 to-indigo-100 text-indigo-900 font-medium shadow-sm ";
            } else if (today) {
              dayClasses +=
                "bg-indigo-50 text-indigo-600 font-semibold border-2 border-indigo-300 ";
            } else {
              dayClasses +=
                "text-gray-700 hover:bg-indigo-100 hover:scale-105 hover:shadow-md ";
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
  console.log(availableCasualLeaves + "leaves");

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
          <h1 className="text-2xl font-bold text-gray-900">
            Leave Application
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={downloadLeavePolicy}
          type="button"
          className="mt-4 md:mt-0 flex items-center gap-2 bg-white hover:bg-indigo-50 border-indigo-300 shadow-sm rounded-lg transition-all duration-300 hover:shadow-md"
        >
          <DocumentTextIcon className="h-5 w-5 text-[#1c6ead]" />
          <span className="font-medium text-[#1c6ead] cursor-pointer">
            Download Leave Policy
          </span>
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
                    Leave Type <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    className=""
                    value={leaveType}
                    onValueChange={setLeaveType}
                  >
                    <SelectTrigger className="w-full  border-indigo-200 hover:border-indigo-300 focus:border-indigo-500 rounded-lg shadow-sm transition-all duration-300 cursor-pointer">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-indigo-100 shadow-lg rounded-lg cursor-pointer">
                      <SelectItem
                        value="sick"
                        className="hover:bg-indigo-50  cursor-pointer"
                      >
                        Sick Leave
                      </SelectItem>
                      {availableCasualLeaves > 0 && (
                        <>
                          {" "}
                          <SelectItem
                            value="casual"
                            className="hover:bg-indigo-50 cursor-pointer"
                          >
                            Casual
                          </SelectItem>
                        </>
                      )}
                      <SelectItem
                        value="paid"
                        className="hover:bg-indigo-50 cursor-pointer"
                      >
                        Paid Leave
                      </SelectItem>
                      <SelectItem
                        value="emergency"
                        className="hover:bg-indigo-50 cursor-pointer"
                      >
                        Emergency Leave
                      </SelectItem>
                      <SelectItem
                        value="exam"
                        className="hover:bg-indigo-50 cursor-pointer"
                      >
                        Exam Leave
                      </SelectItem>
                      <SelectItem
                        value="others"
                        className="hover:bg-indigo-50 cursor-pointer"
                      >
                        Other Leaves
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <ClockIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                    Duration<span className="text-red-500 ml-1">*</span>
                  </label>
                  <motion.div
                    className="text-sm bg-white border border-indigo-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    {getFormattedDateRange()}
                  </motion.div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <SunIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                  Date Range <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="rounded-lg border border-indigo-100 p-4 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex flex-col items-center">
                    <div className="flex justify-between items-center gap-4 mb-4 pb-2 border-b border-indigo-100 w-full">
                      <Button
                      type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        className="h-8 w-8 hover:bg-indigo-50 border-indigo-200 rounded-full transition-all duration-300"
                      >
                        <ChevronLeftIcon className="h-4 w-4 text-[#1c6ead]" />
                      </Button>
                      <div className="flex gap-14">
                        <div className="text-sm font-semibold text-gray-700">
                          {moment(currentMonth).format("MMMM YYYY")}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {moment(currentMonth)
                            .add(1, "month")
                            .format("MMMM YYYY")}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={handleNextMonth}
                        className="h-8 w-8 hover:bg-indigo-50 border-indigo-200 rounded-full transition-all duration-300"
                      >
                        <ChevronRightIcon className="h-4 w-4 text-[#1c6ead]" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {renderCalendar(currentMonth)}
                      {renderCalendar(
                        moment(currentMonth).add(1, "month").toDate()
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <UserIcon className="h-5 w-5 text-[#1c6ead] mr-2" />
                  Reason <span className="text-red-500 ml-1">*</span>
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
                        application.approvedBy === "Reviewed" &&
                        application.reviewNotes
                          ? "cursor-pointer"
                          : ""
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
                          <p className="font-semibold text-gray-900">
                            {application.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {moment(application.from).format("DD-MM-YYYY")} to{" "}
                            {moment(application.to).format("DD-MM-YYYY")}
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
                          <p className="text-sm text-gray-500">
                            {application.approvedBy}
                          </p>
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
              {Object.entries(leaveBalance).map(([type, balance], index) => {
                console.log(type, balance);
                return (
                  <>
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
                          {type} Leaves
                        </span>
                        <motion.span
                          className="font-semibold text-[#1c6ead]"
                          whileHover={{ scale: 1.05 }}
                        >
                          {type === "casual"
                            ? balance.total
                            : balance.total - balance.used}{" "}
                          {type === "casual" && balance.total <= 1
                            ? " day"
                            : type === "casual" && balance.total > 1
                            ? "days"
                            : balance.total - balance.used>1?" days":"day"}
                          
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
                                ? ((balance.used + balance.pending) /
                                    balance.total) *
                                  100
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
                        Used: {balance.used} days, Pending: {balance.pending}{" "}
                        days
                      </motion.div>
                    </motion.div>
                  </>
                );
              })}
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
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedLeave.status
                      )}`}
                    >
                      {getStatusIcon(selectedLeave.status)}
                      <span className="ml-1">{selectedLeave.status}</span>
                    </div>
                  </div>

                  {selectedLeave.reviewedAt && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Reviewed on:</span>{" "}
                      {selectedLeave.reviewedAt}
                    </div>
                  )}

                  {selectedLeave.reviewNotes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Review Notes:
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedLeave.reviewNotes}
                        </p>
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
