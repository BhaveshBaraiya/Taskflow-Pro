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

  // EmailJS Function (Identical to your Register page)
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
      // 1. Get the code from the server
      const res = await sendPasswordResetCode(email);
      
      if (res.success && res.code) {
        // 2. Send the email via EmailJS
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-[440px] bg-white border border-zinc-200 rounded-3xl shadow-xl p-8 lg:p-10">
        
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-inner">
            <Hexagon className="h-6 w-6 text-white fill-white" />
          </div>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Reset Password</h1>
              <p className="text-sm text-zinc-500 font-medium">Enter your account email to receive a recovery code.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-700 font-bold">Account Email</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@company.com" 
                className="h-11 bg-zinc-50" 
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-zinc-900 text-white font-bold hover:bg-zinc-800">
              {isLoading ? <Spinner className="mr-2" /> : "Send Recovery Code"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={(e) => { e.preventDefault(); setStep("reset"); }} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Enter Code</h1>
              <p className="text-sm text-zinc-500 font-medium">We sent a 6-digit code to <span className="text-zinc-900 font-bold">{email}</span></p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-700 font-bold">Verification Code</Label>
              <Input 
                type="text" 
                maxLength={6}
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
                required 
                placeholder="000000" 
                className="h-12 bg-zinc-50 text-center tracking-[1em] font-black text-lg" 
              />
            </div>

            <Button type="submit" disabled={code.length < 6} className="w-full h-11 bg-blue-600 text-white font-bold hover:bg-blue-700">
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleVerifyAndReset} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">New Password</h1>
              <p className="text-sm text-zinc-500 font-medium">Create a strong password for your workspace.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-700 font-bold">New Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  className="h-11 bg-zinc-50 pr-10" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}

            <Button type="submit" disabled={isLoading || newPassword.length < 6} className="w-full h-11 bg-zinc-900 text-white font-bold hover:bg-zinc-800">
              {isLoading ? <Spinner className="mr-2" /> : "Save & Login"}
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Password Updated</h1>
              <p className="text-sm text-zinc-500 font-medium">Your account is secure. You can now log in.</p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full h-11 bg-zinc-900 text-white font-bold hover:bg-zinc-800 mt-4">
              Return to Login
            </Button>
          </div>
        )}

        {step !== "success" && (
          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}