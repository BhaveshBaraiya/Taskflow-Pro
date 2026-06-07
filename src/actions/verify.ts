"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function verifyUserCode(email: string, code: string) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found.");
  if (user.isVerified) throw new Error("Account is already verified.");

  if (user.verificationCode !== code) {
    throw new Error("Invalid verification code.");
  }
  
  if (user.verificationCodeExpires < new Date()) {
    throw new Error("Verification code has expired.");
  }
  
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  return { success: true };
}

// Add this to the bottom of src/actions/verify.ts

export async function resendVerificationCode(email: string) {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found.");
  if (user.isVerified) throw new Error("Account is already verified.");
  
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newExpires = new Date(Date.now() + 15 * 60 * 1000);

  user.verificationCode = newCode;
  user.verificationCodeExpires = newExpires;
  await user.save();

  return { success: true, code: newCode };
}