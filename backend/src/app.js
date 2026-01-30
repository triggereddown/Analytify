import express from "express";
import cors from "cors";
import authRoutes from "../src/routes/auth.routes.js";
import pomodoroRoutes from "./routes/pomodoro.routes.js";

const app = express();
app.use(
  cors({
    origin: [
      //   "http://localhost:5173",
      "https://analytify.vercel.app/", //production
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pomodoro", pomodoroRoutes);

export default app;
