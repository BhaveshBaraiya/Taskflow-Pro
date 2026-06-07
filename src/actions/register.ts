"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function registerUser(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedData = registerSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { errors: validatedData.error.flatten().fieldErrors };
  }

  await connectDB();

  const { name, email, password } = validatedData.data;

  // Generate a new 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    if (existingUser.isVerified) {
      // 1. If they are already verified, block registration
      return { errors: { email: ["This email is already registered. Please log in."] } };
    } else {
      // 2. If they exist but ARE NOT verified, update their details and send a new code!
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      await existingUser.save();

      return { 
        success: true, 
        email: email.toLowerCase(), 
        code: verificationCode 
      };
    }
  }

  // 3. If user doesn't exist at all, create a brand new one
  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isVerified: false,
    verificationCode,
    verificationCodeExpires,
  });

  return { 
    success: true, 
    email: email.toLowerCase(), 
    code: verificationCode 
  };
}