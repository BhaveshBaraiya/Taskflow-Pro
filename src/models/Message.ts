import mongoose, { Schema, models } from "mongoose";

const messageSchema = new Schema(
  {
    text: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },    
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
  },
  { timestamps: true }
);

const Message = models.Message || mongoose.model("Message", messageSchema);

export default Message;