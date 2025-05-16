import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { ROUTES } from "../config/constants";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const navigation = [
  { name: "Dashboard", to: ROUTES.DASHBOARD, icon: HomeIcon },
  { name: "Clients", to: ROUTES.CLIENTS, icon: UserGroupIcon },
  { name: "Leads", to: ROUTES.LEADS, icon: UserPlusIcon },
  { name: "Projects", to: ROUTES.PROJECTS, icon: BriefcaseIcon },
  { name: "Tasks", to: ROUTES.TASKS, icon: ClipboardDocumentListIcon },
  { name: "Documents", to: ROUTES.DOCUMENTS, icon: DocumentIcon },
  {
    name: "Finance",
    to: ROUTES.FINANCE,
    icon: CurrencyDollarIcon,
    roles: ["finance", "admin"],
  },
  { name: "Project List", to: ROUTES.PROJECTCART, icon: BriefcaseIcon },
];

const secondaryNavigation = [
  { name: "Profile", to: ROUTES.PROFILE, icon: UserCircleIcon },
  { name: "Settings", to: ROUTES.SETTINGS, icon: Cog6ToothIcon },
];

const Sidebar = ({ onCloseMobile ,projects = []}) => {
  const location = useLocation();
  const { user, role } = useAuth();
  const [logoFilename, setLogoFilename] = useState("");

  useEffect(() => {
  const fetchLogo = async () => {
    try {
      const response = await api.get("/settings");
      const logo = response.data?.data?.company?.logo;

      if (logo) {
        const fullLogoUrl = `${import.meta.env.VITE_BASE_URL}${logo}`;
        setLogoFilename(fullLogoUrl);
      }
    } catch (error) {
      console.error("Failed to load logo", error);
    }
  };

  fetchLogo();
}, []);



  // Check if a nav item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Return nothing if user isn't authenticated
  if (!user) return null;

  // Filter navigation items based on user role
  // const filteredNavigation = navigation.filter(
  //   (item) => !item.roles || item.roles.includes(role || "staff")
  // );


  const getVisibleNavigation = (role) => {
    return navigation.filter((item) => {
      switch (item.name) {
        case "Dashboard":
          return true;
        case "Clients":
        // case "Leads":
        case "Documents":
          return role === "admin" || role === "manager";
        case "Projects":
          return ["admin", "manager", "staff"].includes(role);
          case "Tasks":
            return ["admin", "manager", "staff"].includes(role);
        case "Finance":
          return ["admin", "manager", "finance"].includes(role);
        // case "Project List":
        //   return role === "finance";
        default:
          return false;
      }
    });
  };

  const filteredNavigation = getVisibleNavigation(role || "staff")


  return (
    <div className="h-full flex flex-col">
      {/* Logo and mobile close button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link to={ROUTES.DASHBOARD} className="flex-shrink-0">
         {logoFilename ? (
            <img src={logoFilename} alt="Company Logo" className="h-10 object-contain" />
          ) : (
            <span className="text-blue-600 font-bold text-2xl">CA-ERP</span>
          )}
          {/* <span className="text-blue-600 font-bold text-2xl">CA-ERP</span> */}
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            className="md:hidden -mr-3 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={onCloseMobile}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-2 space-y-1 bg-white">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              onClick={onCloseMobile}
              className={`${
                isActive(item.to)
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                  : "text-gray-700 hover:bg-gray-50"
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <item.icon
                className={`${
                  isActive(item.to)
                    ? "text-blue-500"
                    : "text-gray-500 group-hover:text-gray-600"
                } mr-3 flex-shrink-0 h-6 w-6`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Secondary links and user info */}
      <div className="px-2 space-y-1 mb-2">
      {secondaryNavigation
          .filter((item) => {
            if (item.name === "Settings") {
              return role === "admin" || role === "manager";
            }
            return true;
          })
          .map((item) => (
              <Link
                key={item.name}
                to={item.to}
                onClick={onCloseMobile}
                className={`${
                  isActive(item.to)
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                    : "text-gray-700 hover:bg-gray-50"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive(item.to)
                      ? "text-blue-500"
                      : "text-gray-500 group-hover:text-gray-600"
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${user.avatar}`}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name ? user.name.charAt(0) : "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user.name || "User"}
              </p>
              <p className="text-xs font-medium text-gray-500">
                {role?.charAt(0).toUpperCase() + role?.slice(1) || "Role"}
              </p>
            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default Sidebar;
