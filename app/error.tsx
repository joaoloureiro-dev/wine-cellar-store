"use client";

import Link from "next/link";

/**
 * Error boundary for pages. Server error details never reach the browser;
 * the reference (digest) matches the server log line (instrumentation.ts).
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return (
        <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">Erro</p>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-[-0.03em] text-charcoal sm:text-5xl">
                Algo correu mal
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted">
                Não foi possível carregar esta página. Tente novamente dentro de instantes.
            </p>
            {error.digest && <p className="mt-2 text-xs text-muted">Referência: {error.digest}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                    type="button"
                    onClick={() => retry()}
                    className="inline-flex min-h-11 items-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    Tentar novamente
                </button>
                <Link
                    href="/"
                    className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-5 text-sm font-semibold text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    Voltar ao início
                </Link>
            </div>
        </main>
    );
}
