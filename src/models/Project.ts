import mongoose, { Schema, models } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    columns: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          colorClass: { type: String, required: true },
          dotClass: { type: String, required: true }
        }
      ],
      default: [
        { id: "todo", title: "To Do", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-zinc-900" },
        { id: "in-progress", title: "In Progress", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-blue-600" },
        { id: "done", title: "Completed", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-emerald-600" }
      ]
    },
    tabs: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          type: { type: String, enum: ["tasks", "access", "notes", "doc"], required: true },
          content: { type: String, default: "" },
          description: { type: String, default: "" }
        }
      ],
      default: [
        { id: "tasks", title: "Tasks", type: "tasks", description: "Active workflow and task management." },
        { id: "access", title: "Access", type: "access", description: "Securely document server credentials and connection strings." },
        { id: "notes", title: "Notes", type: "notes", description: "Centralized documentation and project scratchpad." }
      ]
    },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  },
  { timestamps: true }
);

const Project = models.Project || mongoose.model("Project", projectSchema);

export default Project;