import Link from "next/link";
import { ArrowRight, LayoutDashboard, Hexagon } from "lucide-react"; // Added Hexagon import

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold tracking-widest uppercase mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
          System Online
        </div>
        
        {/* Main Heading - Added flex and the Hexagon icon */}
        <h1 className="flex items-center justify-center gap-4 text-6xl md:text-8xl font-black text-white tracking-tighter mb-6">
          <Hexagon className="h-12 w-12 md:h-20 md:w-20 fill-white text-white shrink-0" />
          <span>
            TaskFlow <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600">Pro</span>
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          Performance and clarity. An enterprise-grade project management ecosystem built for teams that need to scale fast and collaborate in real-time.
        </p>

        {/* CTA Button */}
        <Link 
          href="/login" 
          className="group inline-flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          <LayoutDashboard className="h-5 w-5" />
          Enter Workspace
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </main>
  );
}