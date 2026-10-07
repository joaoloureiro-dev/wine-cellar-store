import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";

// Time-based revalidation until tag-based invalidation (Cache stage).
export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
    </main>
  );
}
