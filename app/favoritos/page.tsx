import type { Metadata } from "next";

import { PageIntro } from "@/components/catalog/page-intro";
import { FavoritesStorageHint } from "@/components/favorites/favorites-storage-hint";
import { FavoritesView } from "@/components/favorites/favorites-view";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
    title: "Favoritos",
    robots: { index: false, follow: false },
};

export default function FavoritesPage() {
    return (
        <main>
            <PageIntro
                breadcrumbs={[{ label: "Início", href: "/" }, { label: "Favoritos" }]}
                eyebrow="Favoritos"
                title="Os seus favoritos"
                description="As caves que guardou para comparar."
                meta={<FavoritesStorageHint />}
            />
            <Container className="py-10 sm:py-14 lg:py-20">
                <FavoritesView />
            </Container>
        </main>
    );
}
