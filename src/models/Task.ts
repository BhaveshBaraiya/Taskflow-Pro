import mongoose, { Schema, models } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "todo" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Task = models.Task || mongoose.model("Task", taskSchema);

export default Task;  