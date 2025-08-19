import { fetchCompletedTasksForInvoicing, fetchTasks, fetchAllTasks } from "./tasks";
import { userApi } from "./userApi";
import { projectsApi } from "./projectsApi";

/**
 * Fetch comprehensive dashboard data including tasks, deadlines and projects
 * @returns {Promise} Promise object containing all dashboard data
 */
export const fetchDashboardData = async (userId) => {
  try {
    // In a real app, we would fetch from the backend
    // const response = await api.get('/api/dashboard');
    // return response.data;

    const calculateChange = (current, previous) => {
      if (previous === 0) {
        if (current === 0) return 0;
        return 100;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const extractAssignedId = (assignedTo) => {
      if (assignedTo && typeof assignedTo === 'object') {
        return assignedTo._id;
      }
      return assignedTo;
    };

    //projects
    const [projects, tasksRes, usersRes] = await Promise.all([
      projectsApi.getAllProjects({ limit: 100 }),
      fetchAllTasks(),
      userApi.Allusers(),
    ]);

    const completedProjects = projects.data.filter((project) => project.status === "completed");
    // const totalRevenue = completedProjects.reduce((acc, project) => acc + project.budget, 0);

    const currentProjects = projects.count;
    const previousProject = 8;
    const changeProjects = calculateChange(currentProjects, previousProject);

    const projectList = projects.data.map((pro) => ({
      id: pro._id,
      name: pro.name,
      client: pro.client?.name || "—",
      progress: pro.progress,
      completionPercentage: pro.completionPercentage,
      dueDate: new Date(pro.dueDate).toLocaleDateString('en-GB'),
    }));

    const tasksByStatus = tasksRes.tasks.reduce((acc, task) => {
      const status = (task.status || '').toLowerCase();
      
      let statusKey;
      switch (status) {
        case 'completed':
          statusKey = 'Completed';
          break;
        case 'in-progress':
        case 'inprogress':
          statusKey = 'In Progress';
          break;
        case 'pending':
          statusKey = 'Pending';
          break;
        case 'delayed':
          statusKey = 'Delayed';
          break;
        default:
          statusKey = task.status.charAt(0).toUpperCase() + task.status.slice(1);
      }

      if (!acc[statusKey]) {
        acc[statusKey] = 0;
      }
      acc[statusKey]++;
      return acc;
    }, {});

    // Convert to array format for the dashboard
    const taskSummary = Object.entries(tasksByStatus).map(([status, count]) => ({
      status,
      count
    }));

    // Calculate task counts by status
    const taskCounts = {
      completed: 0,
      pending: 0,
      inProgress: 0,
      review: 0,
      cancelled: 0,
    };
    tasksRes.tasks.forEach((task) => {
      const status = (task.status || '').toLowerCase();
      if (status === 'completed') taskCounts.completed++;
      else if (status === 'pending') taskCounts.pending++;
      else if (status === 'in-progress' || status === 'inprogress') taskCounts.inProgress++;
      else if (status === 'review') taskCounts.review++;
      else if (status === 'cancelled') taskCounts.cancelled++;
    });

    // team members
    const currentMember = usersRes.data.data.count;

    let totalRevenue = 0;
    let userRole = undefined;
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      userRole = userData?.role;
    } catch (e) {
      userRole = undefined;
    }
    if (userRole === 'admin' || userRole === 'manager') {
      totalRevenue = tasksRes.tasks.reduce((acc, task) => acc + (task.amount || 0), 0);
    } else if (userId) {
      totalRevenue = tasksRes.tasks.reduce((acc, task) => {
        const assignedId = extractAssignedId(task.assignedTo);
        if (assignedId === userId) {
          return acc + (task.amount || 0);
        }
        return acc;
      }, 0);
    }

    let verificationTasksCount = 0;
      verificationTasksCount = tasksRes.tasks.filter(task => 
        (task?.title === 'Project Verification Task' || (task?.status || '').toLowerCase() === 'verificationpending' || (task?.status || '').toLowerCase() === 'verification-pending') &&
        (task?.status || '').toLowerCase() !== 'completed' &&
        extractAssignedId(task.assignedTo) === userId
      ).length;
    
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    const monthlyMap = {};
    months.forEach(m => {
      monthlyMap[m.key] = { month: m.label, revenue: 0, tasks: 0, projects: 0, teamMembers: 0 };
    });
    // Count projects per month (by createdAt or dueDate)
    projects.data.forEach(project => {
      const date = project.createdAt ? new Date(project.createdAt) : (project.dueDate ? new Date(project.dueDate) : null);
      if (!date || isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].projects += 1;
      }
    });

    // console.log(usersRes.data,"^^^^^^^^^^^^^^^^^^^^$$$$$$$$$^^^^^^^^^^^");
    
    if (usersRes.data && Array.isArray(usersRes.data.data.users)) {
      usersRes.data.data.users.forEach(user => {
        const date = user.createdAt ? new Date(user.createdAt) : null;
        if (!date || isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].teamMembers += 1;
        }
        console.log(monthlyMap[key].teamMembers, 'teamMembers');
      });
    }

    tasksRes.tasks.forEach(task => {
      const date = task.dueDate ? new Date(task.dueDate) : (task.createdAt ? new Date(task.createdAt) : null);
      if (!date || isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      let include = false;
      if (userRole === 'admin' || userRole === 'manager') {
        include = true;
      } else if (userId) {
        const assignedId = extractAssignedId(task.assignedTo);
        include = assignedId === userId;
      }
      if (monthlyMap[key] && include) {
        monthlyMap[key].tasks += 1;
        monthlyMap[key].revenue += task.amount || 0;
      }
    });
    const monthlyRevenueData = months.map(m => monthlyMap[m.key]);

    // Calculate dynamic changes for the latest month vs previous month
    const getChangePercent = (current, previous) => {
      if (previous === 0) {
        if (current === 0) return 0;
        return 100;
      }
      return Math.round(((current - previous) / previous) * 100);
    };
    const len = monthlyRevenueData.length;
    const latest = monthlyRevenueData[len - 1];
    const prev = monthlyRevenueData[len - 2] || { revenue: 0, tasks: 0, projects: 0, teamMembers: 0 };
    const revenueChange = getChangePercent(latest.revenue, prev.revenue);
    const tasksChange = getChangePercent(latest.tasks, prev.tasks);
    const projectsChange = getChangePercent(latest.projects, prev.projects);
    const teamMembersChange = getChangePercent(latest.teamMembers, prev.teamMembers);

    return {
      stats: {
        totalProjects: {
          value: currentProjects,
          change: projectsChange,
          iconType: "folder",
          color: "bg-blue-100",
        },
        activeTasks: {
          value: tasksRes.count,
          change: tasksChange,
          iconType: "task",
          color: "bg-green-100",
        },
        verificationTasks: {
          value: verificationTasksCount,
          change:null,
          iconType: "verification",
          color: "bg-violet-100",
          showOnlyFor: "verificationStaff"
        },
        teamMembers: {
          value: currentMember,
          change: teamMembersChange,
          iconType: "team",
          color: "bg-purple-100",
        },
        //  teamMembers: {
        //   value: 2,
        //   change: 1,
        //   iconType: "team",
        //   color: "bg-purple-100",
        // },
        revenue: {
          value: `₹${Math.round(totalRevenue).toLocaleString()}`,
          change: revenueChange,
          iconType: "money",
          color: "bg-yellow-100",
        },
        // revenue: {
        //     value: `$45`,
        //     change: 2.4,
        //     iconType: "money",
        //     color: "bg-yellow-100",
        // }
      },
      taskCounts,
      recentTasks: [
        {
          id: 1,
          title: "Quarterly Tax Filing",
          client: "ABC Corp",
          dueDate: "2023-04-15",
          status: "in-progress",
          assignedTo: "John Doe",
        },
        {
          id: 2,
          title: "Annual Financial Statement",
          client: "XYZ Industries",
          dueDate: "2023-04-30",
          status: "pending",
          assignedTo: "Jane Smith",
        },
        {
          id: 3,
          title: "Tax Planning Meeting",
          client: "Tech Solutions Inc.",
          dueDate: "2023-04-10",
          status: "completed",
          assignedTo: "Michael Brown",
        },
        {
          id: 4,
          title: "Payroll Review",
          client: "Global Traders Ltd.",
          dueDate: "2023-04-17",
          status: "in-progress",
          assignedTo: "Alex Johnson",
        },
        {
          id: 5,
          title: "Expense Audit",
          client: "Westside Co.",
          dueDate: "2023-04-22",
          status: "pending",
          assignedTo: "Sarah Wilson",
        },
      ],
      
      projects: projectList,
      
      tasks: taskSummary,
      activities: [
        {
          id: 1,
          type: "task_completed",
          user: {
            name: "John Doe",
            avatar: null,
          },
          content: "Completed quarterly tax filing for ABC Corp",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        },
        {
          id: 2,
          type: "client_added",
          user: {
            name: "Jane Smith",
            avatar: null,
          },
          content: "Added new client XYZ Industries",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: 3,
          type: "document_uploaded",
          user: {
            name: "Michael Brown",
            avatar: null,
          },
          content: "Uploaded financial statements for Tech Solutions Inc.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        },
      ],
      deadlines: [
        {
          id: 1,
          title: "Quarterly VAT Return",
          client: "ABC Corp",
          dueDate: "2023-04-15",
          priority: "High",
        },
        {
          id: 2,
          title: "Annual Compliance Report",
          client: "Tech Solutions Inc.",
          dueDate: "2023-04-30",
          priority: "Medium",
        },
        {
          id: 3,
          title: "Tax Payment Deadline",
          client: "XYZ Industries",
          dueDate: "2023-04-17",
          priority: "High",
        },
      ],
      upcomingDeadlines: [
        {
          id: 1,
          title: "Quarterly VAT Return",
          client: "ABC Corp",
          dueDate: "2023-04-15",
          priority: "High",
        },
        {
          id: 2,
          title: "Annual Compliance Report",
          client: "Tech Solutions Inc.",
          dueDate: "2023-04-30",
          priority: "Medium",
        },
        {
          id: 3,
          title: "Tax Payment Deadline",
          client: "XYZ Industries",
          dueDate: "2023-04-17",
          priority: "High",
        },
        {
          id: 4,
          title: "Financial Statement Filing",
          client: "Global Traders Ltd.",
          dueDate: "2023-05-01",
          priority: "Medium",
        },
      ],
      complianceTasks: [
        {
          id: 1,
          task: "AML Verification",
          client: "ABC Corp",
          dueDate: "2023-04-15",
          status: "Due Soon",
          priority: "High",
        },
        {
          id: 2,
          task: "KYC Documentation Update",
          client: "XYZ Industries",
          dueDate: "2023-04-28",
          status: "Upcoming",
          priority: "Medium",
        },
        {
          id: 3,
          task: "Compliance Audit",
          client: "Tech Solutions Inc.",
          dueDate: "2023-04-20",
          status: "Due Soon",
          priority: "High",
        },
        {
          id: 4,
          task: "Regulatory Filing",
          client: "Global Traders Ltd.",
          dueDate: "2023-05-05",
          status: "Upcoming",
          priority: "Medium",
        },
      ],
      activeProjects: [
        {
          id: 1,
          name: "Audit 2023",
          client: "ABC Corp",
          progress: 65,
          dueDate: "2023-05-15",
        },
        {
          id: 2,
          name: "Tax Planning",
          client: "XYZ Industries",
          progress: 40,
          dueDate: "2023-06-30",
        },
        {
          id: 3,
          name: "Financial Restructuring",
          client: "Tech Solutions Inc.",
          progress: 85,
          dueDate: "2023-04-30",
        },
        {
          id: 4,
          name: "Compliance Review",
          client: "Global Traders Ltd.",
          progress: 20,
          dueDate: "2023-07-15",
        },
      ],
      tasksByStatus: [
        { status: "Completed", count: 128 },
        { status: "In Progress", count: 45 },
        { status: "Pending", count: 34 },
        { status: "Delayed", count: 12 },
      ],
      monthlyRevenueData, // <-- add this for frontend chart
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};