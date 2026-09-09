import Link from "next/link";
import prisma from "@/lib/prisma";
import { CreateEmployeeDialog } from "@/components/CreateEmployeeDialog";
import { EmployeeListClient } from "@/components/EmployeeListClient";

// Explicitly tell Next to refetch on changes
export const dynamic = "force-dynamic";

export default async function Home() {
  const employees = await prisma.employee.findMany({
    include: { workspaces: { orderBy: { name: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full flex flex-col items-center space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Select an employee to continue</h1>
          <p className="text-gray-500">Choose your profile to access your workspace.</p>
        </div>

        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Employees</h2>
            <CreateEmployeeDialog />
          </div>

          <EmployeeListClient employees={employees} />
        </div>

        <div className="pt-8">
          <Link href="/overview" className="text-sm font-medium text-blue-600 hover:underline">
            Go to Company Overview →
          </Link>
        </div>
      </div>
    </div>
  );
}
