import { Container } from "@/components/layout/container";

/** Placeholder while catalogue filters and results stream in. */
export function CatalogSkeleton() {
    return (
        <Container className="py-8 sm:py-12 lg:py-16">
            <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:gap-14" aria-busy="true">
                <div className="hidden h-96 animate-pulse rounded-xl bg-surface-muted motion-reduce:animate-none lg:block" />
                <div>
                    <div className="h-10 animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none" />
                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }, (_, index) => (
                            <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-muted motion-reduce:animate-none" />
                        ))}
                    </div>
                    <span className="sr-only">A carregar caves…</span>
                </div>
            </div>
        </Container>
    );
}
