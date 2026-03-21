// app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Asavio — Nigeria's premium shortlet and luxury car rental platform. Meet the team redefining luxury rentals across Africa.",
  openGraph: {
    title: "About Asavio — Redefining Luxury Rentals in Africa",
    description:
      "We connect discerning travellers with premium shortlet properties and luxury vehicles across Nigeria's finest cities.",
  },
};

const stats = [
  { value: "500+", label: "Premium Properties" },
  { value: "120+", label: "Luxury Vehicles" },
  { value: "10,000+", label: "Happy Guests" },
  { value: "15+", label: "Cities Covered" },
];

const team = [
  {
    name: "Asama Oluwaseun",
    role: "Chief Executive Officer",
    bio: "A visionary entrepreneur and hospitality industry trailblazer, Asama conceived Asavio from a deep conviction that Africa deserved a world-class luxury rental experience. With years of hands-on experience in the rental industry and an extraordinary talent for spotting market white space, he has built Asavio from the ground up — personally curating its host network, defining its brand ethos, and charting its expansion across the continent. Under his leadership, Asavio has become the definitive standard for premium shortlets in Nigeria.",
  },
  {
    name: "Ezeani Chukwudi",
    role: "Lead Engineer",
    bio: "The architectural mind behind every pixel and data point on the Asavio platform, Chukwudi is a rare breed of engineer who blends technical mastery with an acute sense of product craft. He designed and built the entire Asavio stack — from the high-performance API to the polished, lightning-fast frontend — with an obsessive attention to detail that shows in every interaction. His work has set a technical benchmark that few platforms in the region come close to matching.",
  },
];

const values = [
  {
    title: "Excellence",
    desc: "We curate only the finest properties and vehicles — every listing is vetted to meet our quality standard.",
  },
  {
    title: "Trust",
    desc: "Transparent pricing, verified hosts, and secure payments so you can book with complete confidence.",
  },
  {
    title: "Experience",
    desc: "From first search to check-out, every touchpoint is designed to feel effortless and memorable.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
            Our Story
          </p>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold leading-tight mb-6">
            Redefining Luxury Rentals in Africa
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Asavio was born from a simple belief: everyone deserves access to
            extraordinary spaces and vehicles. We connect discerning travellers
            with premium shortlet properties and luxury vehicles across Africa's
            finest cities.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">
              Our Mission
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Making luxury accessible, one booking at a time
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We started Asavio because we experienced first-hand how difficult
              it was to find truly premium short-stay accommodation and vehicle
              rentals in Nigeria. Too many platforms compromised on quality,
              transparency, or both.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today we partner with the best hosts across Lagos, Abuja, Port
              Harcourt, and beyond — bringing you a curated selection of
              properties and vehicles that genuinely deliver on the promise of
              luxury.
            </p>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 space-y-6">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="font-semibold text-gray-900 mb-1">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">
              The Team
            </p>
            <h2 className="font-playfair text-3xl font-bold text-gray-900">
              People behind Asavio
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl mb-4">
                  {member.name[0]}
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-xs text-secondary font-medium mt-0.5 mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
          Ready to experience Asavio?
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Browse our curated collection of premium properties and luxury
          vehicles today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/properties"
            className="bg-black text-white font-semibold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            Browse Properties
          </Link>
          <Link
            href="/register?role=host"
            className="border border-black text-black font-semibold px-8 py-3 rounded-full hover:bg-black hover:text-white transition-colors"
          >
            Become a Host
          </Link>
        </div>
      </section>
    </div>
  );
}
