"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, FolderKanban, ExternalLink, Database, Layers, User, Calendar } from "lucide-react";

interface AdminWorkspace {
  id: string;
  name: string;
  createdAt: Date;
  employee: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  _count: {
    fields: number;
    records: number;
  };
}

interface WorkspaceManagementClientProps {
  initialWorkspaces: AdminWorkspace[];
}

export default function WorkspaceManagementClient({
  initialWorkspaces
}: WorkspaceManagementClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [workspaces] = useState<AdminWorkspace[]>(initialWorkspaces);

  const filteredWorkspaces = workspaces.filter((ws) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const matchName = ws.name.toLowerCase().includes(term);
    const matchOwner = (ws.employee?.name && ws.employee.name.toLowerCase().includes(term)) || (ws.employee?.email && ws.employee.email.toLowerCase().includes(term));
    return matchName || !!matchOwner;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workspaces by title or owner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] text-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredWorkspaces.length}</span> of {workspaces.length} workspaces
        </div>
      </div>

      {/* Workspaces Grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No workspaces found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm ? "No workspace matches your search term." : "No workspaces have been created in the CRM yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkspaces.map((ws) => (
            <div
              key={ws.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#EEEDFE] flex items-center justify-center text-[#534AB7] shrink-0 font-bold">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-[#534AB7] transition-colors">
                      {ws.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ws.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4 text-xs text-slate-600">
                {/* Owner info */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5" /> Workspace Owner
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={ws.employee?.email || undefined}>
                    {ws.employee?.name || "System Admin"}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Database className="w-3.5 h-3.5 text-emerald-500" /> Total Records
                    </div>
                    <div className="text-lg font-bold text-slate-900">{ws._count.records}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Custom Fields
                    </div>
                    <div className="text-lg font-bold text-slate-900">{ws._count.fields}</div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono text-[10px]">ID: {ws.id.substring(0, 8)}...</span>
                <Link
                  href={`/workspaces/${ws.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#534AB7] hover:bg-[#7F77DD] text-white transition-colors"
                >
                  Inspect Workspace <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
