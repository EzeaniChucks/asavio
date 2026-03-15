// app/cookies/page.tsx
import Link from "next/link";

const cookieTypes = [
  {
    type: "Essential Cookies",
    required: true,
    desc: "These cookies are necessary for the platform to function. They enable core features like user authentication, session management, and booking flows. They cannot be disabled.",
    examples: ["Session token", "CSRF protection", "Load balancer routing"],
  },
  {
    type: "Functional Cookies",
    required: false,
    desc: "These cookies enhance your experience by remembering your preferences, such as your preferred currency, language, and search filters.",
    examples: ["Search filter preferences", "Saved searches", "UI preferences"],
  },
  {
    type: "Analytics Cookies",
    required: false,
    desc: "We use analytics cookies to understand how users interact with our platform — which pages are visited, how long people stay, and what features they use. This helps us improve Asavio.",
    examples: ["Page views", "User flow tracking", "Error reporting"],
  },
  {
    type: "Marketing Cookies",
    required: false,
    desc: "These cookies are used to deliver personalised advertisements on third-party platforms and to measure the effectiveness of our marketing campaigns.",
    examples: ["Ad personalisation", "Campaign attribution", "Retargeting"],
  },
];

export default function CookiesPage() {
  const updated = "15 March 2026";

  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 px-4 text-center">
        <h1 className="font-playfair text-4xl font-bold mb-3">Cookie Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: {updated}</p>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-gray prose-headings:font-playfair prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed mb-12">
            <h2>What are cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit
              a website. They are widely used to make websites work efficiently
              and to provide information to website owners.
            </p>
            <h2>How Asavio uses cookies</h2>
            <p>
              We use cookies to keep you logged in, remember your preferences,
              understand how you use our platform, and in some cases to deliver
              relevant advertising. The table below explains each category.
            </p>
          </div>

          {/* Cookie types */}
          <div className="space-y-4 mb-12">
            {cookieTypes.map((c) => (
              <div
                key={c.type}
                className="border border-gray-100 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{c.type}</h3>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      c.required
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {c.required ? "Always active" : "Optional"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  {c.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.examples.map((ex) => (
                    <span
                      key={ex}
                      className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-gray prose-headings:font-playfair prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed">
            <h2>Managing your cookie preferences</h2>
            <p>
              You can control and manage cookies in your browser settings. Most
              browsers allow you to refuse cookies or delete existing ones.
              Please note that disabling certain cookies may affect the
              functionality of the Asavio platform.
            </p>
            <p>Browser-specific guidance:</p>
            <ul>
              <li>
                <strong>Chrome:</strong> Settings → Privacy and security →
                Cookies and other site data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website
                Data
              </li>
              <li>
                <strong>Firefox:</strong> Options → Privacy & Security → Cookies
                and Site Data
              </li>
            </ul>

            <h2>Third-party cookies</h2>
            <p>
              Some features of our platform use third-party services (such as
              analytics and payment providers) that may set their own cookies.
              We do not control these cookies — please refer to the respective
              third-party privacy policies.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this Cookie Policy periodically. Any changes will be
              reflected by updating the date at the top of this page.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about our use of cookies, contact us at{" "}
              <a href="mailto:privacy@asavio.com" className="text-black underline">
                privacy@asavio.com
              </a>
              .
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-black transition-colors underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-black transition-colors underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
