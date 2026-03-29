import { useNavigate } from "react-router-dom";
import { loginRequest, registerRequest } from "../api/authApi";

export const useAuthActions = () => {
  const navigate = useNavigate();

  const login = async ({ email, password }) => {
    const response = await loginRequest({ email, password });
    localStorage.setItem("token", response.data.token);
    navigate("/dashboard");
  };

  const register = async ({ name, email, password }) => {
    await registerRequest({ name, email, password });
    navigate("/login");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return { login, register, logout };
};
