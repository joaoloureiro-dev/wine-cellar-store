import { Container } from "@/components/layout/container";

export default function Home() {
  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="space-y-10">
          <div className="max-w-3xl space-y-5">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-wine">
              Wine Cellar Store
            </span>

            <h1 className="font-display text-5xl font-medium leading-[0.95] tracking-[-0.02em] text-charcoal sm:text-6xl lg:text-7xl">
              Preserve every bottle at its best.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Premium wine cellars designed for collectors, enthusiasts and
              people who care about every bottle in their collection.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="rounded-md bg-wine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-dark">
              Primary action
            </button>

            <button className="rounded-md border border-border bg-surface px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted">
              Secondary action
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-lg bg-wine" />
            <div className="h-24 rounded-lg bg-champagne" />
            <div className="h-24 rounded-lg bg-charcoal" />
            <div className="h-24 rounded-lg border border-border bg-surface" />
          </div>
        </div>
      </Container>
    </main>
  );
}