"use client";

import { useActionState, useState, useEffect } from "react";
import { registerUser } from "@/actions/register";
import { verifyUserCode, resendVerificationCode } from "@/actions/verify";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Hexagon, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(registerUser, null);
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(60); 
  const [isResending, setIsResending] = useState(false);

  const sendOtpEmail = async (email: string, code: string) => {
    const expireTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string, 
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
      {
        to_email: email,
        passcode: code,
        time: expireTime,
      },
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string 
    );
  };
  
  useEffect(() => {
    if (state?.errors) {
      setErrors(state.errors);
    }
    
    if (state?.success && state?.email && state?.code) {
      sendOtpEmail(state.email, state.code)
        .then(() => toast.success("Verification code sent to your email!"))
        .catch((err) => {
          console.error("EmailJS Error:", err);
          toast.error("Failed to send email, but account was created.");
        });
      
      setShowVerification(true);
      setResendCooldown(60);
    }
  }, [state]);

  useEffect(() => {
    if (showVerification && resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown, showVerification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state?.email) return;
    
    setIsVerifying(true);
    try {
      await verifyUserCode(state.email, verificationCode);
      toast.success("Account verified successfully!");
      router.push("/login"); 
    } catch (error: any) {
      toast.error(error.message || "Invalid code.");
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!state?.email || resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {    
      const res = await resendVerificationCode(state.email);
      
      if (res.success && res.code) {
        await sendOtpEmail(state.email, res.code);
        toast.success("A new verification code has been sent!");
        setResendCooldown(60);
        setVerificationCode("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-white">
      <div className="relative hidden md:flex flex-col justify-between bg-zinc-950 p-10 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')" }} />
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold"><Hexagon /> TaskFlow Pro</div>
      </div>
      
      <div className="flex items-center justify-center p-8">        
        {showVerification ? (
          <div className="w-full max-w-[400px] space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-zinc-900">Verify your email</h2>
              <p className="text-sm text-zinc-500 mt-2">
                We sent a 6-digit code to <br/><span className="font-bold text-zinc-900">{state?.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4 pt-4">
              <Input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.5em] font-bold h-16 bg-zinc-50 border-zinc-200 focus:ring-zinc-900"
                required
              />
              <Button type="submit" disabled={isVerifying || verificationCode.length !== 6} className="w-full h-12 text-md bg-zinc-900 text-white font-bold hover:bg-zinc-800">
                {isVerifying ? <Spinner className="h-5 w-5" /> : "Verify Account"}
              </Button>
            </form>

            <div className="pt-2 text-sm text-zinc-500 font-medium">
              Didn't receive the code?{" "}
              <button 
                type="button" 
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="font-bold text-zinc-900 hover:underline disabled:text-zinc-400 disabled:no-underline disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                {isResending ? (
                  <Spinner className="h-3 w-3" /> 
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" /> Resend now
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
                    
          <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Welcome</h1>
              <p className="text-sm font-medium text-zinc-500">Register to access your workspace.</p>
            </div>
            <form action={action} className="space-y-4">
              <FormInput 
                label="Full Name" 
                name="name" 
                value={formData.name}
                error={errors.name} 
                onChange={handleInputChange} 
              />
              <FormInput 
                label="Work Email" 
                name="email" 
                type="email" 
                value={formData.email}
                error={errors.email} 
                onChange={handleInputChange} 
              />
              
              <div className="space-y-1.5">
                <label className="text-zinc-700 font-bold">Password</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-lg px-4 outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-bold text-red-600">{errors.password[0]}</p>}
              </div>

              <Button type="submit" disabled={isPending} className="w-full mt-2 h-11 font-bold bg-zinc-900 text-white hover:bg-zinc-800">
                {isPending ? "Initializing..." : "Initialize Workspace"}
              </Button>
            </form>
            <p className="text-sm font-medium text-center md:text-left text-zinc-500">
              Already have an account? <Link href="/login" className="font-bold text-zinc-900 hover:underline">Log in instead</Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}