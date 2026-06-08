"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetCode, verifyAndResetPassword } from "@/actions/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Hexagon, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "reset" | "success">("email");
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtpEmail = async (userEmail: string, code: string) => {
    const expireTime = new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string, 
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
      {
        to_email: userEmail,
        passcode: code,
        time: expireTime,
      },
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string 
    );
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await sendPasswordResetCode(email);
      
      if (res.success && res.code) {
        await sendOtpEmail(email, res.code);
        toast.success("Recovery code sent to your email!");
        setStep("code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
      toast.error(err.message || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await verifyAndResetPassword(email, code, newPassword);
      setStep("success");
      toast.success("Password updated securely.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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

      <div className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex m-4 rounded-[2.5rem] z-10">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2048')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/80" />
        </div>
        <div className="relative z-10 flex items-center gap-2 text-2xl font-black tracking-tight text-white">
          <Hexagon className="h-8 w-8 fill-white/20" /> TaskFlow Pro
        </div>
        <div className="relative z-10 mb-8 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight">Recover your workspace access.</h2>
          <p className="mt-4 text-lg text-zinc-300 font-medium">Securely reset your credentials and get back to building scalable systems.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="absolute top-8 left-6 sm:left-8 flex items-center gap-2 text-xl font-bold tracking-tight text-white md:text-zinc-900 md:hidden">
          <Hexagon className="h-6 w-6 text-white md:text-zinc-900 fill-white/20 md:fill-zinc-900" />
          TaskFlow Pro
        </div>

        <div className="mx-auto w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-3xl shadow-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 mt-16 sm:mt-24 md:mt-0 relative z-10">
          
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center md:text-left space-y-3">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Reset Password</h1>
                <p className="text-sm text-zinc-500 font-medium">Enter your account email to receive a recovery code.</p>
              </div>
              
              <div className="space-y-2.5">
                <Label className="text-zinc-800 font-bold text-sm">Account Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@company.com" 
                  className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" 
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50/80 text-red-600 text-sm font-bold rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-zinc-900 text-white text-base font-bold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200">
                {isLoading ? <Spinner className="mr-2" /> : "Send Recovery Code"}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={(e) => { e.preventDefault(); setStep("reset"); }} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Enter Code</h1>
                <p className="text-sm text-zinc-500 font-medium">We sent a 6-digit code to <br/><span className="text-zinc-900 font-bold">{email}</span></p>
              </div>
              
              <div className="space-y-2.5 pt-2">
                <Input 
                  type="text" 
                  maxLength={6}
                  value={code} 
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
                  required 
                  placeholder="000000" 
                  className="text-center text-4xl tracking-[0.4em] font-black h-16 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all" 
                />
              </div>

              <Button type="submit" disabled={code.length < 6} className="h-12 w-full rounded-xl text-base bg-blue-600 text-white font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200">
                Continue <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleVerifyAndReset} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center md:text-left space-y-3">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">New Password</h1>
                <p className="text-sm text-zinc-500 font-medium">Create a strong password for your workspace.</p>
              </div>
              
              <div className="space-y-2.5">
                <Label className="text-zinc-800 font-bold text-sm">New Password</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    placeholder="••••••••" 
                    className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 pr-10 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" 
                  />
                  <button 
                    type="button" 
                    disabled={!newPassword}
                    onClick={() => setShowPassword(!showPassword)} 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${!newPassword ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-600'}`}
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

              <Button type="submit" disabled={isLoading || newPassword.length < 6} className="h-12 w-full rounded-xl bg-zinc-900 text-white text-base font-bold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200">
                {isLoading ? <Spinner className="mr-2" /> : "Save & Login"}
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-6 py-4 animate-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Password Updated</h1>
                <p className="text-sm text-zinc-500 font-medium">Your account is secure. You can now log in.</p>
              </div>
              <Button onClick={() => router.push("/login")} className="h-12 w-full rounded-xl bg-zinc-900 text-white text-base font-bold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200 mt-4">
                Return to Login
              </Button>
            </div>
          )}

          {step !== "success" && (
            <div className="mt-8 text-center">
              <Link href="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:underline transition-colors">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}