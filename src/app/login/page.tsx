"use client";

import { useActionState, useState, useEffect } from "react";
import { loginUser } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Hexagon, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
    
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-zinc-50 selection:bg-zinc-900 selection:text-white relative">
      
      <div className="absolute inset-0 md:hidden pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-[55vh] bg-zinc-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2048')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-50" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 lg:p-12 order-2 md:order-1 relative z-10">
        <div className="absolute top-8 left-6 sm:left-8 flex items-center gap-2 text-xl font-bold tracking-tight text-white md:text-zinc-900 md:hidden">
          <Hexagon className="h-6 w-6 text-white md:text-zinc-900 fill-white/20 md:fill-zinc-900" />
          TaskFlow Pro
        </div>

        <div className="mx-auto w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-3xl shadow-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 space-y-8 mt-16 sm:mt-24 md:mt-0 relative z-10">
          
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Welcome back</h1>
            <p className="text-sm font-medium text-zinc-500">Enter your credentials to access your workspace.</p>
          </div>

          <form action={action} className="space-y-5">
            <div className="space-y-2.5">
              <Label className="text-zinc-800 font-bold text-sm">Work Email</Label>
              <Input 
                name="email" 
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com" 
                required 
                className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" 
              />
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-800 font-bold text-sm">Password</Label>
                <button 
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors relative z-20"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  required 
                  className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 pr-10 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" 
                />
                <button
                  type="button"
                  disabled={!formData.password}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${!formData.password ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50/80 text-red-600 text-sm font-bold rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="h-12 w-full rounded-xl bg-zinc-900 text-white text-base font-bold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200">
              {isPending ? <Spinner className="mr-2" /> : "Sign In"}
            </Button>
          </form>
          
          <p className="text-center text-sm text-zinc-500 font-medium pt-2">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-zinc-900 hover:text-zinc-700 hover:underline transition-colors">Create workspace</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex order-1 md:order-2 m-4 rounded-[2.5rem] z-10">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2048')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
        </div>
        <div className="relative z-10 flex items-center justify-end gap-2 text-2xl font-black tracking-tight text-white">
          TaskFlow Pro <Hexagon className="h-8 w-8 text-white fill-white/20" />
        </div>
        <div className="relative z-10 mt-auto text-right">
          <div className="inline-block p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl">
            <blockquote className="space-y-4">
              <p className="text-2xl font-semibold leading-snug text-zinc-100">
                "Performance and clarity. Building systems that scale without the noise."
              </p>
              <footer className="text-sm font-bold tracking-wide text-zinc-400 uppercase">
                Architecture by Bhavesh Baraiya
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}