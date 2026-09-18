import { requireAdmin } from "@/lib/auth";
import { getAdminEmployees } from "@/app/actions/admin";
import { EmployeeManagementClient } from "./EmployeeManagementClient";

export default async function AdminEmployeesPage() {
  const session = await requireAdmin();
  const employeesResult = await getAdminEmployees();

  const employees = employeesResult.success && employeesResult.employees ? employeesResult.employees : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system users, access roles, and account status across the organization.
          </p>
        </div>
      </div>

      <EmployeeManagementClient
        currentAdminId={session.employeeId}
        employees={employees}
      />
    </div>
  );
}
