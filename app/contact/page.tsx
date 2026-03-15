"use client";

// app/contact/page.tsx
import { useState, FormEvent } from "react";

const channels = [
  {
    icon: "✉️",
    title: "Email",
    detail: "hello@asavio.com",
    desc: "We reply within 24 hours.",
    href: "mailto:hello@asavio.com",
  },
  {
    icon: "💬",
    title: "WhatsApp",
    detail: "+234 800 000 0000",
    desc: "Mon – Sat, 8am – 8pm WAT",
    href: "https://wa.me/2348000000000",
  },
  {
    icon: "📍",
    title: "Office",
    detail: "Victoria Island, Lagos",
    desc: "By appointment only.",
    href: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // In production, wire this to a backend endpoint or email service
    setSubmitted(true);
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4">
          Get in Touch
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
          We'd love to hear from you
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Whether it's a booking question, partnership enquiry, or feedback —
          our team is here to help.
        </p>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
              Send a message
            </h2>
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">✅</p>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  Message received!
                </h3>
                <p className="text-gray-500 text-sm">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@email.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="What's this about?"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Channels */}
          <div>
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
              Other ways to reach us
            </h2>
            <div className="space-y-4">
              {channels.map((c) => (
                <div
                  key={c.title}
                  className="bg-gray-50 rounded-2xl p-5 flex items-start gap-4"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{c.title}</p>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="text-black font-medium hover:underline text-sm"
                      >
                        {c.detail}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-700">{c.detail}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-black text-white rounded-2xl p-6">
              <h3 className="font-semibold mb-2">For urgent booking issues</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If you have a same-day check-in issue or emergency, please
                contact us via WhatsApp for the fastest response.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
