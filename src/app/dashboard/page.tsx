import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-zinc-500 mt-2">
          Here is an overview of your workspace and active systems.
        </p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Active Projects</h3>
          <p className="text-2xl font-bold mt-2 text-zinc-900">0</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Tasks Pending</h3>
          <p className="text-2xl font-bold mt-2 text-zinc-900">0</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Team Members</h3>
          <p className="text-2xl font-bold mt-2 text-zinc-900">1</p>
        </div>
      </div>
    </div>
  );
}