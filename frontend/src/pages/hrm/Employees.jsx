import React from "react";
import UserManagement from "../../components/settings/UserManagement";

const Employees = () => {
  return (
    <div className="space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Employees
            </h1>
            <p className="text-gray-600">Manage your organization's employees</p>
          </div>
        </div>
      </div>

      {/* UserManagement Component */}
      <UserManagement />
    </div>
  );
};

export default Employees; 