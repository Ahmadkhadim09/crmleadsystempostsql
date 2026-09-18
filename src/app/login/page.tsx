"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/app/actions/auth";
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, UserCheck, Grip } from "lucide-react";

function LoginFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedRoleParam = searchParams.get("role");
    const isAdminRequested = requestedRoleParam === "admin";

    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!email.trim() || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        startTransition(async () => {
            const res = await loginUser({ email, password });
            if (res.success) {
                // Post-login redirect based STRICTLY on actual server-side role from DB
                if (res.role === "ADMIN") {
                    router.push("/admin");
                } else if (res.workspaceId) {
                    router.push(`/workspaces/${res.workspaceId}`);
                } else {
                    router.push("/overview");
                }
            } else {
                setErrorMsg(res.error || "Login failed");
            }
        });
    };

    return (
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8 space-y-6">
            <div className="text-center space-y-2">
                <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EEEDFE] text-[#534AB7] mb-2 shadow-xs hover:scale-105 transition-transform">
                    <Grip className="w-6 h-6" />
                </Link>

                <div className="flex items-center justify-center gap-2">
                    {isAdminRequested ? (
                        <>
                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Login</h1>
                        </>
                    ) : (
                        <>
                            <UserCheck className="w-5 h-5 text-[#534AB7]" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Login</h1>
                        </>
                    )}
                </div>

                <p className="text-xs text-[#64748B]">
                    {isAdminRequested
                        ? "System Administrator portal. Sign in with your administrator credentials."
                        : "Welcome back! Enter your employee credentials to access your workspace."}
                </p>

                {isAdminRequested && (
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold tracking-wide">
                        RESTRICTED ADMIN PORTAL
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Work Email</Label>
                    <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            type="email"
                            placeholder="name@company.com"
                            className="pl-9 bg-[#F8FAFC] border-[#E5E7EB] focus:border-[#534AB7] text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isPending}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Password</Label>
                    <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-9 bg-[#F8FAFC] border-[#E5E7EB] focus:border-[#534AB7] text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className={`w-full font-semibold text-xs h-10 shadow-sm text-white transition-colors ${isAdminRequested ? "bg-slate-900 hover:bg-slate-800" : "bg-[#534AB7] hover:bg-[#7F77DD]"
                        }`}
                    disabled={isPending}
                >
                    {isPending ? (
                        <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Authenticating...
                        </span>
                    ) : (
                        isAdminRequested ? "Sign In as Administrator" : "Sign In to Workspace"
                    )}
                </Button>
            </form>

            <div className="text-center pt-2 space-y-2 text-xs text-slate-500">
                <p>
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#534AB7] font-semibold hover:underline">
                        Create Employee Account
                    </Link>
                </p>
                <div className="pt-1 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                    <Link href="/" className="hover:text-slate-600 underline">
                        ← Back to Home
                    </Link>
                    <span>•</span>
                    {isAdminRequested ? (
                        <Link href="/login?role=employee" className="hover:text-[#534AB7]">
                            Switch to Employee Login
                        </Link>
                    ) : (
                        <Link href="/login?role=admin" className="hover:text-amber-700">
                            Switch to Admin Login
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
            <Suspense fallback={
                <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#534AB7]" />
                </div>
            }>
                <LoginFormContent />
            </Suspense>
        </div>
    );
}
