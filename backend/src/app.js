import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import pomodoroRoutes from "./modules/pomodoro/pomodoro.routes.js";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://analytify.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pomodoro", pomodoroRoutes);

export default app;
