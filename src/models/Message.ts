import mongoose, { Schema, models } from "mongoose";

const messageSchema = new Schema(
  {
    text: { type: String, default: "" },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    attachments: [{
      url: { type: String },
      fileType: { type: String },
      name: { type: String }
    }]
  },
  { timestamps: true }
);

messageSchema.index({
  conversationId: 1,
  createdAt: -1
});

messageSchema.index({
  projectId: 1,
  createdAt: -1
});

messageSchema.index({
  workspaceId: 1
});

const Message = models.Message || mongoose.model("Message", messageSchema);

export default Message;