import React from "react";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-10">
          Privacy Policy – Spraxe
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Effective Date: 01 January 2026
        </p>

        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-8">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>
              At Spraxe, we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, protect, and store
              your personal information when you use our website or purchase
              from us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold mt-2">a. Personal Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">b. Payment Information</h3>
            <p>
              Includes mobile banking details (such as Bkash, Nagad) used for
              order payments. We do <strong>not</strong> store full payment
              details. Payments are processed securely through trusted partners.
            </p>

            <h3 className="text-lg font-semibold mt-4">c. Technical & Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address</li>
              <li>Device and browser information</li>
              <li>Cookies and browsing behavior</li>
              <li>Pages visited, actions taken, and time spent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and deliver your orders</li>
              <li>To provide customer service and support</li>
              <li>To send order updates, promotions, and offers (if subscribed)</li>
              <li>To improve website performance and user experience</li>
              <li>To prevent fraudulent activities or misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Sharing Your Information</h2>
            <p>We do <strong>not</strong> sell or rent your personal information.</p>
            <p className="mt-3">However, we may share it with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Courier and delivery partners</li>
              <li>Payment service providers</li>
              <li>Government authorities, if required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Cookies & Tracking</h2>
            <p>
              We use cookies to improve your shopping experience, remember your
              preferences, and analyze website performance. Cookies can be
              disabled from your browser settings, but some features may not
              work properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
            <p>
              We use advanced security measures to protect your information,
              including encryption, secure servers, and restricted access.
              Despite this, no online platform is 100% risk-free, but we take
              all reasonable steps to safeguard your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Request access to your data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your personal data</li>
              <li>Unsubscribe from promotional messages</li>
            </ul>
            <p className="mt-3">
              To request any of the above, contact us at:{" "}
              <strong>spraxecare@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Children’s Privacy</h2>
            <p>
              We do not knowingly collect information from children under 13.
              If you believe a child has provided data, contact us so we can
              remove it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted here with a revised effective date. Continued use
              of Spraxe means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
            <p>Email: <strong>spraxecare@gmail.com</strong></p>
            <p>Phone: <strong>+8809638371951</strong></p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
