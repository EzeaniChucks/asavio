// app/privacy/page.tsx
export default function PrivacyPage() {
  const updated = "15 March 2026";

  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 px-4 text-center">
        <h1 className="font-playfair text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: {updated}</p>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray prose-headings:font-playfair prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
          <p>
            Asavio ("we", "us", or "our") is committed to protecting your
            personal information. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your data when you use our platform at
            asavio.app and our mobile applications.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address, phone
              number, and password when you register.
            </li>
            <li>
              <strong>Identity verification:</strong> government-issued ID
              documents required for hosts and, in some cases, guests.
            </li>
            <li>
              <strong>Booking information:</strong> check-in/check-out dates,
              number of guests, and payment details.
            </li>
            <li>
              <strong>Communications:</strong> messages sent via our platform
              between guests and hosts.
            </li>
            <li>
              <strong>Reviews and ratings</strong> you submit for properties,
              vehicles, or hosts.
            </li>
          </ul>
          <p>
            We also collect certain information automatically when you use our
            platform, including device information, IP address, browser type,
            and usage data through cookies and similar technologies.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Process bookings and payments.</li>
            <li>Facilitate communication between guests and hosts.</li>
            <li>Verify identities and prevent fraud.</li>
            <li>Send booking confirmations, updates, and support messages.</li>
            <li>Improve our platform, features, and user experience.</li>
            <li>
              Send promotional communications (you may opt out at any time).
            </li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2>3. Sharing of Information</h2>
          <p>
            We do not sell your personal data. We may share your information
            with:
          </p>
          <ul>
            <li>
              <strong>Hosts:</strong> when you make a booking, we share your
              name, contact details, and booking information with the relevant
              host.
            </li>
            <li>
              <strong>Guests:</strong> hosts can see guest names and profile
              information for bookings they receive.
            </li>
            <li>
              <strong>Service providers:</strong> payment processors, email
              delivery services, and cloud infrastructure providers who process
              data on our behalf.
            </li>
            <li>
              <strong>Legal authorities:</strong> where required by law or to
              protect the safety of our users.
            </li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active
            or as needed to provide services. You may request deletion of your
            account and associated data at any time by contacting us at
            privacy@asavio.app. Note that we may retain certain data to comply
            with legal obligations or resolve disputes.
          </p>

          <h2>5. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict processing of your data.</li>
            <li>Data portability.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at privacy@asavio.app.
          </p>

          <h2>6. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your
            experience. See our{" "}
            <a href="/cookies" className="text-black underline">
              Cookie Policy
            </a>{" "}
            for details.
          </p>

          <h2>7. Security</h2>
          <p>
            We implement industry-standard technical and organisational measures
            to protect your data, including encryption in transit (TLS) and at
            rest, access controls, and regular security audits. However, no
            method of transmission over the internet is 100% secure.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Asavio is not intended for users under the age of 18. We do not
            knowingly collect personal data from minors. If you believe a minor
            has provided us with personal data, contact us immediately.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by email or by prominent notice on our
            platform. Continued use of Asavio after changes constitutes
            acceptance of the updated policy.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights,
            contact us at:
            <br />
            <a href="mailto:privacy@asavio.app" className="text-black underline">
              privacy@asavio.app
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
