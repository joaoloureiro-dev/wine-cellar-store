import "server-only";

import { renderEmail } from "@/lib/email/layout";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Account emails carry one-time links: the links come from Better Auth
 * and point at this site; anything else is refused.
 */
function ownLink(url: unknown) {
    if (typeof url !== "string") return null;

    try {
        return new URL(url).origin === new URL(absoluteUrl("/")).origin ? url : null;
    } catch {
        return null;
    }
}

const greeting = (name: unknown) => (typeof name === "string" && name.trim() ? `Olá ${name.trim().split(/\s+/)[0]},` : "Olá,");

export async function renderPasswordReset(payload: Record<string, unknown>) {
    const url = ownLink(payload.url);
    if (!url) return null;

    return renderEmail({
        subject: "Redefinir a sua password",
        preheader: "O link é válido durante 1 hora.",
        heading: "Redefinir password",
        blocks: [
            { kind: "paragraph", text: greeting(payload.name) },
            { kind: "paragraph", text: "Recebemos um pedido para redefinir a password da sua conta Cellarium. Use o botão abaixo; o link é válido durante 1 hora e só pode ser usado uma vez." },
            { kind: "button", label: "Escolher nova password", href: url },
            { kind: "note", text: "Se não fez este pedido, ignore este email: a sua password não muda." },
        ],
    });
}

export async function renderPasswordChanged(payload: Record<string, unknown>) {
    return renderEmail({
        subject: "A sua password foi alterada",
        preheader: "Por segurança, terminámos as outras sessões.",
        heading: "Password alterada",
        blocks: [
            { kind: "paragraph", text: greeting(payload.name) },
            { kind: "paragraph", text: "A password da sua conta Cellarium foi redefinida e as sessões abertas noutros dispositivos foram terminadas." },
            { kind: "note", text: "Se não foi você, redefina a password de imediato e contacte-nos." },
            { kind: "button", label: "Redefinir password", href: absoluteUrl("/recuperar-password") },
        ],
    });
}

export async function renderVerifyEmail(payload: Record<string, unknown>) {
    const url = ownLink(payload.url);
    if (!url) return null;

    return renderEmail({
        subject: "Confirme o seu email",
        preheader: "Falta um passo para confirmar a sua conta.",
        heading: "Confirme o seu email",
        blocks: [
            { kind: "paragraph", text: greeting(payload.name) },
            { kind: "paragraph", text: "Confirme que este é o seu email para garantir que recebe as informações das suas encomendas. O link é válido durante 24 horas." },
            { kind: "button", label: "Confirmar email", href: url },
            { kind: "note", text: "Se não criou uma conta na Cellarium, ignore este email." },
        ],
    });
}
