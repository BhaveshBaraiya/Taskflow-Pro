import mongoose, { Schema, models } from "mongoose";

const conversationSchema = new Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Conversation = models.Conversation || mongoose.model("Conversation", conversationSchema);

export default Conversation;