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
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-zinc-50 selection:bg-zinc-900 selection:text-white relative">
      <div className="absolute inset-0 md:hidden pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-[55vh] bg-zinc-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-50" />
        </div>
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex m-4 rounded-[2.5rem] z-10">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-50 scale-105 transition-transform duration-1000" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/80" />
        </div>
        <div className="relative z-10 flex items-center gap-2 text-2xl font-black tracking-tight text-white">
          <Hexagon className="h-8 w-8 fill-white/20" /> TaskFlow Pro
        </div>
        <div className="relative z-10 mb-8 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight">Start building your workspace today.</h2>
          <p className="mt-4 text-lg text-zinc-300 font-medium">Join thousands of professionals organizing their architecture scaling without limits.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="absolute top-8 left-6 sm:left-8 flex items-center gap-2 text-xl font-bold tracking-tight text-white md:hidden">
          <Hexagon className="h-6 w-6 text-white fill-white/20" />
          TaskFlow Pro
        </div>

        <div className="mx-auto w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-3xl shadow-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 mt-16 sm:mt-24 md:mt-0 relative z-10">
          {showVerification ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50">
                  <ShieldCheck className="h-10 w-10 text-emerald-600" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-zinc-900">Verify your email</h2>
                <p className="text-sm font-medium text-zinc-500">
                  We sent a 6-digit code to <br/><span className="font-bold text-zinc-900">{state?.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6 pt-2">
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-4xl tracking-[0.4em] font-black h-16 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
                  required
                />
                <Button type="submit" disabled={isVerifying || verificationCode.length !== 6} className="w-full h-12 rounded-xl text-base bg-zinc-900 text-white font-bold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all">
                  {isVerifying ? <Spinner className="h-5 w-5" /> : "Verify Account"}
                </Button>
              </form>

              <div className="text-center text-sm text-zinc-500 font-medium">
                Didn't receive the code?{" "}
                <button 
                  type="button" 
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="font-bold text-zinc-900 hover:text-zinc-700 hover:underline disabled:text-zinc-400 disabled:no-underline disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
                >
                  {isResending ? (
                    <Spinner className="h-3.5 w-3.5" /> 
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" /> Resend now
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
                    
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3 text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Create workspace</h1>
                <p className="text-sm font-medium text-zinc-500">Register below to set up your new account.</p>
              </div>
              <form action={action} className="space-y-5">
                <FormInput 
                  label="Full Name" 
                  name="name" 
                  value={formData.name}
                  error={errors.name} 
                  onChange={handleInputChange} 
                  className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white"
                />
                <FormInput 
                  label="Work Email" 
                  name="email" 
                  type="email" 
                  value={formData.email}
                  error={errors.email} 
                  onChange={handleInputChange} 
                  className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white"
                />
                
                <div className="space-y-2.5">
                  <label className="text-zinc-800 font-bold text-sm">Password</label>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full h-12 rounded-xl bg-zinc-50/50 border border-zinc-200 px-4 pr-10 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                      {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-bold text-red-600 animate-in fade-in slide-in-from-top-1">{errors.password[0]}</p>}
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-4 h-12 rounded-xl text-base font-bold bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200">
                  {isPending ? <Spinner className="mr-2" /> : "Initialize Workspace"}
                </Button>
              </form>
              <p className="text-sm font-medium text-center text-zinc-500 pt-2">
                Already have an account? <Link href="/login" className="font-bold text-zinc-900 hover:text-zinc-700 hover:underline transition-colors">Log in instead</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}