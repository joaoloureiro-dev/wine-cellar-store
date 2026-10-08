import { absoluteUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export type RenderedEmail = { subject: string; html: string; text: string };

/** Escapes text for HTML. Every dynamic value in a template goes through it. */
export function escapeHtml(value: string | number) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export type EmailBlock =
    | { kind: "paragraph"; text: string }
    | { kind: "details"; rows: [label: string, value: string][] }
    | { kind: "button"; label: string; href: string }
    | { kind: "note"; text: string };

const colors = { wine: "#681c2b", text: "#2b2523", muted: "#6b625d", border: "#e7e1d8", background: "#f7f4ef" };

function blockHtml(block: EmailBlock) {
    switch (block.kind) {
        case "paragraph":
            return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${colors.text}">${escapeHtml(block.text)}</p>`;
        case "note":
            return `<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:${colors.muted}">${escapeHtml(block.text)}</p>`;
        case "button":
            return `<p style="margin:8px 0 24px"><a href="${escapeHtml(block.href)}" style="display:inline-block;background:${colors.wine};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:6px">${escapeHtml(block.label)}</a></p>`;
        case "details":
            return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${colors.border};border-radius:8px;border-collapse:separate">${block.rows
                .map(
                    ([label, value]) =>
                        `<tr><td style="padding:10px 14px;font-size:13px;color:${colors.muted};border-bottom:1px solid ${colors.border}">${escapeHtml(label)}</td><td style="padding:10px 14px;font-size:14px;color:${colors.text};font-weight:600;text-align:right;border-bottom:1px solid ${colors.border}">${escapeHtml(value)}</td></tr>`,
                )
                .join("")}</table>`;
    }
}

function blockText(block: EmailBlock) {
    switch (block.kind) {
        case "paragraph":
        case "note":
            return block.text;
        case "button":
            return `${block.label}: ${block.href}`;
        case "details":
            return block.rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    }
}

/**
 * Builds the HTML (inline styles, table layout: email clients ignore most
 * CSS) and plain-text versions of an email from simple blocks.
 */
export function renderEmail({ subject, preheader, heading, blocks }: { subject: string; preheader: string; heading: string; blocks: EmailBlock[] }): RenderedEmail {
    const home = absoluteUrl("/");
    const footer = `${siteConfig.name} · ${home}`;

    const html = `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${colors.background};font-family:Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.background}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${colors.border};border-radius:12px">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;font-size:24px;color:${colors.wine}">${escapeHtml(siteConfig.name)}</td></tr>
<tr><td style="padding:8px 28px 12px"><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:32px;color:${colors.text}">${escapeHtml(heading)}</h1>
${blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid ${colors.border};font-size:12px;line-height:18px;color:${colors.muted}">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;

    const text = [heading, "", ...blocks.map(blockText).flatMap((line) => [line, ""]), "—", footer].join("\n");

    return { subject, html, text };
}
