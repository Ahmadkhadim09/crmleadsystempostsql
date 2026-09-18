"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SignupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
});

export async function signupEmployee(data: { name: string; email: string; password: string; confirmPassword: string }) {
    const result = SignupSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message, validationErrors: result.error.format() };
    }

    const emailNormalized = result.data.email.toLowerCase().trim();

    try {
        // Check duplicate email
        const existing = await prisma.employee.findFirst({
            where: { email: emailNormalized }
        });

        if (existing) {
            return { success: false, error: "An account with this email address already exists." };
        }

        const passwordHash = hashPassword(result.data.password);

        // ALWAYS force role to EMPLOYEE for public signup
        const employee = await prisma.employee.create({
            data: {
                name: result.data.name.trim(),
                email: emailNormalized,
                passwordHash,
                role: "EMPLOYEE",
                status: "ACTIVE",
                emailVerified: true
            }
        });

        // Create initial workspace for the new employee
        const workspace = await prisma.workspace.create({
            data: {
                name: `${employee.name}'s Workspace`,
                employeeId: employee.id,
                fields: {
                    create: [
                        { name: "Name", type: "TEXT", isRequired: true, order: 0 },
                        { name: "Company", type: "TEXT", isRequired: false, order: 1 },
                        { name: "Email", type: "EMAIL", isRequired: false, order: 2 },
                        { name: "Phone Number", type: "PHONE", isRequired: false, order: 3 }
                    ]
                }
            }
        });

        await setSessionCookie(employee.id, employee.role);
        revalidatePath("/");

        return { success: true, workspaceId: workspace.id };
    } catch (e: any) {
        console.error("Signup error:", e);
        return { success: false, error: "Failed to create account. Please try again or contact support." };
    }
}

export async function loginUser(data: { email: string; password: string }) {
    const result = LoginSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    const emailNormalized = result.data.email.toLowerCase().trim();

    try {
        const employee = await prisma.employee.findFirst({
            where: { email: emailNormalized }
        });

        if (!employee || !employee.passwordHash) {
            // Safe generic error to prevent email enumeration
            return { success: false, error: "Invalid email or password." };
        }

        const isValid = verifyPassword(result.data.password, employee.passwordHash);
        if (!isValid) {
            return { success: false, error: "Invalid email or password." };
        }

        if (employee.status === "DISABLED") {
            return { success: false, error: "Your account has been disabled. Please contact an administrator." };
        }

        await setSessionCookie(employee.id, employee.role);

        // Find or create workspace for user
        let workspace = await prisma.workspace.findFirst({
            where: { employeeId: employee.id },
            orderBy: { createdAt: "asc" }
        });

        if (!workspace) {
            workspace = await prisma.workspace.create({
                data: {
                    name: `${employee.name}'s Workspace`,
                    employeeId: employee.id,
                    fields: {
                        create: [
                            { name: "Name", type: "TEXT", isRequired: true, order: 0 },
                            { name: "Company", type: "TEXT", isRequired: false, order: 1 },
                            { name: "Email", type: "EMAIL", isRequired: false, order: 2 },
                            { name: "Phone Number", type: "PHONE", isRequired: false, order: 3 }
                        ]
                    }
                }
            });
        }

        revalidatePath("/");
        return { success: true, workspaceId: workspace.id, role: employee.role };
    } catch (e: any) {
        console.error("Login error:", e);
        return { success: false, error: "Authentication failed." };
    }
}

export async function logoutUser() {
    await clearSessionCookie();
    revalidatePath("/");
    return { success: true };
}
