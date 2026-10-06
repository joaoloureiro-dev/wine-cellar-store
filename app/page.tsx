import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";

// Time-based revalidation until tag-based invalidation (Cache stage).
export const revalidate = 300;

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
    </main>
  );
}
