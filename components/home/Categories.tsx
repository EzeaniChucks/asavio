"use client";

// components/home/Categories.tsx
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const categories = [
  { label: "Apartments", icon: "🏢", type: "apartment" },
  { label: "Villas", icon: "🏡", type: "villa" },
  { label: "Beach Houses", icon: "🏖️", type: "beach house" },
  { label: "Penthouses", icon: "🌆", type: "penthouse" },
  { label: "Studios", icon: "🛋️", type: "studio" },
  { label: "Cabins", icon: "🪵", type: "cabin" },
  { label: "Entire Homes", icon: "🏠", type: "entire home" },
  { label: "Townhouses", icon: "🏘️", type: "townhouse" },
];

export default function Categories() {
  const router = useRouter();

  const handleCategory = (type: string) => {
    router.push(`/properties?propertyType=${encodeURIComponent(type)}`);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="heading-2 mb-3">Browse by Type</h2>
          <p className="text-gray-500 text-lg">
            Find the perfect space for every occasion
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => handleCategory(cat.type)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-black hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {cat.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-black">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
