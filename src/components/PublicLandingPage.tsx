"use client";

import Link from "next/link";
import {
    Grip,
    UserCheck,
    UserPlus,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Users,
    Table,
    Layers,
    Lock,
    Search,
    Filter,
    FileSpreadsheet,
    Zap,
    Building2,
    Mail,
    Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicLandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-[#EEEDFE] selection:text-[#534AB7] font-sans">

            {/* Navbar */}
            <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#534AB7] to-[#7F77DD] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <Grip className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none block">CRM System</span>
                            <span className="text-[10px] text-[#64748B] font-semibold tracking-wide">Enterprise Desk</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link href="/login?role=employee">
                            <Button variant="ghost" className="text-xs font-semibold text-slate-700 hover:text-[#534AB7] hover:bg-[#EEEDFE]/60">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="text-xs font-semibold bg-[#534AB7] hover:bg-[#7F77DD] text-white shadow-sm">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* SECTION 1 — HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-[#EEEDFE]/40 via-[#F8FAFC] to-[#F8FAFC] py-16 md:py-20 border-b border-[#E5E7EB]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        {/* Left Hero Content */}
                        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEEDFE] text-[#534AB7] text-xs font-bold border border-indigo-200/50 shadow-xs">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>IMPULSE CRM PLATFORM</span>
                            </div>

                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                                Manage Your Contacts. <br />
                                <span className="text-[#534AB7]">Work Smarter.</span>
                            </h1>

                            <p className="text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Organize contacts, manage workspaces, and keep your team's CRM data structured in one place.
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                <Link href="/login?role=employee" className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto bg-[#534AB7] hover:bg-[#7F77DD] text-white font-semibold text-xs h-11 px-6 shadow-sm flex items-center justify-center gap-2">
                                        Login as Employee <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs h-11 px-6">
                                        Create Account
                                    </Button>
                                </Link>
                            </div>

                            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic Fields
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Inline Auto-Save
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Role Isolation
                                </span>
                            </div>
                        </div>

                        {/* Right Hero Product Preview Mockup */}
                        <div className="lg:col-span-6">
                            <div className="relative mx-auto max-w-lg lg:max-w-none bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                {/* Window Control Bar */}
                                <div className="bg-[#26215C] px-4 py-3 flex items-center justify-between border-b border-indigo-950">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="ml-2 text-xs font-semibold text-indigo-200/80">Active Leads Workspace</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] bg-[#534AB7] text-white px-2 py-0.5 rounded font-bold">
                                        ✓ Saved
                                    </div>
                                </div>

                                {/* Mock Spreadsheet Toolbar */}
                                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-400 flex-1 max-w-[200px]">
                                        <Search className="w-3.5 h-3.5" />
                                        <span className="text-[11px]">Filter contacts...</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600 flex items-center gap-1">
                                            <Filter className="w-3 h-3" /> Filter
                                        </span>
                                        <span className="px-2.5 py-1 bg-[#534AB7] text-white rounded text-[11px] font-semibold">
                                            + Add Row
                                        </span>
                                    </div>
                                </div>

                                {/* Mock Spreadsheet Table */}
                                <div className="overflow-x-auto p-1">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                                            <tr>
                                                <th className="p-2.5">Name</th>
                                                <th className="p-2.5">Company</th>
                                                <th className="p-2.5">Email</th>
                                                <th className="p-2.5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-2.5 font-semibold text-slate-900 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#EEEDFE] text-[#534AB7] font-bold text-[10px] flex items-center justify-center">A</div>
                                                    Alex Rivera
                                                </td>
                                                <td className="p-2.5 text-slate-600">Acme Corp</td>
                                                <td className="p-2.5 text-slate-500">alex@acme.com</td>
                                                <td className="p-2.5">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">ACTIVE</span>
                                                </td>
                                            </tr>
                                            {/* Active Selected Cell Row */}
                                            <tr className="bg-[#EEEDFE]/40">
                                                <td className="p-2.5 font-semibold text-slate-900 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-[#534AB7] font-bold text-[10px] flex items-center justify-center">S</div>
                                                    Sarah Chen
                                                </td>
                                                <td className="p-2.5 text-slate-600">TechFlow Inc</td>
                                                <td className="p-2.5 text-slate-900 font-medium ring-2 ring-[#534AB7] bg-white rounded px-1.5 py-0.5">
                                                    sarah@techflow.io
                                                </td>
                                                <td className="p-2.5">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#534AB7] border border-indigo-200 text-[10px] font-bold">QUALIFIED</span>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-2.5 font-semibold text-slate-900 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">M</div>
                                                    Michael Scott
                                                </td>
                                                <td className="p-2.5 text-slate-600">Dunder Mifflin</td>
                                                <td className="p-2.5 text-slate-500">m.scott@dm.com</td>
                                                <td className="p-2.5">
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">LEAD</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECTION 2 — WHITE FEATURE SECTION */}
            <section className="py-16 md:py-20 bg-white border-b border-[#E5E7EB]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Everything You Need to Keep Your CRM Organized
                        </h2>
                        <p className="text-sm text-slate-600">
                            Powerful spreadsheet-style contact management built for modern team workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">Contact Management</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Store customer names, companies, emails, phone numbers, and activity histories efficiently.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Table className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">Spreadsheet Workspace</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Fast grid editing with Enter/Tab keyboard navigation, auto-save status, and bulk paste import.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#534AB7] flex items-center justify-center shrink-0">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">Custom Fields</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Add text, number, email, phone, and dropdown columns to tailor workspace schemas to your workflow.
                                </p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">Secure Access</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Server-side authentication guards protect employee workspace boundaries and admin consoles.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 — BRAND COLOR SECTION */}
            <section className="py-16 md:py-20 bg-[#26215C] text-white border-b border-indigo-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                        {/* Left Grid Preview Mockup */}
                        <div className="lg:col-span-6">
                            <div className="bg-[#1F1B4B] border border-indigo-900/80 rounded-2xl p-5 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-[#7F77DD]" />
                                        <span className="font-bold text-sm text-white">Grid Engine Preview</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-[#534AB7] text-white px-2 py-0.5 rounded">
                                        Live Auto-Save
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-900/40 text-indigo-200 font-semibold">
                                        <span>Column Name</span>
                                        <span>Field Type</span>
                                        <span>Validation</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#26215C] border border-indigo-900/40 items-center">
                                        <span className="font-medium text-white flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-[#7F77DD]" /> Company
                                        </span>
                                        <span className="text-indigo-300">Text</span>
                                        <span className="text-emerald-400 font-mono text-[11px]">Optional</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#26215C] border border-indigo-900/40 items-center">
                                        <span className="font-medium text-white flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-[#7F77DD]" /> Work Email
                                        </span>
                                        <span className="text-indigo-300">Email Format</span>
                                        <span className="text-amber-300 font-mono text-[11px]">Unique Check</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#26215C] border border-indigo-900/40 items-center">
                                        <span className="font-medium text-white flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-[#7F77DD]" /> Phone
                                        </span>
                                        <span className="text-indigo-300">Phone Number</span>
                                        <span className="text-emerald-400 font-mono text-[11px]">Formatted</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/70 text-indigo-200 text-xs font-bold border border-indigo-700/50">
                                <Zap className="w-3.5 h-3.5 text-amber-400" /> High Performance Architecture
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                Built for Simple, Structured CRM Work
                            </h2>

                            <p className="text-sm text-indigo-200/90 leading-relaxed">
                                Streamline your daily business operations with instant spreadsheet cell edits, custom field definitions, and automated activity audit logs.
                            </p>

                            <div className="space-y-3.5 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#534AB7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Instant Cell Editing & Auto-Save</h4>
                                        <p className="text-xs text-indigo-200/70 mt-0.5">Edit records directly inside spreadsheet cells with immediate background auto-save.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#534AB7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Workspace Isolation</h4>
                                        <p className="text-xs text-indigo-200/70 mt-0.5">Employees manage records within their authorized workspace boundaries safely.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#534AB7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Automated Activity Audit Logging</h4>
                                        <p className="text-xs text-indigo-200/70 mt-0.5">Track every record creation, update, and deletion in real-time system logs.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECTION 4 — ENTRY / ACCESS SECTION */}
            <section className="py-16 md:py-20 bg-[#F8FAFC]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Get Started with Your CRM Workspace
                        </h2>
                        <p className="text-sm text-slate-600">
                            Choose your entry path below to sign in, create a workspace, or access system administration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Employee Login */}
                        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center font-bold">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#534AB7] transition-colors">
                                        Employee Login
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        Access your CRM workspace and manage your contacts.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link href="/login?role=employee" className="block">
                                    <Button className="w-full bg-[#534AB7] hover:bg-[#7F77DD] text-white font-semibold text-xs h-10 shadow-sm flex items-center justify-center gap-2">
                                        Login as Employee <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Create Employee Account */}
                        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                        Create Account
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        Start organizing your contacts and provision your workspace.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link href="/signup" className="block">
                                    <Button variant="outline" className="w-full border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-semibold text-xs h-10 flex items-center justify-center gap-2">
                                        Create Account <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Admin Login */}
                        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                            Admin Login
                                        </h3>
                                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                            PORTAL
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        Access the administration console for user management.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link href="/login?role=admin" className="block">
                                    <Button variant="outline" className="w-full border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 font-semibold text-xs h-10 flex items-center justify-center gap-2">
                                        Admin Login <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-[#1E194B] text-indigo-200/80 py-8 px-4 text-xs border-t border-indigo-950">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 bg-[#534AB7] rounded-lg flex items-center justify-center">
                            <Grip className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm tracking-tight">CRM System</span>
                    </div>

                    <p>© {new Date().getFullYear()} CRM Platform. All rights reserved.</p>

                    <div className="flex items-center gap-4 text-slate-300">
                        <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Server Security Guarded</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
