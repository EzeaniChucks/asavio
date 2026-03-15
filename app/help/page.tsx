"use client";

// app/help/page.tsx
import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    category: "Booking",
    items: [
      {
        q: "How do I make a booking?",
        a: "Browse properties or vehicles, select your dates, and click 'Book Now'. You'll be asked to confirm your details and complete payment. You'll receive an email confirmation once booked.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Cancellation policies vary by listing. Check the specific listing's cancellation policy before booking. To cancel, go to My Bookings in your dashboard and select the relevant booking.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept major debit/credit cards and bank transfers. All transactions are secured and encrypted.",
      },
      {
        q: "When will I receive my booking confirmation?",
        a: "You'll receive an email confirmation immediately after booking. The host will also confirm within 24 hours.",
      },
    ],
  },
  {
    category: "Properties",
    items: [
      {
        q: "Are all properties verified?",
        a: "Yes. Every property on Asavio is reviewed before going live. We verify ownership, inspect photos, and confirm amenities are as listed.",
      },
      {
        q: "What is included in the price?",
        a: "Listed prices cover accommodation only. Additional services like cleaning fees, catering, or airport transfers, if applicable, are stated on the listing page.",
      },
      {
        q: "What if the property doesn't match the listing?",
        a: "Contact us within 2 hours of check-in with photos. We'll investigate and, where warranted, provide a refund or alternative accommodation.",
      },
    ],
  },
  {
    category: "Vehicles",
    items: [
      {
        q: "Is a driver included?",
        a: "Some vehicles are listed with a driver option. Look for the 'With Driver' badge on the listing. You can also filter by this option when searching.",
      },
      {
        q: "What documents do I need to rent a vehicle?",
        a: "A valid driver's licence and a government-issued ID are required for self-drive rentals. Specific requirements are listed on each vehicle page.",
      },
      {
        q: "What happens if the vehicle breaks down?",
        a: "Contact our support line immediately. We'll coordinate a replacement vehicle or roadside assistance as quickly as possible.",
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        q: "How do I become a host?",
        a: "Register an account and select 'Host' as your role, or visit the Become a Host page. Once verified, you can start listing your properties and vehicles.",
      },
      {
        q: "How do I update my profile?",
        a: "Go to your Dashboard and select the Profile section. You can update your name, phone number, and notification preferences there.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
          Help Center
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
          How can we help?
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Find answers to common questions, or reach out and we'll get back to
          you shortly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="bg-secondary text-black font-semibold px-8 py-3 rounded-full hover:bg-yellow-400 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-10">
            {faqs.map((section) => (
              <div key={section.category}>
                <h3 className="font-semibold text-gray-900 text-lg mb-4 pb-2 border-b border-gray-100">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isOpen = openItem === item.q;
                    return (
                      <div
                        key={item.q}
                        className="border border-gray-100 rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setOpenItem(isOpen ? null : item.q)
                          }
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 text-sm">
                            {item.q}
                          </span>
                          <span className="text-gray-400 flex-shrink-0 text-lg leading-none">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="bg-gray-50 py-16 px-4 text-center">
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
          Still need help?
        </h2>
        <p className="text-gray-500 mb-6">
          Our support team is available Monday – Saturday, 8am – 8pm WAT.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-black text-white font-semibold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          Contact Us
        </Link>
      </section>
    </div>
  );
}
