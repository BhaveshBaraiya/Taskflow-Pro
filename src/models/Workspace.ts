import mongoose, { Schema, models } from "mongoose";

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    inviteCode: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

const Workspace = models.Workspace || mongoose.model("Workspace", workspaceSchema);

export default Workspace;