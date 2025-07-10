import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ROLES } from "../../config/constants";
import { userApi } from "../../api/userApi";
import { getDepartments } from '../../api/department.api';
import { getPositions } from '../../api/positions.api';
import { toast } from "react-toastify";
import { X, UserPlus, UserCog } from "lucide-react";

const UserForm = ({ user = null, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
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
      role: "",
      phone: "",
      department: "",
      avatar: null,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        ...user,
        department: user.department || '',
        position: user.position?._id || user.position || '',
      });
    }
  }, [user, reset]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        setDepartments(response.data || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Could not load departments");
      }
    };
    const fetchPositions = async () => {
      try {
        const response = await getPositions();
        setPositions(response.data || []);
      } catch (error) {
        setPositions([]);
      }
    };
    fetchDepartments();
    fetchPositions();
  }, []);

  const submitHandler = async (data) => {
    setLoading(true);
    try {
      let response;
      if (isEditMode) {
        const { confirmPassword, ...updateData } = data;
        if (!showPasswordReset) {
          delete updateData.password;
        }
        
        response = await userApi.updateUser(user._id, updateData);
        onSubmit(response.data);
      } else {
        if (!data.password) {
          throw new Error("Password is required for new users");
        }
        const { confirmPassword, ...createData } = data;
        
        if (!createData.role) {
          createData.role = ROLES.STAFF;
        }
        
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
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 min-h-screen overflow-hidden"
      onClick={onCancel}
    >
      <style>
        {`
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
          }
          .animate-wiggle:hover {
            animation: wiggle 0.3s ease-in-out;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b6cb7;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3b5898;
          }
        `}
      </style>
      <div 
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm">
                {isEditMode ? (
                  <UserCog className="h-6 w-6 animate-wiggle" />
                ) : (
                  <UserPlus className="h-6 w-6 animate-wiggle" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? "Edit User" : "Create New User"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditMode ? "Update user details" : "Add a new user to the system"}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-105"
            >
              <X className="h-6 w-6 animate-wiggle" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="text"
                  {...register("phone", {
                    pattern: {
                      value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                      message: "Invalid phone number format",
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="+1 234 567 8901"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    {...register("role", { required: "Role is required" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select a role</option>
                    <option value={ROLES.ADMIN}>Administrator</option>
                    <option value={ROLES.MANAGER}>Manager</option>
                    <option value={ROLES.FINANCE}>Finance</option>
                    <option value={ROLES.STAFF}>Staff</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    {...register("department", {
                      required: "Department is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="position"
                    {...register("position", {
                      required: "Position is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select a position</option>
                    {positions.length > 0 ? (
                      positions.map((pos) => (
                        <option key={pos._id} value={pos._id}>
                          {pos.title}
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading...</option>
                    )}
                  </select>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
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
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                    />
                    <label htmlFor="resetPassword" className="ml-2 block text-sm font-medium text-gray-900">
                      Reset Password
                    </label>
                  </div>

                  {showPasswordReset && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          New Password <span className="text-red-500">*</span>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          {...register("confirmPassword", {
                            required: "Please confirm your new password",
                            validate: (value) =>
                              value === watch("password") || "Passwords do not match",
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isEditMode && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value, formValues) =>
                          value === formValues.password || "Passwords do not match",
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
                  onCancel();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : isEditMode ? (
                <UserCog className="h-4 w-4 mr-2 animate-wiggle" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2 animate-wiggle" />
              )}
              {loading ? "Saving..." : isEditMode ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;