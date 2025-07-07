import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  ClipboardList,
  FileText,
  User,
  Settings,
  X,
  DollarSign,
  UserCheck,
  ChevronDown,
  Building,
  Calendar,
  Clock,
  CalendarDays,
  Folder,
  Zap,
} from "lucide-react";
import { ROUTES } from "../config/constants";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const navigation = [
  { name: "Dashboard", to: ROUTES.DASHBOARD, icon: Home },
  {
    name: "Employee",
    icon: User,
    children: [
      {
        name: "My Attendance",
        to: ROUTES.EMPLOYEE_ATTENDANCE,
        icon: Clock,
      },
      {
        name: "Projects",
        to: ROUTES.PROJECTS,
        icon: Briefcase,
      },
      {
        name: "Tasks",
        to: ROUTES.TASKS,
        icon: ClipboardList,
      },
      {
        name: "Leave Application",
        to: ROUTES.EMP_LeaveApplication,
        icon: Calendar,
      },
      { name: "Profile", to: ROUTES.PROFILE, icon: UserCheck },
    ],
  },
  {
    name: "HRM",
    icon: Users,
    children: [
      {
        name: "Employees",
        to: ROUTES.HRM_EMPLOYEES,
        icon: Users,
      },
      {
        name: "Attendance",
        to: ROUTES.HRM_ATTENDANCE,
        icon: Clock,
      },
      {
        name: "Departments",
        to: ROUTES.HRM_DEPARTMENTS,
        icon: Building,
      },
      {
        name: "Positions",
        to: ROUTES.HRM_POSITIONS,
        icon: Briefcase,
      },
      {
        name: "Events",
        to: ROUTES.HRM_EVENTS,
        icon: CalendarDays,
      },
      {
        name: "Leaves",
        to: ROUTES.HRM_LEAVES,
        icon: Folder,
      },
    ],
  },
  { name: "Clients", to: ROUTES.CLIENTS, icon: Users },
  { name: "Documents", to: ROUTES.DOCUMENTS, icon: FileText },
  {
    name: "Finance",
    to: ROUTES.FINANCE,
    icon: DollarSign,
    roles: ["finance", "admin"],
  },
  { name: "Settings", to: ROUTES.SETTINGS, icon: Settings, roles: ["admin", "manager"] },
];

const Sidebar = ({ onCloseMobile, projects = [] }) => {
  const location = useLocation();
  const { user, role } = useAuth();
  const [logoFilename, setLogoFilename] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await api.get("/settings");
        const logo = response.data?.data?.company?.logo;
        const company = response.data?.data?.company;

        if (company?.logo) {
          const fullLogoUrl = `${import.meta.env.VITE_BASE_URL}${company.logo}`;
          setLogoFilename(fullLogoUrl);
        }

        if (company?.name) {
          setCompanyName(company.name);
        }
      } catch (error) {
        console.error("Failed to load logo", error);
      }
    };

    fetchLogo();
  }, []);

  const toggleExpand = (itemName) => {
    setExpandedItems((prev) => {
      const newExpanded = {};
      // Only expand the clicked item, collapse all others
      newExpanded[itemName] = !prev[itemName];
      return newExpanded;
    });
  };

  // Collapse all expandable items when navigating to a top-level route
  useEffect(() => {
    const isTopLevelRoute = navigation.some(
      (item) => !item.children && item.to === location.pathname
    );
    if (isTopLevelRoute) {
      setExpandedItems({});
    }
  }, [location.pathname]);

  const getVisibleNavigation = (role) => {
    return navigation.filter((item) => {
      switch (item.name) {
        case "Dashboard":
          return true;
        case "Clients":
        case "Documents":
          return role === "admin" || role === "manager";
        case "Finance":
          return ["admin", "manager", "finance"].includes(role);
        case "Employee":
           return true;
        case "HRM":
          return ["admin", "manager"].includes(role);
        case "Settings":
        return item.roles ? item.roles.includes(role) : true;
        default:
          return false;
      }
    });
  };

  const filteredNavigation = getVisibleNavigation(role || "staff");

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white shadow-xl border-r border-slate-200/50">
      {/* Logo and mobile close button */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm ml-5">
        <Link to={ROUTES.DASHBOARD} className="flex-shrink-0 group">
          {logoFilename ? (
            <img 
              src={logoFilename} 
              alt="Company Logo" 
              className="h-10 object-contain transition-all duration-300 group-hover:scale-105" 
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg ml-5">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-800 font-bold text-xl tracking-tight">
                {companyName || "Company"}
              </span>
            </div>
          )}
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            className="md:hidden -mr-2 h-10 w-10 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
            onClick={onCloseMobile}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-6 pb-4 ">
        <nav className="flex-1 px-4 space-y-2 ">
          {filteredNavigation.map((item) => {
            const isExpanded = expandedItems[item.name];
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`w-full flex items-center cursor-pointer px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                        isExpanded
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                          : "text-slate-700 hover:bg-white hover:shadow-md hover:border hover:border-slate-200"
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isExpanded 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left ml-3 font-medium">{item.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isExpanded ? "transform rotate-180 text-blue-500" : "text-slate-400"
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.to}
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group ${
                              location.pathname === child.to
                                ? "bg-blue-500 text-white shadow-md transform scale-[1.02]"
                                : "text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm hover:transform hover:scale-[1.01]"
                            }`}
                          >
                            <div className={`p-1.5 rounded-md transition-all duration-300 ${
                              location.pathname === child.to
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            }`}>
                              <child.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="ml-3">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.to}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                      location.pathname === item.to
                        ? "bg-blue-500 text-white shadow-lg transform scale-[1.02]"
                        : "text-slate-700 hover:bg-white hover:shadow-md hover:border hover:border-slate-200 hover:transform hover:scale-[1.01]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      location.pathname === item.to
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User info */}
      {user && (
        <div className="border-t border-slate-200/50 p-4 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${user.avatar}`}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md border-2 border-white">
                  <span className="text-white font-semibold text-sm">
                    {user.name ? user.name.charAt(0) : "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user.name || "User"}
              </p>
              <p className="text-xs font-medium text-slate-500 leading-tight">
                {role?.charAt(0).toUpperCase() + role?.slice(1) || "Role"}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;