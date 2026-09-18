import { requireAdmin } from "@/lib/auth";
import { getAdminWorkspaces } from "@/app/actions/admin";
import WorkspaceManagementClient from "./WorkspaceManagementClient";

export default async function AdminWorkspacesPage() {
  await requireAdmin();
  const workspacesResult = await getAdminWorkspaces();

  const workspaces = workspacesResult.success && workspacesResult.workspaces ? workspacesResult.workspaces : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global view of all workspaces across the system, custom fields, and total record volumes.
          </p>
        </div>
      </div>

      <WorkspaceManagementClient initialWorkspaces={workspaces} />
    </div>
  );
}
