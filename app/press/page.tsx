// app/press/page.tsx
import Link from "next/link";

const pressItems = [
  {
    outlet: "TechCabal",
    date: "March 2026",
    title: "Asavio is redefining the shortlet market with a curated luxury-first approach",
    excerpt:
      "The Lagos-based startup is taking on the fragmented Nigerian rental market with a platform that prioritises quality, trust, and a seamless digital experience.",
  },
  {
    outlet: "Nairametrics",
    date: "February 2026",
    title: "Nigeria's luxury shortlet sector sees surge in demand — and Asavio is leading it",
    excerpt:
      "Driven by growing diaspora travel and domestic business travel, premium shortlets are now a multi-billion naira market, and Asavio is positioned at the top end.",
  },
  {
    outlet: "BusinessDay",
    date: "January 2026",
    title: "Asavio raises seed round to expand luxury rental platform across West Africa",
    excerpt:
      "The company plans to use fresh capital to grow its host base, launch a vehicle rental vertical, and expand into Abuja, Port Harcourt, and Accra.",
  },
];

const mediaAssets = [
  { label: "Brand Logo (SVG)", size: "42 KB" },
  { label: "Brand Logo (PNG)", size: "180 KB" },
  { label: "Product Screenshots", size: "4.2 MB" },
  { label: "Founder Photos", size: "8.1 MB" },
  { label: "Brand Guidelines PDF", size: "2.3 MB" },
];

export default function PressPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
          Press & Media
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
          Asavio in the news
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          For media enquiries, please reach out to{" "}
          <a
            href="mailto:press@asavio.com"
            className="text-secondary hover:underline"
          >
            press@asavio.com
          </a>
        </p>
      </section>

      {/* Press coverage */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-10">
            Recent Coverage
          </h2>
          <div className="space-y-6">
            {pressItems.map((item) => (
              <div
                key={item.title}
                className="border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {item.outlet}
                  </span>
                  <span className="text-sm text-gray-400">{item.date}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
              Media Kit
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Download our official brand assets and guidelines for editorial
              use. Please read our brand guidelines before publishing.
            </p>
            <a
              href="mailto:press@asavio.com?subject=Media Kit Request"
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              Request Media Kit
            </a>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {mediaAssets.map((asset) => (
              <div
                key={asset.label}
                className="px-5 py-4 flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">{asset.label}</span>
                <span className="text-xs text-gray-400">{asset.size}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 text-center">
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
          Media contact
        </h2>
        <p className="text-gray-500 mb-2">
          For interview requests, quotes, and media enquiries:
        </p>
        <a
          href="mailto:press@asavio.com"
          className="text-black font-semibold text-lg hover:underline"
        >
          press@asavio.com
        </a>
      </section>
    </div>
  );
}
