"use client";

import { useActionState, useState, useEffect  } from "react";
import { registerUser } from "@/actions/register";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Hexagon, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (state?.errors) setErrors(state.errors);
  }, [state]);

  const handleChange = (field: string) => {
    setErrors((prev: any) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-white">
      <div className="relative hidden md:flex flex-col justify-between bg-zinc-950 p-10 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')" }} />
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold"><Hexagon /> TaskFlow Pro</div>
      </div>
      
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] space-y-8">
          <form action={action} className="space-y-4">
            <FormInput 
              label="Full Name" name="name" 
              error={errors.name} 
              onChange={() => handleChange("name")} 
            />
            <FormInput 
              label="Work Email" name="email" type="email" 
              error={errors.email} 
              onChange={() => handleChange("email")} 
            />
            
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Password</label>
              <div className="relative">
                <input 
                  name="password" type={showPassword ? "text" : "password"}
                  onChange={() => handleChange("password")}
                  className="w-full h-11 bg-zinc-50 border rounded-lg px-4"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs font-bold text-red-600">{errors.password[0]}</p>}
            </div>

            <Button type="submit" disabled={isPending}>Initialize Workspace</Button>
          </form>
          <p className="text-sm font-medium text-center md:text-left">Already have an account? <Link href="/login" className="font-bold underline">Log in instead</Link></p>
        </div>
      </div>
    </div>
  );
}