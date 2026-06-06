"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registerSchema } from "@/lib/validations";

export async function registerUser(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData);
  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await connectDB();
  const { name, email, password } = validated.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) return { errors: { email: ["User already exists."] } };

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashedPassword });

  redirect("/login");
}