import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-10">Privacy Policy – Spraxe</h1>
        <p className="text-center text-gray-600 mb-12">Effective Date: 01-01-2026</p>

        <section className="space-y-6 bg-white p-8 rounded-2xl shadow-sm">
          <p>
            At Spraxe, your privacy is important to us. We keep your personal
            information safe and use it only to provide you with a better
            shopping experience.
          </p>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email, phone number, and address</li>
              <li>Payment information</li>
              <li>Website usage data (cookies, browsing information)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and deliver your orders</li>
              <li>To provide customer support</li>
              <li>To send updates, promotions, and offers (if you opted in)</li>
              <li>To improve our website and services</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Sharing Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not sell your personal information.</li>
              <li>Information may be shared with shipping and payment service providers.</li>
              <li>We may share information with legal authorities if required by law.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Cookies & Tracking</h2>
            <p>
              We use cookies to improve your experience. You can manage or disable
              cookies in your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p>
              We use advanced security measures to protect your information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
            <p>
              You can access, update, or request deletion of your personal
              information by contacting us at:{" "}
              <strong>spraxecare@gmail.com</strong>
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p>Email: <strong>spraxecare@gmail.com</strong></p>
            <p>Phone: <strong>+8809638371951</strong></p>
          </div>
        </section>

        {/* TERMS & CONDITIONS */}
        <h1 className="text-4xl font-bold text-center mt-20 mb-10">
          Terms & Conditions – Spraxe
        </h1>

        <section className="space-y-6 bg-white p-8 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By using Spraxe, you agree to follow our terms, policies, and
              guidelines. If you do not agree, please stop using the website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">2. Ordering & Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some products require advance or partial payment.</li>
              <li>You agree to provide accurate order information.</li>
              <li>Orders may be cancelled for invalid details or suspected fraud.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">3. Delivery</h2>
            <p>
              Delivery times depend on location (usually 2–5 business days). Delays may
              occur due to external factors such as courier workload or weather
              conditions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">4. Returns & Replacements</h2>
            <p>
              Returns and replacements are available according to our Return Policy.
              Products damaged by misuse or customer negligence are not covered.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">5. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide correct information.</li>
              <li>You must not misuse the website, engage in fraud, or violate laws.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p>
              Spraxe is not responsible for indirect losses, courier delays, or
              third-party service failures.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">7. Updates to This Policy</h2>
            <p>
              Spraxe may update the Privacy Policy and Terms at any time. Continued
              use of the website means you accept the updated terms.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
