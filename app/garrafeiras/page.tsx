import { KindListing, kindListingMetadata } from "@/components/catalog/kind-listing";

export const metadata = kindListingMetadata("wine-rack");

export default function Page() {
    return <KindListing kind="wine-rack" />;
}
