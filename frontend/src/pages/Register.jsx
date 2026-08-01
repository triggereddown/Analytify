import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Add this
import { useAuthActions } from "../features/auth/hooks/useAuthActions";
import PersonIcon from "@mui/icons-material/Person";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register({ name, email, password });
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  const handleLoginRedirect = () => {
    // Navigate to login; Framer Motion handles the 'exit' if configured in App.js
    navigate("/login");
  };

  return (
    <div className="loginDiv bg-[#0a0a0a] h-screen w-full flex text-cream  overflow-hidden">
      {/* Right Side: Visual Graphic (Now on the Left) */}
      <motion.div
        layoutId="visualBox" // Matches the ID in Login.jsx for seamless transition
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="visual-section hidden lg:flex flex-1 bg-gradient-to-br from-[#121212] to-[#000000] items-center justify-center p-12 relative z-10"
      >
        <div className="relative w-full h-full max-w-lg aspect-square">
          <div className="absolute inset-0 bg-cream/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-gradient-to-b from-[#1a1a1a] to-black border border-gray-800 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-cream/20 blur-3xl rounded-full"></div>
            <div className="p-10 text-center">
              <div className="w-20 h-2 bg-cream rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-4">
                Empower Your Decisions
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Take back control with our powerful web analytics platform that
                gives you 100% data ownership.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Left Side: Form Section (Now on the Right) */}
      <motion.div
        layoutId="formBox"
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="form-section w-full lg:w-[45%] flex flex-col justify-center items-center p-8 relative bg-[#0a0a0a]"
      >
        <div className="absolute top-8 left-8 lg:left-12 flex justify-between w-[85%] items-center">
          <div
            onClick={() => navigate("/")}
            className="logo h-8 w-8 bg-cream rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="text-xs font-bold">G</span>
          </div>
          <div className="text-base">
            <span className="text-gray-300">Already have an account? </span>
            <button
              onClick={handleLoginRedirect}
              className="text-cream font-semibold border border-gray-700 px-4 py-2 rounded-full hover:bg-cream/10 transition"
            >
              Login
            </button>
          </div>
        </div>

        <div className="login-wrapper w-full max-w-[400px]">
          <div className="upperdiv mb-10 text-center flex flex-col items-center">
            <div className="Usericon bg-[#1a1a1a] border border-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <PersonIcon className="text-gray-400" sx={{ fontSize: 32 }} />
            </div>
            <h2 className="text-3xl font-semibold mb-2">
              Register for an account
            </h2>
            <p className="text-gray-400">Enter your details to register.</p>
          </div>

          <div className="inputfields">
            <form className="flex flex-col gap-5" onSubmit={handleRegister}>
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-300 ml-1">UserName</label>
                <input
                  className="bg-[#141414] border border-gray-800 focus:border-orange-600 outline-none rounded-full p-3 text-base transition-all"
                  type="text"
                  value={name}
                  placeholder="Alfred Kumar"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-300 ml-1">Email</label>
                <input
                  className="bg-[#141414] border border-gray-800 focus:border-orange-600 outline-none rounded-full p-3 text-base transition-all"
                  type="email"
                  value={email}
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-base text-gray-300">Password</label>
                </div>
                <input
                  className="bg-[#141414] border border-gray-800 focus:border-orange-600 outline-none rounded-full p-3 text-base transition-all"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="bg-cream hover:bg-white text-black font-bold rounded-full py-4 mt-2 transition-all shadow-lg shadow-cream/10"
                type="submit"
              >
                Register
              </button>
            </form>
          </div>
        </div>

        <div className="absolute bottom-8 text-sm text-gray-400 flex justify-between w-[85%]">
          <span>© 2026 Analytify</span>
          <span>Made in India</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
