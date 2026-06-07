"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations";
import { getZodErrorMessage } from "@/lib/validation-helper";

export async function loginUser(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData);
  const validatedData = loginSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: getZodErrorMessage(validatedData.error) };
  }

  try {
    await signIn("credentials", {
      email: validatedData.data.email,
      password: validatedData.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    throw error;
  }
}