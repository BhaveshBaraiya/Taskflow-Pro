import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    workspaces: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
    activeWorkspace: { type: Schema.Types.ObjectId, ref: "Workspace" },
    
    avatarUrl: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    
    settings: {
      browserNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
    },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema);

export default User;