import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { createHttpError } from "../../utils/httpError.js";

export const registerUser = async ({ name, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return { success: true, message: "User registered successfully" };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(400, "User not found while loggin in");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return {
      errorResponse: {
        status: 400,
        body: {
          success: true,
          message: "Invalid password entered",
        },
      },
    };
  }

  user.loginCount += 1;
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token };
};
