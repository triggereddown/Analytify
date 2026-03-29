import { loginUser, registerUser } from "./auth.service.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registeration error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    if (result.errorResponse) {
      return res
        .status(result.errorResponse.status)
        .json(result.errorResponse.body);
    }

    res.json({ token: result.token });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Login unsuccessful",
      error: error.message,
    });
  }
};
