import { requireAdmin } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#F8FAFC]">
                <header className="bg-white border-b border-[#E5E7EB] h-14 md:h-16 flex flex-none items-center justify-between px-4 pl-14 md:px-8 shrink-0 z-20">
                    <div className="flex items-center text-[#64748B] text-xs md:text-sm whitespace-nowrap overflow-hidden">
                        <Link href="/overview" className="hover:text-[#534AB7] transition-colors font-medium shrink-0">CRM</Link>
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mx-1.5 md:mx-2 text-[#64748B]/60 shrink-0" />
                        <span className="font-semibold text-[#171717] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            Admin Console
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            ADMIN ACCESS
                        </span>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-y-auto relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
