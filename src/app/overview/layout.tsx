import { AppSidebar } from "@/components/AppSidebar";

export default function OverviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50/50">
            <AppSidebar isOverview={true} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {children}
            </div>
        </div>
    );
}
