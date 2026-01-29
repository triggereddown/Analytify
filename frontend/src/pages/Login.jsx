import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Required for transition
import API from "../api/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="loginDiv bg-[#0a0a0a] h-screen w-full flex text-white  overflow-hidden">
      {/* Left Side: Form Section (layoutId="formBox" matches Register) */}
      <motion.div
        layoutId="formBox"
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="form-section w-full lg:w-[45%] flex flex-col justify-center items-center p-8 relative bg-[#0a0a0a]"
      >
        <div className="absolute top-8 left-8 lg:left-12 flex justify-between w-[85%] items-center">
          <div
            onClick={() => navigate("/")}
            className="logo h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="text-xs font-bold">G</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">New to the platform? </span>
            <button
              onClick={handleRegister}
              className="text-white font-semibold border border-gray-700 px-4 py-2 rounded-full hover:bg-orange-600 transition"
            >
              Register
            </button>
          </div>
        </div>

        <div className="login-wrapper w-full max-w-[400px]">
          <div className="upperdiv mb-10 text-center flex flex-col items-center">
            <div className="Usericon bg-[#1a1a1a] border border-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold mb-2">
              Login to your account
            </h2>
            <p className="text-gray-500">Enter your details to login.</p>
          </div>

          <div className="inputfields">
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-400 ml-1">Email</label>
                <input
                  className="bg-[#141414] border border-gray-800 focus:border-orange-600 outline-none rounded-full p-3 text-sm transition-all"
                  type="email"
                  value={email}
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm text-gray-400">Password</label>
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-orange-500"
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  className="bg-[#141414] border border-gray-800 focus:border-orange-600 outline-none rounded-full p-3 text-sm transition-all"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full py-4 mt-2 transition-all shadow-lg shadow-orange-900/20"
                type="submit"
              >
                Login
              </button>
            </form>
          </div>
        </div>

        <div className="absolute bottom-8 text-xs text-gray-600 flex justify-between w-[85%]">
          <span>© 2026 Analytify</span>
          <span>Crafted in Batcave(IN)</span>
        </div>
      </motion.div>

      {/* Right Side: Visual Section (layoutId="visualBox" matches Register) */}
      <motion.div
        layoutId="visualBox"
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="visual-section hidden lg:flex flex-1 bg-gradient-to-br from-[#121212] to-[#000000] items-center justify-center p-12 relative z-10"
      >
        <div className="relative w-full h-full max-w-lg aspect-square">
          <div className="absolute inset-0 bg-orange-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-gradient-to-b from-[#1a1a1a] to-black border border-gray-800 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-orange-600/20 blur-3xl rounded-full"></div>
            <div className="p-10 text-center">
              <div className="w-20 h-2 bg-orange-600 rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-4">Login Karoww</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Take back control with our powerful Productivity analytics
                platform that gives you 100% data ownership.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
