"use client";

import { useActionState, useState, useEffect } from "react";
import { loginUser } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Hexagon, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginUser, null);
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    if (state?.error) {
      setError(state.error);
    }
  }, [state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear the global server error the moment the user starts correcting their input
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-white">
      
      <div className="flex items-center justify-center p-8 lg:p-12 order-2 md:order-1">
        <div className="mx-auto w-full max-w-[400px] space-y-8">
          
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Welcome back</h1>
            <p className="text-sm font-medium text-zinc-500">Enter your credentials to access your workspace.</p>
          </div>

          <form action={action} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-zinc-700 font-bold">Work Email</Label>
              <Input 
                name="email" 
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com" 
                required 
                className="h-11 bg-zinc-50 border-zinc-200" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-700 font-bold">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  required 
                  className="h-11 bg-zinc-50 border-zinc-200 pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="h-11 w-full bg-zinc-900 text-white font-bold hover:bg-zinc-800">
              {isPending ? <Spinner className="mr-2" /> : "Sign In"}
            </Button>
          </form>
          
          <p className="text-center text-sm text-zinc-500 md:text-left font-medium">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-zinc-900 hover:underline">Create workspace</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-col justify-between bg-zinc-950 p-10 text-white md:flex overflow-hidden order-1 md:order-2">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2048')" }} />
        <div className="relative z-10 flex items-center justify-end gap-2 text-xl font-bold tracking-tight">
          TaskFlow Pro <Hexagon className="h-6 w-6 text-white" />
        </div>
        <div className="relative z-10 mt-auto text-right">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-relaxed text-zinc-100">
              "Performance and clarity. Building systems that scale without the noise."
            </p>
            <footer className="text-sm font-medium text-zinc-400">
              Architecture by Bhavesh Baraiya
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}