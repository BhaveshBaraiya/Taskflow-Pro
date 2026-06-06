import { Hexagon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-zinc-200 opacity-50" />
        <Hexagon className="h-8 w-8 text-zinc-900 animate-pulse relative z-10" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <Spinner className="h-3 w-3" />
        Synchronizing workspace...
      </div>
    </div>
  );
}