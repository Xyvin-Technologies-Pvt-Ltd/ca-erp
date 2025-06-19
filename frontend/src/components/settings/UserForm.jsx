import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ROLES } from "../../config/constants";
import { userApi } from "../../api/userApi";
import { getDepartments } from '../../api/department.api';

import { toast } from "react-toastify";

// const departments = [
//   "Management",
//   "Audit",
//   "Tax",
//   "Finance",
//   "Consulting",
//   "Compliance",
//   "Operations",
//   "Legal",
//   "IT",
// ];

const UserForm = ({ user = null, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const isEditMode = !!user;
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: user || {
      name: "",
      email: "",
      role: ROLES.STAFF,
      phone: "",
      department: "",
      avatar: null,
    },
  });

  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);
  useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      // Assuming response format: { data: [{ name: 'Audit' }, { name: 'IT' }] }
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      toast.error("Could not load departments");
    }
  };

  fetchDepartments();
}, []);

 
  const submitHandler = async (data) => {
    setLoading(true);
    try {
      let response;
      if (isEditMode) {
        // Update existing user
        const { confirmPassword, ...updateData } = data;
        // Only remove password from updateData if we're not resetting it
        if (!showPasswordReset) {
          delete updateData.password;
        }
        
        response = await userApi.updateUser(user._id, updateData);
        // toast.success("User updated successfully");
          onSubmit(response.data);

       
      } else {
        // Create new user - ensure password is included for new users
        if (!data.password) {
          throw new Error("Password is required for new users");
        }
        // Remove confirmPassword from the data sent to API
        const { confirmPassword, ...createData } = data;
        
        // Ensure role is set if not provided
        if (!createData.role) {
          createData.role = ROLES.STAFF;
        }
        
      //   response = await userApi.createUser(createData);
      //   toast.success("User created successfully");
      // }

      // if (response?.data) {
      //   onSubmit(response.data);
      // } else {
      //   throw new Error("Invalid response from server");

      onSubmit(createData);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to save user. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <div className="px-6 py-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name", { required: "Full name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Email address is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              {...register("phone", {
                pattern: {
                  value:
                    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                  message: "Invalid phone number format",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 234 567 8901"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="role"
                {...register("role", { required: "Role is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ROLES.ADMIN}>Administrator</option>
                <option value={ROLES.MANAGER}>Manager</option>
                <option value={ROLES.FINANCE}>Finance</option>
                <option value={ROLES.STAFF}>Staff</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

           <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Department
              </label>
              <select
                id="department"
                {...register("department", {
                  required: "Department is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a department</option>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept._id || dept.name} value={dept.name}>
                      {dept.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading...</option>
                )}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.department.message}
                </p>
              )}
            </div>
          </div>

          {isEditMode && (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="resetPassword"
          checked={showPasswordReset}
          onChange={(e) => setShowPasswordReset(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="resetPassword" className="ml-2 block text-sm text-gray-900">
          Reset Password
        </label>
      </div>

      {showPasswordReset && (
  <div className="space-y-4">
    <div>
      <label
        htmlFor="newPassword"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        New Password
      </label>
      <input
        id="newPassword"
        type="password"
        {...register("password", {
          required: "New password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
      {errors.password && (
        <p className="mt-1 text-sm text-red-600">
          {errors.password.message}
        </p>
      )}
    </div>

    <div>
      <label
        htmlFor="confirmPassword"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Confirm New Password
      </label>
      <input
        id="confirmPassword"
        type="password"
        {...register("confirmPassword", {
          required: "Please confirm your new password",
          validate: (value) =>
            value === watch("password") || "Passwords do not match",
        })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
      {errors.confirmPassword && (
        <p className="mt-1 text-sm text-red-600">
          {errors.confirmPassword.message}
        </p>
      )}
    </div>
  </div>
)}

    </div>
  )}

          {/* In a real app, we would add password fields for new users and ability to upload avatar */}
          {!isEditMode && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    validate: (value) => {
                      if (!isEditMode && !value) {
                        return "Password is required for new users";
                      }
                      return true;
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value, formValues) =>
                      value === formValues.password || "Passwords do not match",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Saving..." : isEditMode ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
