"use client";

// components/home/Categories.tsx
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const categories = [
  {
    label: "Apartments",
    type: "apartment",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
  },
  {
    label: "Villas",
    type: "villa",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
  },
  {
    label: "Beach Houses",
    type: "beach house",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80",
  },
  {
    label: "Penthouses",
    type: "penthouse",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
  },
  {
    label: "Studios",
    type: "studio",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
  },
  {
    label: "Cabins",
    type: "cabin",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&q=80",
  },
  {
    label: "Entire Homes",
    type: "entire home",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80",
  },
  {
    label: "Townhouses",
    type: "townhouse",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80",
  },
];

export default function Categories() {
  const router = useRouter();

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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => router.push(`/properties?propertyType=${encodeURIComponent(cat.type)}`)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Photo */}
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Label */}
              <span className="absolute bottom-0 left-0 right-0 px-3 py-3 text-white text-xs font-semibold text-center leading-tight">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
