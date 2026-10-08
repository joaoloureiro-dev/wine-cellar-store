import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { dispatchPendingEmails } from "@/lib/email/dispatcher";
import type { EmailProvider, OutgoingEmail } from "@/lib/email/providers";
import { resetDatabase } from "../support/db";

const origin = process.env.APP_URL!;
const password = "garrafeira-2026";

beforeEach(resetDatabase);

async function call(path: string, { body, cookie, method = "POST" }: { body?: unknown; cookie?: string; method?: string } = {}) {
    const response = await auth.handler(
        new Request(new URL(`/api/auth${path}`, origin), {
            method,
            redirect: "manual",
            headers: {
                "Content-Type": "application/json",
                Origin: origin,
                "x-forwarded-for": `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
                ...(cookie ? { Cookie: cookie } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        }),
    );

    return {
        status: response.status,
        location: response.headers.get("location"),
        body: await response.json().catch(() => null),
        cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; "),
    };
}

async function sendAll() {
    const sent: OutgoingEmail[] = [];
    const provider: EmailProvider = {
        name: "fake",
        send: vi.fn(async (email) => {
            sent.push(email);
            return { id: `msg-${sent.length}` };
        }),
    };
    await dispatchPendingEmails({ provider });
    return sent;
}

const linkIn = (email: OutgoingEmail) => email.text.match(/https?:\/\/\S+/g)!.find((url) => url.includes("/api/auth/"))!;

async function signUp(email = "rita@example.pt") {
    const response = await call("/sign-up/email", { body: { name: "Rita Costa", email, password, callbackURL: "/conta/perfil" } });
    expect(response.status).toBe(200);
    return response.cookie;
}

describe("account emails", () => {
    it("confirms the email address after sign-up", async () => {
        await signUp();

        const [email] = await sendAll();
        expect(email).toMatchObject({ to: "rita@example.pt", subject: "Confirme o seu email" });

        const link = new URL(linkIn(email));
        const verified = await call(`${link.pathname.replace("/api/auth", "")}${link.search}`, { method: "GET" });

        expect(verified.status).toBe(302);
        expect(verified.location).toContain("/conta/perfil");
        expect((await db.user.findUniqueOrThrow({ where: { email: "rita@example.pt" } })).emailVerified).toBe(true);
        // The link is not kept once sent.
        expect((await db.emailOutbox.findFirstOrThrow()).payload).toEqual({});
    });

    it("resets the password with the emailed link, once, and signs out other sessions", async () => {
        const session = await signUp();
        await sendAll();

        expect((await call("/request-password-reset", { body: { email: "rita@example.pt", redirectTo: "/nova-password" } })).status).toBe(200);
        const [resetEmail] = await sendAll();
        expect(resetEmail.subject).toBe("Redefinir a sua password");

        // The link redirects to the reset page with the token.
        const link = new URL(linkIn(resetEmail));
        const redirect = await call(`${link.pathname.replace("/api/auth", "")}${link.search}`, { method: "GET" });
        const token = new URL(redirect.location!, origin).searchParams.get("token")!;
        expect(new URL(redirect.location!, origin).pathname).toBe("/nova-password");

        expect((await call("/reset-password", { body: { token, newPassword: "garrafeira-nova-2027" } })).status).toBe(200);
        expect((await call("/reset-password", { body: { token, newPassword: "outra-password-2028" } })).body).toMatchObject({ code: "INVALID_TOKEN" });

        expect((await call("/get-session", { method: "GET", cookie: session })).body).toBeNull();
        expect((await call("/sign-in/email", { body: { email: "rita@example.pt", password } })).status).toBe(401);
        expect((await call("/sign-in/email", { body: { email: "rita@example.pt", password: "garrafeira-nova-2027" } })).status).toBe(200);

        expect((await sendAll()).map((email) => email.subject)).toEqual(["A sua password foi alterada"]);
    });

    it("answers the same for unknown emails and sends nothing", async () => {
        const response = await call("/request-password-reset", { body: { email: "ninguem@example.pt", redirectTo: "/nova-password" } });

        expect(response.status).toBe(200);
        expect(await db.emailOutbox.count()).toBe(0);
    });
});
