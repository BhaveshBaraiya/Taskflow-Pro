"use client";

import { useState, useRef } from "react";
import { updateUserProfile, deleteAccount, requestEmailChange, verifyEmailChange } from "@/actions/user";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon, Bell, ShieldAlert, Camera, UploadCloud, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function UserSettings({ user }: { user: any }) {
  const { update } = useSession();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "danger">("profile");
  const [isSaving, setIsSaving] = useState(false);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState(user.avatarUrl || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Email OTP State
  const [emailFlow, setEmailFlow] = useState<"idle" | "verifying">("idle");
  const [newEmail, setNewEmail] = useState(user.email);
  const [otpCode, setOtpCode] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    if (selectedFile) formData.append("avatarFile", selectedFile);
    formData.append("avatarUrl", user.avatarUrl || "");

    try {     
      await updateUserProfile(formData);
            
      await update({ 
        name: formData.get("name") 
      });

      toast.success("Profile updated successfully");
      setIsOpen(false);
            
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestEmailCode = async () => {
    if (newEmail === user.email) return;
    setIsEmailLoading(true);
    try {
      await requestEmailChange(newEmail);
      toast.success("Verification code sent! Check your email (or server console).");
      setEmailFlow("verifying");
    } catch (error: any) {
      toast.error(error.message || "Error requesting code");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setIsEmailLoading(true);
    try {
      await verifyEmailChange(newEmail, otpCode);
      toast.success("Email changed successfully!");
      setEmailFlow("idle");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid code");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you absolutely sure you want to delete your account? This cannot be undone.")) {
      await deleteAccount();
      signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="p-4 border-t border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-colors flex items-center gap-3 shrink-0">
          <Avatar className="h-9 w-9 border border-zinc-200">
            <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
            <AvatarFallback className="bg-zinc-900 text-white font-bold text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-zinc-900 truncate">{user.name}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
              {user.jobTitle || "Member"}
            </span>
          </div>
          <Settings className="h-4 w-4 text-zinc-400 shrink-0" />
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] w-[95vw] bg-white border-zinc-200 p-0 shadow-2xl overflow-hidden rounded-2xl flex flex-col md:flex-row h-[85vh] md:h-[600px]">
        <DialogTitle className="sr-only">User Settings</DialogTitle>
        
        <div className="w-full md:w-56 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-100 p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-1 px-2 hidden md:block">Settings</h3>
          <button onClick={() => setActiveTab("profile")} className={`flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === "profile" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}>
            <UserIcon className="h-4 w-4" /> Profile
          </button>
          <button onClick={() => setActiveTab("notifications")} className={`flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === "notifications" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}>
            <Bell className="h-4 w-4" /> Notifications
          </button>
          <button onClick={() => setActiveTab("danger")} className={`flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === "danger" ? "bg-red-50 text-red-600 shadow-sm border border-red-100" : "text-red-500 hover:text-red-600 hover:bg-red-50"}`}>
            <ShieldAlert className="h-4 w-4" /> Danger Zone
          </button>
          <div className="md:mt-auto ml-auto md:ml-0">
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center gap-2 text-sm font-bold px-3 py-2.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors w-full">
              <LogOut className="h-4 w-4" /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-8 max-w-md">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Public Profile</h2>
                <p className="text-sm text-zinc-500 font-medium mt-1">Manage your identity and workspace badge.</p>
              </div>

              {/* PC FILE UPLOAD */}
              <div className="flex items-center gap-5">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-20 w-20 rounded-full border-2 border-zinc-200 border-dashed cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all group overflow-hidden shadow-sm"
                >
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-zinc-100 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="h-5 w-5 text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-sm font-bold text-zinc-900">Profile Picture</Label>
                  <p className="text-xs font-medium text-zinc-500">Click avatar to upload from PC. Max 2MB.</p>
                </div>
              </div>

              <form id="settings-form" onSubmit={handleSaveProfile} className="space-y-5 border-t border-zinc-100 pt-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</Label>
                  <Input name="name" defaultValue={user.name} required className="bg-zinc-50 h-10 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Job Title / Badge</Label>
                  <Input name="jobTitle" defaultValue={user.jobTitle} placeholder="Frontend Developer" className="bg-zinc-50 h-10 font-medium" />
                </div>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-zinc-900 text-white font-bold hover:bg-zinc-800 h-10 px-8 mt-2">
                  {isSaving ? <Spinner className="h-4 w-4 mr-2" /> : null} Save Details
                </Button>
              </form>

              {/* EMAIL EDITING WITH OTP */}
              <div className="border-t border-zinc-100 pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Account Email
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={emailFlow === "verifying"}
                      className="bg-zinc-50 h-10 font-medium" 
                    />
                    {newEmail !== user.email && emailFlow === "idle" && (
                      <Button onClick={handleRequestEmailCode} disabled={isEmailLoading} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                        {isEmailLoading ? <Spinner className="h-4 w-4" /> : "Verify"}
                      </Button>
                    )}
                  </div>
                </div>

                {emailFlow === "verifying" && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <Label className="text-xs font-bold text-blue-800 uppercase tracking-widest">Enter 6-Digit Code</Label>
                    <p className="text-xs text-blue-600/80 font-medium">Check your terminal/console for the OTP code.</p>
                    <div className="flex gap-2">
                      <Input 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456" 
                        maxLength={6}
                        className="h-10 bg-white font-bold tracking-widest text-center" 
                      />
                      <Button onClick={handleVerifyEmail} disabled={isEmailLoading || otpCode.length < 6} className="h-10 bg-zinc-900 text-white font-bold px-6">
                        {isEmailLoading ? <Spinner className="h-4 w-4" /> : "Confirm"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Render Notifications and Danger Zone forms normally below... */}
          {activeTab === "notifications" && (
             <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
             <div>
               <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Notifications</h2>
               <p className="text-sm text-zinc-500 font-medium mt-1">Control how and where you receive alerts.</p>
             </div>
             <div className="flex flex-col gap-4">
               <label className="flex items-start justify-between p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
                 <div className="pr-4">
                   <span className="block font-bold text-zinc-900 mb-1 text-sm">Browser Push Notifications</span>
                   <span className="block text-xs text-zinc-500 leading-relaxed">Receive instant alerts even when the dashboard is minimized or closed.</span>
                 </div>
                 <input type="checkbox" name="browserNotifications" defaultChecked={user.settings?.browserNotifications} className="mt-1 h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer" />
               </label>
               <label className="flex items-start justify-between p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
                 <div className="pr-4">
                   <span className="block font-bold text-zinc-900 mb-1 text-sm">In-App Toasts</span>
                   <span className="block text-xs text-zinc-500 leading-relaxed">Show temporary popups in the top right corner while you are active.</span>
                 </div>
                 <input type="checkbox" name="inAppNotifications" defaultChecked={user.settings?.inAppNotifications} className="mt-1 h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer" />
               </label>
             </div>
             <div className="pt-4 border-t border-zinc-100">
               <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-zinc-900 text-white font-bold hover:bg-zinc-800 h-10 px-8">
                 {isSaving ? <Spinner className="h-4 w-4 mr-2" /> : null} Save Preferences
               </Button>
             </div>
           </form>
          )}

          {activeTab === "danger" && (
            <div className="space-y-6 max-w-md">
              <div>
                <h2 className="text-xl font-extrabold text-red-600 tracking-tight">Danger Zone</h2>
                <p className="text-sm text-zinc-500 font-medium mt-1">Irreversible destructive actions.</p>
              </div>
              <div className="p-5 border border-red-200 bg-red-50 rounded-xl space-y-4">
                <div>
                  <Label className="font-bold text-red-900 text-sm">Delete Account</Label>
                  <p className="text-xs text-red-700 leading-relaxed mt-1">Permanently remove your account, settings, and personal data. Workspaces you own will remain active for other members.</p>
                </div>
                <Button type="button" onClick={handleDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6">
                  Delete My Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}