import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "../ui";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../config/constants";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { checkIn } from "../api/attendance";
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const { login, isLoading, error, clearError, isAuthenticated, isSuperadmin } =
    useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    // defaultValues: {
    //   email: "admin@ca-erp.com",
    //   password: "Admin@123",
    // },
  });

  // Clear auth errors when unmounting
  useEffect(() => {
    return () => {
      if (error) clearError();
    };
  }, [error, clearError]);

const onSubmit = async (data) => {
  try {
    let now = new Date();

    // Get user's location
    let location = null;
    try {
      // GPS-based location
      location = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              source: "gps",
            });
          },
          async (err) => {
            console.warn("GPS location failed:", err.message);
            // Fallback: IP-based lookup
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            resolve({
              lat: data.latitude,
              lon: data.longitude,
              city: data.city,
              region: data.region,
              country: data.country_name,
              source: "ip",
            });
          },
          { timeout: 5000 }
        );
      });
    } catch (error) {
      console.error("Location error:", error);
    }

    // Login
    const result = await login(data);

    // Send location & time to backend
    const res = await checkIn({ now, location });
    console.log("Check-in response:", res);

    if (res.beforeNine) {
      toast.error(res.msg);
    }

    // Redirect
    if (result?.user?.superadmin) {
      navigate(ROUTES.SETTINGS);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="bg-white/90 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4 border border-red-200 animate-fade-in">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Email Address"
            id="email"
            type="email"
            autoComplete="email"
            required
            className="focus:ring-[#1c6ead] focus:border-[#1c6ead]"
            {...register("email")}
            error={errors.email?.message}
          />

          <div className="relative">
            <Input
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="focus:ring-[#1c6ead] focus:border-[#1c6ead]"
              {...register("password")}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-0 pr-3 flex items-center text-slate-400 hover:text-[#1c6ead] transition-colors duration-200"
              style={{ top: "2.24rem" }} // Fixed offset to align with input field
            >
              {showPassword ? (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="bg-[#1c6ead] hover:bg-[#175a99] text-white font-semibold shadow-md transition-all duration-200 rounded-xl py-2"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
