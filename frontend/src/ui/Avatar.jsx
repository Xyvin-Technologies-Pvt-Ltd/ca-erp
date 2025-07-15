import React from "react";

const sizes = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const generateInitials = (name) => {
  if (!name) return "?";

  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const generateColor = (name) => {
  const colors = [
    "bg-[#1c6ead]",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  if (!name) return colors[0];

  // Use a simple hash function to determine color
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const Avatar = ({ name, src, size = "md", className = "", ...props }) => {
  const sizeClass = sizes[size] || sizes.md;
  const initials = generateInitials(name);
  const bgColor = generateColor(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${sizeClass} ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full text-white ${bgColor}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

export default Avatar;
