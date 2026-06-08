"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const jobTitle = formData.get("jobTitle") as string;
  const browserNotifications = formData.get("browserNotifications") === "on";
  const inAppNotifications = formData.get("inAppNotifications") === "on";
  
  let avatarUrl = formData.get("avatarUrl") as string;
  
  const file = formData.get("avatarFile") as File;
  if (file && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) throw new Error("File size must be less than 2MB");
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    avatarUrl = `data:${file.type};base64,${base64}`;
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    name,
    jobTitle,
    avatarUrl,
    "settings.browserNotifications": browserNotifications,
    "settings.inAppNotifications": inAppNotifications,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function requestEmailChange(newEmail: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!newEmail || !newEmail.includes("@")) throw new Error("Invalid email");

  await connectDB();
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) throw new Error("Email is already in use by another account");

  // Generate 6-digit code & expire in 10 minutes
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(session.user.id, {
    emailVerificationCode: code,
    emailVerificationExpires: expires
  });

  // TODO: In production, use standard Resend or Nodemailer to email the user.
  // For development, we log it so you can test the UI instantly!
  console.log(`\n\n📧 EMAIL SENT TO ${newEmail}\nYour Verification Code is: ${code}\n\n`);

  return { success: true };
}

export async function verifyEmailChange(newEmail: string, code: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  
  if (!user || user.emailVerificationCode !== code) {
    throw new Error("Invalid verification code");
  }

  if (new Date() > new Date(user.emailVerificationExpires)) {
    throw new Error("Verification code has expired");
  }

  // Update email and clear OTP fields
  await User.findByIdAndUpdate(session.user.id, {
    email: newEmail,
    emailVerificationCode: null,
    emailVerificationExpires: null
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  await User.findByIdAndDelete(session.user.id);
  
  return { success: true };
}