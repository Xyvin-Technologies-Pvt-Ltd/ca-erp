import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { userApi } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  Edit3,
  Save,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const statusConfig = {
  active: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle,
  },
  inactive: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: XCircle,
  },
};

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("userData"));
  const userId = storedUser?._id;

  const [profileImage, setProfileImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    department: "",
    status: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const user = await userApi.getUserById(userId);
        setProfileData(user.data);
        if (user.data.avatar) {
          const fullUrl = `${import.meta.env.VITE_BASE_URL}${user.data.avatar}`;
          setProfileImage(fullUrl);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTempImage({ preview: URL.createObjectURL(file) });
      setImageFile(file);
      setImageError(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const rawValue = value.replace(/[^\d]/g, "");
      setProfileData((prev) => ({
        ...prev,
        [name]: rawValue,
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEditToggle = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempImage(null);
    setImageFile(null);
    // Reset form data
    const fetchUser = async () => {
      try {
        const user = await userApi.getUserById(userId);
        setProfileData(user.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("avatar", imageFile);
        await userApi.uploadAvatar(userId, formData);
      }

      const updatedUser = await userApi.updateUser(userId, profileData);
      localStorage.setItem("userData", JSON.stringify(updatedUser.data));

      if (updatedUser.data.avatar) {
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${updatedUser.data.avatar}`;
        setProfileImage(fullUrl);
      }

      setUser(updatedUser.data);
      setTempImage(null);
      setImageFile(null);
      toast.success("Profile saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        className: "bg-emerald-50 border border-emerald-200",
        bodyClassName: "text-emerald-700",
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.", {
        position: "top-right",
        autoClose: 3000,
        className: "bg-red-50 border border-red-200",
        bodyClassName: "text-red-700",
      });
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[^\d]/g, "");
    if (cleaned.length !== 10) return phone;
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  const statusInfo = statusConfig[profileData.status?.toLowerCase()] || statusConfig.inactive;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md w-full max-w-2xl rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
        
        {/* Header Section with Profile Image */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 border-b border-slate-200/50">
          {/* Profile Image - Now inside the card */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {isEditing ? (
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 relative">
                    {tempImage?.preview || (profileImage && !imageError) ? (
                      <motion.img
                        src={tempImage?.preview || profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        <span className="text-xs text-white font-medium hidden sm:block">Change</span>
                      </div>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {profileImage && !imageError ? (
                    <motion.img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Basic Info */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2"
            >
              {profileData.name}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-slate-600 mb-4"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-lg font-medium">{profileData.role}</span>
            </motion.div>
            
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex justify-center"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                <div className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`}></div>
                <StatusIcon className="h-4 w-4" />
                <span>{capitalize(profileData.status)}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Form Section */}
        <div className="relative p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                Name
              </label>
              {isEditing ? (
                <motion.input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-slate-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <p className="px-4 py-3 text-slate-800 font-medium bg-slate-50/50 rounded-xl border border-slate-200/50">
                  {profileData.name}
                </p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                  <Mail className="h-4 w-4" />
                </div>
                Email
              </label>
              {isEditing ? (
                <motion.input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-slate-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <p className="px-4 py-3 text-slate-800 font-medium bg-slate-50/50 rounded-xl border border-slate-200/50">
                  {profileData.email}
                </p>
              )}
            </motion.div>

            {/* Phone Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <Phone className="h-4 w-4" />
                </div>
                Phone
              </label>
              {isEditing ? (
                <motion.input
                  type="tel"
                  name="phone"
                  value={profileData.phone ? formatPhoneNumber(profileData.phone) : ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-slate-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <p className="px-4 py-3 text-slate-800 font-medium bg-slate-50/50 rounded-xl border border-slate-200/50">
                  {formatPhoneNumber(profileData.phone)}
                </p>
              )}
            </motion.div>

            {/* Department Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                  <Building className="h-4 w-4" />
                </div>
                Department
              </label>
              <p className="px-4 py-3 text-slate-800 font-medium bg-slate-50/50 rounded-xl border border-slate-200/50">
                {profileData.department}
              </p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="flex justify-center gap-4 mt-8"
          >
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-3"
                >
                  <motion.button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-300 flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="view"
                  onClick={handleEditToggle}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;