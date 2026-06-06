import { getProjectById } from "@/actions/project";
import { getTasks } from "@/actions/task";
import { getProjectMembers } from "@/actions/team";
import { notFound } from "next/navigation";

import EditProjectModal from "@/components/shared/EditProjectModal";
import ManageTeamModal from "@/components/shared/ManageTeamModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteProject } from "@/actions/project";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import ProjectTabs from "@/components/shared/ProjectTabs";

export default async function SingleProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const [project, tasks, members, messages] = await Promise.all([
    getProjectById(projectId),
    getTasks(projectId),
    getProjectMembers(projectId)
  ]);

  if (!project) notFound();

  const defaultColumns = [
    { id: "todo", title: "To Do", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-zinc-900" },
    { id: "in-progress", title: "In Progress", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-blue-600" },
    { id: "done", title: "Completed", colorClass: "bg-zinc-50 border-zinc-200", dotClass: "bg-emerald-600" }
  ];
  const safeColumns = project.columns && project.columns.length > 0 ? project.columns : defaultColumns;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">{project.title}</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1 max-w-2xl">{project.description}</p>
        </div>
        
        <div className="flex gap-2">
          <ManageTeamModal projectId={projectId} members={members} />
          <EditProjectModal project={project} />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-white border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 hidden sm:flex font-bold">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-zinc-200 shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-bold text-zinc-900">Delete Project?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-600 font-medium">
                  This action cannot be undone. This will permanently delete the <strong>{project.title}</strong> project and all of its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none font-bold">Cancel</AlertDialogCancel>
                <form action={async () => {
                  "use server";
                  await deleteProject(projectId);
                }}>
                  <AlertDialogAction type="submit" className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto font-bold">
                    Yes, delete project
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <ProjectTabs 
        project={project} 
        tasks={tasks} 
        members={members} 
        safeColumns={safeColumns}
      />
      
    </div>
  );
}