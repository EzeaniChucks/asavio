"use client"
// components/home/ExperienceSection.tsx
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaMedal,
  FaHeadset,
  FaCalendarCheck,
} from "react-icons/fa";

const features = [
  {
    icon: <FaShieldAlt className="text-secondary text-2xl" />,
    title: "Verified Hosts",
    description:
      "Every host on Asavio is personally vetted. Your safety and comfort are our top priority.",
  },
  {
    icon: <FaMedal className="text-secondary text-2xl" />,
    title: "Luxury Standard",
    description:
      "Only premium, professionally maintained properties and vehicles make it onto our platform.",
  },
  {
    icon: <FaHeadset className="text-secondary text-2xl" />,
    title: "24/7 Support",
    description:
      "Our concierge team is available around the clock to handle any request or issue.",
  },
  {
    icon: <FaCalendarCheck className="text-secondary text-2xl" />,
    title: "Flexible Booking",
    description:
      "Plans change. Our straightforward cancellation policy gives you peace of mind.",
  },
];

export default function ExperienceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                alt="Luxury interior"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute -bottom-6 -right-6 bg-black text-white rounded-2xl p-6 shadow-2xl"
            >
              <p className="text-4xl font-bold text-secondary mb-1">4.9★</p>
              <p className="text-sm text-gray-400">Average guest rating</p>
            </motion.div>
          </motion.div>

          {/* Right — features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-accent font-medium uppercase tracking-widest text-sm mb-3">
              Why Asavio
            </p>
            <h2 className="heading-2 mb-4">
              The Asavio Experience
            </h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              We curate only the finest shortlet properties and luxury vehicles,
              so every stay and every journey exceeds your expectations.
            </p>

            <div className="space-y-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-5"
                >
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
