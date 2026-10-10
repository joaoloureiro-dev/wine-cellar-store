import { KindListing, kindListingMetadata } from "@/components/catalog/kind-listing";

export const metadata = kindListingMetadata("climate-unit");

export default function Page() {
    return <KindListing kind="climate-unit" />;
}
