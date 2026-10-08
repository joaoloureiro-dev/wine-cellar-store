import "server-only";

import type { RenderedEmail } from "@/lib/email/layout";

/** Renders an email from its payload at send time; null when there is nothing to send. */
export type EmailTemplate = (payload: Record<string, unknown>) => Promise<RenderedEmail | null>;
export type EmailTemplates = Record<string, EmailTemplate>;

export const emailTemplates: EmailTemplates = {};
