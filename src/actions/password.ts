"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function sendPasswordResetCode(email: string) {
  if (!email || !email.includes("@")) throw new Error("Please enter a valid email");

  await connectDB();
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error("No account found with this email address.");
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  user.verificationCode = code;
  user.verificationCodeExpires = expires;
  await user.save();
    
  return { success: true, code, name: user.name };
}

export async function verifyAndResetPassword(email: string, code: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");

  await connectDB();
  const user = await User.findOne({ email });
  
  if (!user || user.verificationCode !== code) {
    throw new Error("Invalid verification code");
  }

  if (new Date() > new Date(user.verificationCodeExpires)) {
    throw new Error("Verification code has expired. Please request a new one.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  user.password = hashedPassword;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  return { success: true };
}