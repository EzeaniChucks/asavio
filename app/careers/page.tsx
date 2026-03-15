// app/careers/page.tsx
import Link from "next/link";

const openRoles = [
  {
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote (Africa)",
    type: "Full-time",
  },
  {
    title: "Property Acquisition Manager",
    team: "Operations",
    location: "Abuja, Nigeria",
    type: "Full-time",
  },
  {
    title: "Customer Success Lead",
    team: "Support",
    location: "Lagos, Nigeria",
    type: "Full-time",
  },
  {
    title: "Growth & Partnerships Manager",
    team: "Growth",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
  },
  {
    title: "Marketing Specialist",
    team: "Marketing",
    location: "Remote (Africa)",
    type: "Contract",
  },
];

const perks = [
  { emoji: "💻", title: "Remote-Friendly", desc: "Flexible work arrangements for most roles." },
  { emoji: "📈", title: "Equity", desc: "Own a piece of what you're building." },
  { emoji: "🏥", title: "Health Cover", desc: "Comprehensive HMO for you and your family." },
  { emoji: "🎓", title: "Learning Budget", desc: "Annual stipend for courses, books, and conferences." },
  { emoji: "✈️", title: "Travel Perks", desc: "Free nights at Asavio properties for all staff." },
  { emoji: "🕐", title: "Flexible Hours", desc: "We care about output, not when you clock in." },
];

export default function CareersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
          Careers at Asavio
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
          Build the future of luxury rentals
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          We're a small, ambitious team on a mission to transform how people
          experience premium stays and travel across Africa. Join us.
        </p>
      </section>

      {/* Perks */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 text-center mb-12">
            Why Asavio
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {perks.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <span className="text-3xl mb-3 block">{p.emoji}</span>
                <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            Open Positions
          </h2>
          <p className="text-gray-500 mb-10">
            Don't see a perfect fit? Email us at{" "}
            <a
              href="mailto:careers@asavio.com"
              className="text-black underline"
            >
              careers@asavio.com
            </a>
          </p>
          <div className="space-y-3">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{role.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <span>{role.team}</span>
                    <span>{role.location}</span>
                    <span className="text-secondary font-medium">{role.type}</span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@asavio.com?subject=Application: ${role.title}`}
                  className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Apply Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
