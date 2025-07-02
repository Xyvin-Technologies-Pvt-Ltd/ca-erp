import React, { useEffect, useState } from "react";
import { IoMdCloudUpload, IoMdPerson, IoMdMail, IoMdCall, IoMdBriefcase } from "react-icons/io";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { userApi } from "../api/userApi";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("userData"));
  const userId = storedUser?._id;

  const [profileImage, setProfileImage] = useState(null);
  const [tempImage, setTempImage] = useState(null); // for preview
  const [imageFile, setImageFile] = useState(null); // file to upload
  const [imageError, setImageError] = useState(false); // Track image load failure

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
    // Remove non-digit characters for phone number storage
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
      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("avatar", imageFile);
        await userApi.uploadAvatar(userId, formData);
        // toast.success("Avatar uploaded successfully!");
      }

      const updatedUser = await userApi.updateUser(userId, profileData);
      localStorage.setItem("userData", JSON.stringify(updatedUser.data));

      // Refresh avatar preview
      if (updatedUser.data.avatar) {
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${updatedUser.data.avatar}`;
        setProfileImage(fullUrl);
      }
    
      setUser(updatedUser.data);
      setTempImage(null);
      setImageFile(null);
      toast.success("Profile saved successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error("Save error:", error);
    }
  };

  // Utility to capitalize first letter
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Utility to format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[^\d]/g, "");
    if (cleaned.length !== 10) return phone; // Return raw if invalid length
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  return (
    <div className="max-h-screen bg-gradient-to-br flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-4 relative text-center mt-20">
        {/* Profile Image */}
        <div className="absolute -top-16 inset-x-0 mx-auto flex justify-center">
          {isEditing ? (
            <label className="relative cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {tempImage?.preview || (profileImage && !imageError) ? (
                  <img
                    src={tempImage?.preview || profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)} // Handle image load failure
                  />
                ) : (
                  <svg
                    className="w-full h-full text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
            </label>
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              {profileImage && !imageError ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)} // Handle image load failure
                />
              ) : (
                <svg
                  className="w-full h-full text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-gray-800">
            {profileData.name}
          </h2>
          <p className="text-gray-500">{profileData.role}</p>

          <div className="mt-3 space-y-4 text-left">
            {/* Name and Email */}
            <div className="flex gap-4">
              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-medium text-black flex items-center">
                  <IoMdPerson className="mr-2" /> Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.name}</p>
                )}
              </div>

              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-medium text-black flex items-center">
                  <IoMdMail className="mr-2" /> Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.email}</p>
                )}
              </div>
            </div>

            {/* Phone and Department */}
            <div className="flex gap-4">
              <div className="w-1/2 flex flex-col gap-1">
                <label className="text-sm font-medium text-black flex items-center">
                  <IoMdCall className="mr-2" /> Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone ? formatPhoneNumber(profileData.phone) : ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="text-black">{formatPhoneNumber(profileData.phone)}</p>
                )}
              </div>

              <div className="w-1/2 flex flex-col gap-1">
                <label className="block text-sm font-medium text-black flex items-center">
                  <IoMdBriefcase className="mr-2" /> Department
                </label>
                <p className="mt-1 text-gray-800">{profileData.department}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium text-black">
                Status
              </label>
              <p
                className={`mt-1 font-medium ${profileData.status.toLowerCase() === "active"
                    ? "text-green-600"
                    : "text-red-600"
                  }`}
              >
                {capitalize(profileData.status)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-7 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-md transition-all mb-10"
              >
                Save
              </button>
            ) : (
              <button
                onClick={handleEditToggle}
                className="px-7 py-2 bg-blue-400 hover:bg-blue-600 text-white font-semibold rounded-full shadow-md transition-all mb-10"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;