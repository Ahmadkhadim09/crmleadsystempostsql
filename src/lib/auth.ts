import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "crm_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "crm_secure_secret_key_default_32bytes!!";

export interface AuthSession {
    employeeId: string;
    name: string;
    email: string | null;
    role: string;
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, originalHash] = storedHash.split(":");
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(hashToVerify, "hex"));
}

function signToken(payload: string): string {
    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(payload);
    const signature = hmac.digest("hex");
    return `${payload}.${signature}`;
}

function verifyToken(token: string): string | null {
    if (!token || !token.includes(".")) return null;
    const lastDot = token.lastIndexOf(".");
    const payload = token.substring(0, lastDot);
    const signature = token.substring(lastDot + 1);

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
        return payload;
    }
    return null;
}

export async function setSessionCookie(employeeId: string, role: string) {
    const cookieStore = await cookies();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const rawPayload = JSON.stringify({ employeeId, role, expiresAt });
    const signed = signToken(rawPayload);

    cookieStore.set(SESSION_COOKIE_NAME, signed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60
    });
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });
}

export async function getSession(): Promise<AuthSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payloadStr = verifyToken(token);
    if (!payloadStr) return null;

    try {
        const payload = JSON.parse(payloadStr);
        if (payload.expiresAt < Date.now()) return null;

        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
            select: { id: true, name: true, email: true, role: true, status: true }
        });

        if (!employee || employee.status === "DISABLED") return null;

        return {
            employeeId: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role
        };
    } catch {
        return null;
    }
}

export async function requireAuth(): Promise<AuthSession> {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }
    return session;
}

export async function requireWorkspaceAccess(workspaceId: string): Promise<AuthSession> {
    const session = await requireAuth();

    if (session.role === "ADMIN") {
        return session;
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { employeeId: true }
    });

    if (!workspace || workspace.employeeId !== session.employeeId) {
        throw new Error("Unauthorized access to workspace");
    }

    return session;
}
