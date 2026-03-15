// app/safety/page.tsx
import Link from "next/link";

const guestTips = [
  {
    title: "Verify the listing before travelling",
    desc: "Check that the property address matches what was confirmed in your booking. Never pay outside the Asavio platform.",
  },
  {
    title: "Review the house rules",
    desc: "Each property has its own rules regarding guests, noise, and access hours. Read them carefully before booking.",
  },
  {
    title: "Keep our app handy",
    desc: "Save our support number and use in-app messaging to communicate with your host. Avoid sharing personal contact details.",
  },
  {
    title: "Check emergency exits on arrival",
    desc: "Familiarise yourself with fire exits, emergency contacts, and the nearest hospital or police station.",
  },
  {
    title: "Report concerns immediately",
    desc: "If something at the property feels unsafe or doesn't match the listing, contact us within 2 hours of arrival.",
  },
];

const hostTips = [
  {
    title: "Verify your guests",
    desc: "All guests on Asavio provide verified ID at registration. You can view a guest's profile and booking history before accepting.",
  },
  {
    title: "Install safety equipment",
    desc: "Smoke detectors, carbon monoxide alarms, and a first-aid kit are required in all listed properties.",
  },
  {
    title: "Secure your property",
    desc: "Use digital locks or key boxes to avoid physical key handovers. Change access codes between bookings.",
  },
  {
    title: "Keep communication on-platform",
    desc: "Use Asavio messaging for all communications. This protects both parties and gives us a record if issues arise.",
  },
];

const policies = [
  {
    title: "Zero tolerance for fraud",
    desc: "Any listing found to misrepresent a property will be immediately removed and the host banned from the platform.",
  },
  {
    title: "Secure payments only",
    desc: "All transactions are processed securely through Asavio. We will never ask you to pay directly to a host's bank account.",
  },
  {
    title: "ID verification",
    desc: "All users undergo ID verification before booking or listing. This applies to both guests and hosts.",
  },
  {
    title: "24/7 incident reporting",
    desc: "Our safety team is available around the clock to handle urgent reports. Reach us via in-app chat or emergency phone.",
  },
];

export default function SafetyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
          Safety
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
          Your safety is our priority
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Asavio is built on trust. Every feature, policy, and process is
          designed with your safety and security in mind.
        </p>
      </section>

      {/* Platform policies */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 text-center mb-12">
            Platform Safety Standards
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {policies.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guest tips */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            Tips for Guests
          </h2>
          <p className="text-gray-500 mb-8">
            Follow these guidelines for a safe and enjoyable stay.
          </p>
          <div className="space-y-4">
            {guestTips.map((tip, i) => (
              <div
                key={tip.title}
                className="flex items-start gap-5 p-5 rounded-2xl border border-gray-100"
              >
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host tips */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            Tips for Hosts
          </h2>
          <p className="text-gray-500 mb-8">
            Best practices to keep your property and guests safe.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {hostTips.map((tip) => (
              <div
                key={tip.title}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report */}
      <section className="py-16 px-4 text-center">
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
          Report a safety concern
        </h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          If you experience or witness something unsafe, report it immediately.
          Our safety team responds within the hour.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-black text-white font-semibold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          Report an Issue
        </Link>
      </section>
    </div>
  );
}
