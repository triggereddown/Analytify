import mongoose from "mongoose";

const pomodoroSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: Date,
    endTime: Date,
    duration: Number,
    status: {
      type: String,
      enum: ["running", "completed", "abandoned"],
      default: "running",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PomodoroSession", pomodoroSessionSchema);
