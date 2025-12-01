import React from "react";

const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-12 text-black">
          Frequently Asked Questions (FAQ)
        </h1>

        <div className="space-y-8">
          {/* 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              1. Is an advance payment required to place an order?
            </h2>
            <p className="text-gray-700">
              Yes. For all electronics products ordered from Spraxe, a partial
              advance payment is required.
            </p>
          </div>

          {/* 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              2. How can I contact customer support?
            </h2>
            <p className="text-gray-700">
              You can reach us through our support email, WhatsApp, or hotline
              number.
            </p>
          </div>

          {/* 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              3. Is my personal information safe?
            </h2>
            <p className="text-gray-700">
              Yes. We follow strict privacy and security measures to protect
              your data.
            </p>
          </div>

          {/* 4 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              4. What payment methods are accepted?
            </h2>
            <p className="text-gray-700">
              We accept secure online payment methods (Bkash, Nagad) and cash on
              delivery (if applicable).
            </p>
          </div>

          {/* 5 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              5. How much is the delivery charge?
            </h2>
            <p className="text-gray-700 mb-1">Inside Dhaka City Corporation: 60 BDT</p>
            <p className="text-gray-700 mb-1">Savar, Gazipur, Keraniganj: 100 BDT</p>
            <p className="text-gray-700 mb-1">All over Bangladesh: 120 BDT</p>
            <p className="text-gray-700 mt-2">
              <strong>Note:</strong> Delivery usually takes 2–5 business days
              depending on your location.
            </p>
          </div>

          {/* 6 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              6. Can I return or replace a product?
            </h2>
            <p className="text-gray-700">
              Yes, returns and replacements are available according to our
              Return Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
