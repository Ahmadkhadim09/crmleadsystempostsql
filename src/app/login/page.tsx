"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/app/actions/auth";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
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
            if (res.success && res.workspaceId) {
                router.push(`/workspaces/${res.workspaceId}`);
            } else {
                setErrorMsg(res.error || "Login failed");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
            <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EEEDFE] text-[#534AB7] mb-2 font-bold text-xl">
                        CRM
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Sign in to your CRM</h1>
                    <p className="text-sm text-[#64748B]">Welcome back! Enter your details to continue.</p>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#171717]">Work Email</Label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
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
                        <Label className="text-xs font-semibold text-[#171717]">Password</Label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
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
                        className="w-full bg-[#534AB7] hover:bg-[#7F77DD] text-white font-medium h-10 shadow-sm"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                <div className="text-center pt-2 text-xs text-[#64748B]">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#534AB7] font-semibold hover:underline">
                        Create Employee Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
