"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormInput({ label, error, onChange, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-700 font-bold">{label}</Label>
      <Input 
        {...props} 
        onChange={(e) => {
          if (onChange) onChange(e); 
        }}
        className={`h-11 rounded-lg border-zinc-200 bg-zinc-50 px-4 focus:bg-white ${error ? "border-red-500 focus:border-red-500" : ""}`} 
      />
      {error && <p className="text-xs font-bold text-red-600">{error[0]}</p>}
    </div>
  );
}