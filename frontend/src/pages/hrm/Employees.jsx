import React from "react";
import UserManagement from "../../components/settings/UserManagement";

const Employees = () => {
  return (
    <div className="space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
          </div>
        </div>
      </div>

      {/* UserManagement Component */}
      <UserManagement />
    </div>
  );
};

export default Employees; 