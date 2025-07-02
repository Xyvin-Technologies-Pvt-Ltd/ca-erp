import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { userApi } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const statusColors = {
  active: " text-green-700 border-green-200",
  inactive: " text-red-700 border-red-200",
};

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("userData"));
  const userId = storedUser?._id;

  const [profileImage, setProfileImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(false);

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

  const handleSave = async () => {
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
        className: "bg-green-50 border border-green-200",
        bodyClassName: "text-green-700",
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
    }
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[^\d]/g, "");
    if (cleaned.length !== 10) return phone;
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative text-center mt-20 border border-gray-200 hover:shadow-2xl transition-all duration-300"
      >
        {/* Profile Image */}
        <div className="absolute -top-16 inset-x-0 mx-auto flex justify-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
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
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative">
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
                    <motion.svg
                      className="w-full h-full text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </motion.svg>
                  )}
                  <div className="absolute inset-0 bg-indigo-600 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                    <CloudArrowUpIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </label>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
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
                  <motion.svg
                    className="w-full h-full text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </motion.svg>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Section */}
        <div className="mt-20">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-semibold text-gray-800"
          >
            {profileData.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-500"
          >
            {profileData.role}
          </motion.p>

          <div className="mt-6 space-y-6 text-left">
            {/* Name and Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex gap-4"
            >
              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Name
                </label>
                {isEditing ? (
                  <motion.input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full border border-indigo-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <p className="text-gray-800">{profileData.name}</p>
                )}
              </div>

              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Email
                </label>
                {isEditing ? (
                  <motion.input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full border border-indigo-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <p className="text-gray-800">{profileData.email}</p>
                )}
              </div>
            </motion.div>

            {/* Phone and Department */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="flex gap-4"
            >
              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <PhoneIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Phone
                </label>
                {isEditing ? (
                  <motion.input
                    type="tel"
                    name="phone"
                    value={profileData.phone ? formatPhoneNumber(profileData.phone) : ""}
                    onChange={handleInputChange}
                    className="w-full border border-indigo-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <p className="text-gray-800">{formatPhoneNumber(profileData.phone)}</p>
                )}
              </div>

              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Department
                </label>
                <p className="text-gray-800">{profileData.department}</p>
              </div>
            </motion.div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex flex-col gap-1"
            >
              <label className="text-sm font-semibold text-gray-700">
                Status
              </label>
              <motion.span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[profileData.status.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200"} max-w-max`}
                whileHover={{ scale: 1.05 }}
              >
                <span className={`h-2 w-2 rounded-full mr-2 ${statusColors[profileData.status.toLowerCase()]?.split(' ')[0] || "bg-gray-100"}`}></span>
                {capitalize(profileData.status)}
              </motion.span>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-6"
          >
            {isEditing ? (
              <motion.button
                onClick={handleSave}
                className="px-7 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save
              </motion.button>
            ) : (
              <motion.button
                onClick={handleEditToggle}
                className="px-7 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Edit
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;