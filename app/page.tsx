// app/page.tsx
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import Categories from "@/components/home/Categories";
import LuxuryVehicles from "@/components/home/LuxuryVehicles";
import ExperienceSection from "@/components/home/ExperienceSection";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <div>
      <Hero />
      <div className="overflow-hidden">
        <Categories />
        <FeaturedProperties />
        <LuxuryVehicles />
        <ExperienceSection />
        <CTASection />
      </div>
    </div>
  );
}