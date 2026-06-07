import { ZodError } from "zod";

export function getZodErrorMessage(error: ZodError): string {  
  const issues = (error as any).issues || (error as any).errors || [];
  return issues[0]?.message || "Invalid input data";
}