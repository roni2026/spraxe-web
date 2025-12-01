"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Category {
  name: string;
  icon?: string;
  items: string[];
}

const categoryData: Category[] = [
  {
    name: "Watches",
    icon: "/images/categories/watch.png",
    items: ["Smartwatches", "Watch Strap", "Analog Watch", "Digital Watch"],
  },
  {
    name: "Gadget Item",
    icon: "/images/categories/gadget.png",
    items: [
      "Power Bank",
      "RGB Light",
      "Cable",
      "Wireless Charger",
      "Air Humidifier",
      "Attendance Machine",
      "Torch Light",
      "Mobile Holder",
      "Desk Lamp",
      "Power Charger",
      "Smart Ring",
      "Selfie Stick",
      "Gimbal",
      "Mobile Charger",
      "Toys",
      "Rechargeable Fan",
      "Tripod",
      "Electric Trimmer",
    ],
  },
  {
    name: "Kitchen Accessories",
    icon: "/images/categories/kitchen.png",
    items: ["Blender", "Electric Kettle"],
  },
  {
    name: "CCTV Camera",
    icon: "/images/categories/cctv.png",
    items: ["Security Camera", "IP Camera"],
  },
  {
    name: "Headphone",
    icon: "/images/categories/headphone.png",
    items: [
      "TWS",
      "Bluetooth Headphone",
      "Neckband Earbuds",
      "Wired Headphone",
      "Gaming Headphone",
    ],
  },
  {
    name: "Laptop & Desktop Accessories",
    icon: "/images/categories/computer.png",
    items: [
      "Web Camera",
      "Pen Drive",
      "Keyboard",
      "Speaker",
      "Wireless Mouse",
      "Power Strip",
      "USB HUB",
      "Mouse Pad",
      "Converters",
      "Bluetooth Speaker",
      "WiFi Router",
      "Microphone",
      "Mouse",
    ],
  },
  {
    name: "Man’s Fashion",
    icon: "/images/categories/mens.png",
    items: ["Shirt", "Pant", "T-shirt", "Panjabi"],
  },
  {
    name: "Women’s Fashion",
    icon: "/images/categories/womens.png",
    items: ["Shirt", "Pant", "T-shirt", "Saree"],
  },
];

// Helper to create URL-friendly slugs
const slugify = (text: string) =>
  text.toLowerCase().replace(/[^\w]+/g, "-");

export default function CategoriesPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return categoryData;
    return categoryData
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          cat.items.length > 0
      );
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-8 text-center">
        Browse Categories
      </h1>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search categories or items..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {filtered.map((cat, index) => {
          const open = openIndex === index;

          return (
            <div
              key={index}
              className="border border-gray-300 bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setOpenIndex(open ? null : index)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 transition"
              >
                {cat.icon && (
                  <img
                    src={cat.icon}
                    className="w-12 h-12 object-contain"
                    alt={cat.name}
                  />
                )}
                <h2 className="text-xl font-semibold flex-1">{cat.name}</h2>

                {open ? (
                  <ChevronDown className="w-6 h-6" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </button>

              {/* Content */}
              {open && (
                <div className="px-6 pb-4 pt-2 animate-fadeIn space-y-2">
                  {cat.items.map((sub, i) => (
                    <Link
                      key={i}
                      href={`/category/${slugify(cat.name)}/${slugify(sub)}`}
                      className="block text-gray-700 hover:text-black hover:pl-2 transition"
                    >
                      • {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-6 text-lg">
            No matching categories or items found.
          </p>
        )}
      </div>
    </div>
  );
}
