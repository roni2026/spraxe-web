import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-4xl font-bold text-center mb-8 text-black">
          About Spraxe
        </h1>

        <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto">
          Spraxe is a modern Bangladeshi e-commerce platform designed to make
          online shopping simpler, faster, and more reliable. We connect
          customers with trusted sellers and quality products — with a smooth,
          secure, and user-friendly buying experience.
        </p>

        <div className="mt-16 grid md:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To build a convenient and trustworthy online marketplace where
              customers can shop confidently and sellers can grow their
              businesses. We focus on seamless experience, transparency, and
              fast delivery.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become one of Bangladesh’s most reliable shopping platforms by
              empowering entrepreneurs, ensuring quality, and providing excellent
              customer support.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Why Shop With Spraxe?</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Fast and reliable delivery across Bangladesh</li>
            <li>Quality-checked products from trusted sellers</li>
            <li>Secure ordering and smooth checkout experience</li>
            <li>Modern and responsive shopping interface</li>
          </ul>
        </div>

        <div className="text-center mt-20">
          <h2 className="text-3xl font-semibold mb-4">We’re Just Getting Started</h2>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
            Thank you for choosing Spraxe. We’re continuously improving and
            growing to become your favorite online shopping destination in
            Bangladesh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
