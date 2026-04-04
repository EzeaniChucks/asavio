"use client";

// components/home/Categories.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface TypeRepresentative {
  type: string;
  propertyId: string;
  image: string;
}

function toLabel(type: string) {
  return type
    .split(/[_\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState<TypeRepresentative[]>([]);

  useEffect(() => {
    api
      .get("/properties/type-representatives")
      .then((res) => setCategories(res.data.data.representatives ?? []))
      .catch(() => {});
  }, []);

  if (!categories.length) return null;

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
              onClick={() =>
                router.push(
                  `/properties?propertyType=${encodeURIComponent(cat.type)}`
                )
              }
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Photo */}
              <Image
                src={cat.image}
                alt={toLabel(cat.type)}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Label */}
              <span className="absolute bottom-0 left-0 right-0 px-3 py-3 text-white text-xs font-semibold text-center leading-tight">
                {toLabel(cat.type)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
