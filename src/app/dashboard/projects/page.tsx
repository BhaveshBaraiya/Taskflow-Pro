import { getProjects } from "@/actions/project";
import Link from "next/link";
import { FolderKanban, Users, Clock, ArrowRight } from "lucide-react";
import CreateProjectModal from "@/components/shared/CreateProjectModal";

export default async function ProjectsHubPage() {  
  const projects = await getProjects();

  return (
    <div className="flex flex-col space-y-8 max-w-7xl mx-auto pb-12 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Workspaces</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">Manage your projects, teams, and active workflows.</p>
        </div>
        <div className="shrink-0">
          <CreateProjectModal />
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl py-24 bg-zinc-50/50">
          <div className="h-16 w-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <FolderKanban className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">No workspaces found</h3>
          <p className="text-sm font-medium text-zinc-500 mt-2 text-center max-w-sm mb-6">
            You don't have any active projects yet. Create your first workspace to start collaborating.
          </p>
          <CreateProjectModal />
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link key={project._id} href={`/dashboard/projects/${project._id}`}>
              <div className="group flex flex-col justify-between h-full bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer">
                
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {project.title.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide uppercase ring-1 ring-emerald-600/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm font-medium text-zinc-500 mt-2 line-clamp-2 min-h-[40px]">
                    {project.description || "No description provided for this workspace."}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {project.members?.length || 0} Team
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}