"use client";

/**
 * Last-resort boundary (errors in the root layout). Renders its own
 * document without the global stylesheet, hence the inline styles.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return (
        <html lang="pt-PT">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    background: "#f7f5f0",
                    color: "#242220",
                    fontFamily: "system-ui, sans-serif",
                    padding: 20,
                    textAlign: "center",
                }}
            >
                <title>Erro | Cellarium</title>
                <main>
                    <h1 style={{ fontSize: 32, fontWeight: 500, margin: 0 }}>Algo correu mal</h1>
                    <p style={{ color: "#6f6a64" }}>Estamos a resolver. Tente novamente dentro de instantes.</p>
                    {error.digest && <p style={{ color: "#6f6a64", fontSize: 12 }}>Referência: {error.digest}</p>}
                    <button
                        type="button"
                        onClick={() => retry()}
                        style={{ marginTop: 16, minHeight: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#681c2b", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                    >
                        Tentar novamente
                    </button>
                </main>
            </body>
        </html>
    );
}
