import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { RecordsClient } from "./records-client";
import { parseFilters, buildRecordsQuery } from "@/lib/record-utils";

export default async function WorkspacePage(props: { params: Promise<{ workspaceId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { workspaceId } = await props.params;
    const searchParams = await props.searchParams;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            fields: { orderBy: { order: 'asc' } },
        }
    });

    const fields = workspace?.fields || [];

    // Extract standard params
    const globalSearch = typeof searchParams.search === 'string' ? searchParams.search : '';
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
    const take = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 25;
    const skip = (page - 1) * take;

    // Sort
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : null;
    let sortField = null;
    let sortDirection: "asc" | "desc" = "desc";
    if (sort) {
        const parts = sort.split(':');
        if (parts.length === 2) {
            sortField = parts[0];
            sortDirection = parts[1] as "asc" | "desc";
        }
    }

    // Filters
    const filters = parseFilters(searchParams);

    let records = [];
    let totalCount = 0;

    if (fields.length > 0) {
        const { recordsQuery, countQuery } = buildRecordsQuery(
            workspaceId, fields, globalSearch, filters, sortField, sortDirection, take, skip
        );

        try {
            records = (await prisma.$queryRaw(recordsQuery)) as any[];
            const countResult = (await prisma.$queryRaw(countQuery)) as any[];
            totalCount = countResult.length > 0 ? Number(countResult[0].count) : 0;
        } catch (error) {
            console.error("Failed to query records:", error);
            // fallback
            records = [];
        }
    }

    if (fields.length === 0) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">{workspace?.name || "Unknown Workspace"}</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link href={`/workspaces/${workspaceId}/settings`}>
                            <Button variant="outline">Manage Columns</Button>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto mt-12 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900">Your workspace is empty</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Start by setting up your custom fields to begin managing your contacts.
                        </p>
                        <div className="pt-4 flex justify-center">
                            <Link href={`/workspaces/${workspaceId}/settings`}>
                                <Button>Set Up Fields</Button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <RecordsClient
            workspaceId={workspaceId}
            workspaceName={workspace?.name || "Unknown Workspace"}
            fields={fields}
            records={records}
            totalRecords={totalCount}
            currentPage={page}
            totalPages={Math.ceil(totalCount / take)}
            globalSearch={globalSearch}
            parsedFilters={filters}
            sortField={sortField}
            sortDirection={sortDirection}
        />
    );
}
