// app/terms/page.tsx
export default function TermsPage() {
  const updated = "15 March 2026";

  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 px-4 text-center">
        <h1 className="font-playfair text-4xl font-bold mb-3">
          Terms of Service
        </h1>
        <p className="text-gray-400 text-sm">Last updated: {updated}</p>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray prose-headings:font-playfair prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
          <p>
            Welcome to Asavio. These Terms of Service ("Terms") govern your
            access to and use of our website, mobile application, and services
            (collectively, the "Platform"). By accessing or using Asavio, you
            agree to be bound by these Terms. If you do not agree, please do not
            use our Platform.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally capable of entering
            into contracts to use Asavio. By registering, you represent and
            warrant that you meet these requirements.
          </p>

          <h2>2. Account Registration</h2>
          <p>
            You must provide accurate, complete, and current information when
            creating an account. You are responsible for maintaining the
            confidentiality of your password and for all activity under your
            account. Notify us immediately at hello@asavio.app if you suspect
            unauthorised access.
          </p>

          <h2>3. The Asavio Platform</h2>
          <p>
            Asavio is a marketplace that connects guests seeking short-term
            accommodation or vehicle rentals with hosts who provide such
            services. Asavio is not a party to the agreement between guests and
            hosts, and is not responsible for the conduct of either party,
            except as expressly stated in these Terms.
          </p>

          <h2>4. Bookings and Payments</h2>
          <ul>
            <li>
              All bookings are subject to host availability and acceptance.
            </li>
            <li>
              Prices are listed in the currency displayed on the platform and
              are inclusive of applicable service fees.
            </li>
            <li>
              Payment is collected in full at the time of booking. Asavio
              holds the payment and releases it to the host after guest check-in.
            </li>
            <li>
              Cancellation refunds are governed by the specific cancellation
              policy of each listing.
            </li>
          </ul>

          <h2>5. Host Obligations</h2>
          <p>By listing on Asavio, hosts agree to:</p>
          <ul>
            <li>
              Provide accurate descriptions, photos, and amenity information.
            </li>
            <li>
              Maintain the property or vehicle in the condition described.
            </li>
            <li>
              Honour confirmed bookings except in cases of genuine emergency.
            </li>
            <li>
              Comply with all applicable laws, including health and safety
              regulations.
            </li>
            <li>
              Not engage in any discriminatory practices.
            </li>
          </ul>

          <h2>6. Guest Obligations</h2>
          <p>Guests agree to:</p>
          <ul>
            <li>
              Treat all properties and vehicles with care and respect.
            </li>
            <li>
              Comply with the house rules of each listing.
            </li>
            <li>
              Not exceed the stated maximum number of guests.
            </li>
            <li>
              Report any damage promptly to Asavio and the host.
            </li>
            <li>
              Not use any property or vehicle for illegal purposes.
            </li>
          </ul>

          <h2>7. Prohibited Conduct</h2>
          <p>You may not:</p>
          <ul>
            <li>Create false or misleading listings.</li>
            <li>Circumvent the platform to book or pay outside of Asavio.</li>
            <li>
              Use the platform to harass, threaten, or harm other users.
            </li>
            <li>
              Reverse-engineer, scrape, or interfere with the platform.
            </li>
            <li>
              Violate any applicable law or regulation while using the platform.
            </li>
          </ul>

          <h2>8. Reviews</h2>
          <p>
            Reviews must be honest and based on actual experiences. We reserve
            the right to remove reviews that violate our content standards,
            including reviews that are defamatory, fraudulent, or irrelevant to
            the booking experience.
          </p>

          <h2>9. Intellectual Property</h2>
          <p>
            All content on the Asavio platform, including logos, text, and
            software, is the property of Asavio or its licensors and is
            protected by intellectual property laws. You may not use our
            branding or content without written permission.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Asavio shall not be liable
            for any indirect, incidental, special, or consequential damages
            arising out of or in connection with use of the platform, including
            loss of revenue, loss of data, or personal injury not caused by
            Asavio's direct negligence.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Asavio and its affiliates,
            officers, and employees from any claims, damages, or expenses
            arising from your use of the platform, your breach of these Terms,
            or your violation of any law or third-party right.
          </p>

          <h2>12. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any
            time for violation of these Terms or for any other reason at our
            discretion. You may close your account at any time by contacting us.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of
            Nigeria. Any disputes shall be subject to the exclusive jurisdiction
            of the courts of Lagos State, Nigeria.
          </p>

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will
            be communicated by email or prominent notice on the platform.
            Continued use of Asavio after changes constitutes acceptance.
          </p>

          <h2>15. Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:legal@asavio.app" className="text-black underline">
              legal@asavio.app
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
