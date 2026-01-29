// import User from "../models/User.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    //body se password email aur name ki bheekh mango
    const { name, email, password } = req.body;

    //check krte hai ki hashed password hua ki nhi
    const hashedPassword = await bcrypt.hash(password, 10);
    //naya user banao
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    res.json({ success: true, message: "User registered successfully" });
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

    //check krte hai user hai ki nhi
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found while loggin in",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: true,
        message: "Invalid password entered",
      });
    }

    user.loginCount += 1;
    await user.save();

    //toiken banao
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login unsuccessful",
      error: error.message,
    });
  }
};
