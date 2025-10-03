import React, { useState } from "react";
import { Input, Label } from "./ui/index";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import loginBackground from "../assets/login-bg.png";
import loginIcon from "../assets/Group 160.svg";
import api from "@/utils/interceptor";


interface LoginForm {
  full_name?: string;
  email: string;
  password: string;
  confirm_password?: string;
}

const API_BASE = "http://localhost:80";

export const Login = () => {
  const [active, setActive] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<LoginForm>({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const autoLogin = async () => {
    try {
      const loginResponse = await fetch(`http://localhost:80?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginResponse.json();
      console.log(loginData);
      

      if (loginResponse.ok && loginData.token) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("auth", "true");
        localStorage.setItem("user", JSON.stringify(loginData.user));

        if (JSON.stringify(loginData?.user?.role) === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/checkin");
        }
      } else {
        setMessage(loginData.error || "Auto-login failed");
      }
    } catch (error) {
      setMessage("Network error during auto-login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (active === "register" && form.password !== form.confirm_password) {
      setMessage("Password and confirm password do not match");
      return;
    }

    try {
      const action = active === "login" ? "login" : "register";
      console.log(action);
      console.log(form);

      const response = await api.post(`${API_BASE}?action=${action}`, form);
      console.log(response);

      const data = response.data;
      console.log(data);

      if (!response) {
        setMessage(data.error || "Something went wrong");
      } else {
        setMessage(data.message || "Success!");

        if (active === "register") {
          await autoLogin(); // Only call login once
        } else if (active === "login" && data.token) {
        

          localStorage.setItem("token", data.token);
          localStorage.setItem("auth", "true");
          localStorage.setItem("user", JSON.stringify(data.user));

          if (data.user.role === "admin") {
            navigate("/dashboard");
          } else {
            navigate("/checkin");
          }
        }
      }
    } catch (error) {
      console.log(error);
      setMessage("Network error");
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <img
        src={loginBackground}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Background"
      />

      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className="bg-white p-8 rounded-lg shadow-lg min-w-[300px] flex flex-col gap-4">
          {/* Logo */}
          <div className="flex items-center justify-center flex-col gap-4">
            <img src={loginIcon} alt="Logo" />
            <h2 className="text-2xl font-bold text-center">
              Attendance Management System
            </h2>
          </div>

          {/* Login/Register toggle */}
          <div className="bg-gray-300 rounded-2xl p-1 mb-4 flex">
            <button
              type="button"
              className={`flex-1 py-2 rounded-2xl transition-colors ${
                active === "login"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
              onClick={() => setActive("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-2xl transition-colors ${
                active === "register"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
              onClick={() => setActive("register")}
            >
              Register
            </button>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Full name for registration */}
            {active === "register" && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>

            {/* Confirm password */}
            {active === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  placeholder="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={handleChange}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  }
                />
              </div>
            )}

            {message && (
              <p className="text-red-500 text-sm text-center">{message}</p>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 rounded-[32px] text-white bg-green-500 hover:bg-green-600 transition-all"
            >
              {active === "login" ? "Login" : "Register"}
            </button>

            <a
              href="#"
              className="italic underline text-center block text-sm text-gray-700"
            >
              Need help? Contact our team
            </a>
          </form>
        </div>
      </div>
    </div>
  );
};
