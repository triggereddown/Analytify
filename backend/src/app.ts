import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import pomodoroRoutes from "./modules/pomodoro/pomodoro.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";
import publicRoutes from "./modules/public/public.routes.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
import exportRoutes from "./modules/export/export.routes.js";
import nudgesRoutes from "./modules/nudges/nudges.routes.js";
import streaksRoutes from "./modules/streaks/streaks.routes.js";
import distractionsRoutes from "./modules/distractions/distractions.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import worklogRoutes from "./modules/worklog/worklog.routes.js";
import goalsRoutes from "./modules/goals/goals.routes.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import errorHandler from "./middleware/error.middleware.js";
// TEACHING NOTE — src/types/express.d.ts needs NO import anywhere:
// `.d.ts` files are pure type declarations — they produce no JavaScript
// output and can't be imported at runtime (there's no express.js to
// resolve, hence the ERR_MODULE_NOT_FOUND this comment replaced). As long
// as the file is covered by tsconfig.json's "include" (src/**/*.ts also
// matches .d.ts), TypeScript automatically applies its global
// `declare global { namespace Express { ... } }` augmentation everywhere
// in the project — no explicit import required, unlike normal modules.

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
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/nudges", nudgesRoutes);
app.use("/api/streaks", streaksRoutes);
app.use("/api/distractions", distractionsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/worklog", worklogRoutes);
app.use("/api/goals", goalsRoutes);

// Centralized error handler MUST be the last middleware
app.use(errorHandler);

export default app;
