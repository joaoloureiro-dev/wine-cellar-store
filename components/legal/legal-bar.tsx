import Link from "next/link";

import { Container } from "@/components/layout/container";
import { complaintsBookUrl, legalLinks } from "@/lib/legal/links";
import { siteConfig } from "@/lib/site";

/** Legal links shown on every page (to be absorbed by the site footer). */
export function LegalBar() {
    return (
        <footer className="border-t border-border bg-surface">
            <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
                <p>© {siteConfig.name}</p>
                <nav aria-label="Informação legal">
                    <ul className="flex flex-wrap gap-x-5 gap-y-2">
                        {legalLinks.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="hover:text-wine hover:underline">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <a href={complaintsBookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-wine hover:underline">
                                Livro de Reclamações
                            </a>
                        </li>
                    </ul>
                </nav>
            </Container>
        </footer>
    );
}
