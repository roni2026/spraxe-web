import Link from 'next/link';
import { Package, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/spraxe.png" alt="Spraxe" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-white">Spraxe</span>
            </div>
            <p className="text-sm">
              Bangladesh's modern e-commerce platform. Quality products at great prices.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition">Home</Link></li>
              <li><Link href="/products" className="hover:text-blue-400 transition">Products</Link></li>
              <li><Link href="/categories" className="hover:text-blue-400 transition">Categories</Link></li>
              <li><Link href="/about" className="hover:text-blue-400 transition">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/support" className="hover:text-blue-400 transition">Support Desk</Link></li>
              <li><Link href="/faq" className="hover:text-blue-400 transition">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-blue-400 transition">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:support.spraxe@gmail.com" className="hover:text-blue-400 transition">
                  spraxecare@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+8809638371951" className="hover:text-blue-400 transition">
                  09638371951
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Vatara, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 Spraxe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
