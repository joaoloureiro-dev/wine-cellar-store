import { KindListing, kindListingMetadata } from "@/components/catalog/kind-listing";

export const metadata = kindListingMetadata("accessory");

export default function Page() {
    return <KindListing kind="accessory" />;
}
