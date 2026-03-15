// app/host-resources/page.tsx
import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "Create your host account",
    desc: "Sign up and select 'Host' as your account type. Complete your profile and ID verification.",
  },
  {
    step: "02",
    title: "List your property or vehicle",
    desc: "Add photos, set pricing, write a compelling description, and configure your availability calendar.",
  },
  {
    step: "03",
    title: "Get reviewed and approved",
    desc: "Our team reviews every new listing within 48 hours to ensure it meets our quality standards.",
  },
  {
    step: "04",
    title: "Start receiving bookings",
    desc: "Once live, guests can discover and book your listing. You'll be notified instantly for every booking request.",
  },
  {
    step: "05",
    title: "Get paid",
    desc: "Payouts are processed within 24 hours of guest check-in, directly to your bank account.",
  },
];

const tips = [
  {
    title: "Professional photography",
    desc: "Listings with high-quality photos earn 40% more bookings. Bright, wide-angle shots of every room perform best.",
  },
  {
    title: "Competitive pricing",
    desc: "Research similar listings in your area. Start slightly below market to build your review score, then adjust upward.",
  },
  {
    title: "Respond quickly",
    desc: "Hosts who respond to booking enquiries within 1 hour see significantly higher conversion rates.",
  },
  {
    title: "Keep your calendar updated",
    desc: "An accurate availability calendar prevents double bookings and improves your listing's ranking in search results.",
  },
  {
    title: "Collect reviews",
    desc: "After every stay, encourage guests to leave a review. A strong review score is your most powerful marketing asset.",
  },
  {
    title: "Set clear house rules",
    desc: "Clear rules set expectations upfront, reducing the chance of disputes and ensuring guests who book are a good fit.",
  },
];

const faqs = [
  {
    q: "What percentage does Asavio take?",
    a: "Asavio charges hosts a 10% service fee per booking. This covers payment processing, customer support, and platform marketing.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts are initiated within 24 hours of guest check-in and typically arrive in your account within 1–2 business days.",
  },
  {
    q: "Can I set my own pricing?",
    a: "Absolutely. You have full control over your nightly rate, seasonal pricing, and any additional fees like cleaning.",
  },
  {
    q: "What if a guest causes damage?",
    a: "Asavio provides a host protection programme. Report any damage within 48 hours of check-out with photo evidence and we'll facilitate a claim.",
  },
  {
    q: "Can I block dates for personal use?",
    a: "Yes. Your availability calendar lets you block any dates you don't want to receive bookings.",
  },
];

export default function HostResourcesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
            Host Resources
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Everything you need to host successfully
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Guides, tips, and tools to help you list, manage, and grow your
            shortlet property or vehicle rental on Asavio.
          </p>
          <Link
            href="/register?role=host"
            className="inline-flex items-center gap-2 bg-secondary text-black font-semibold px-8 py-3 rounded-full hover:bg-yellow-400 transition-colors"
          >
            Start Hosting
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 text-center mb-12">
            How hosting on Asavio works
          </h2>
          <div className="space-y-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-6 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="font-playfair text-3xl font-bold text-secondary flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 text-center mb-4">
            Tips for top-performing listings
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Advice from our highest-rated hosts.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tips.map((tip) => (
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

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-10 text-center">
            Host FAQs
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="border border-gray-100 rounded-2xl p-5"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-16 px-4 text-center">
        <h2 className="font-playfair text-3xl font-bold mb-4">
          Ready to list your space?
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Join hundreds of hosts already earning on Asavio. Setup takes less
          than 30 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register?role=host"
            className="bg-secondary text-black font-semibold px-8 py-3 rounded-full hover:bg-yellow-400 transition-colors"
          >
            Become a Host
          </Link>
          <Link
            href="/contact"
            className="border border-gray-600 text-white font-semibold px-8 py-3 rounded-full hover:border-white transition-colors"
          >
            Talk to Our Team
          </Link>
        </div>
      </section>
    </div>
  );
}
