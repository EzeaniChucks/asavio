"use client";

// app/hosts/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaStar,
  FaGlobe,
  FaBriefcase,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaHeart,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";

interface Host {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  languages?: string[];
  occupation?: string;
  city?: string;
  whyIHost?: string;
  school?: string;
  isVerified?: boolean;
  responseRate?: number;
  hostTier?: "new_host" | "trusted_host" | "top_host";
  createdAt: string;
}

interface Property {
  id: string;
  title: string;
  pricePerNight: number;
  currency?: string;
  averageRating?: number;
  reviewCount?: number;
  images: { url: string }[];
}

const tierConfig = {
  new_host: { label: "New host", className: "bg-gray-100 text-gray-600" },
  trusted_host: { label: "Trusted host", className: "bg-blue-100 text-blue-700" },
  top_host: { label: "Top host", className: "bg-amber-100 text-amber-700" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function PublicHostProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [host, setHost] = useState<Host | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .get(`/hosts/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setHost(data.host);
        setProperties(data.properties ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading host profile…</p>
        </div>
      </div>
    );
  }

  if (notFound || !host) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Host not found</h1>
          <p className="text-gray-500">
            This host profile doesn&apos;t exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    );
  }

  const initials = `${host.firstName?.[0] ?? ""}${host.lastName?.[0] ?? ""}`.toUpperCase();
  const memberYear = new Date(host.createdAt).getFullYear();
  const tier = host.hostTier ? tierConfig[host.hostTier] : null;
  const displayProperties = properties.slice(0, 6);

  const detailRows = [
    host.languages?.length
      ? { icon: <FaGlobe className="w-4 h-4 text-gray-400" />, label: "Speaks", value: host.languages.join(", ") }
      : null,
    host.occupation
      ? { icon: <FaBriefcase className="w-4 h-4 text-gray-400" />, label: "Works as", value: host.occupation }
      : null,
    host.city
      ? { icon: <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />, label: "Based in", value: host.city }
      : null,
    host.school
      ? { icon: <FaGraduationCap className="w-4 h-4 text-gray-400" />, label: "Went to", value: host.school }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Profile header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {host.profileImage ? (
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-rose-100">
                <Image
                  src={host.profileImage}
                  alt={`${host.firstName} ${host.lastName}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center ring-4 ring-rose-50">
                <span className="text-2xl font-bold text-rose-600">{initials}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {host.firstName} {host.lastName}
              </h1>
              {host.isVerified && (
                <FaCheckCircle className="w-5 h-5 text-blue-500" title="Verified host" />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              {tier && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tier.className}`}>
                  {tier.label}
                </span>
              )}
              <span className="text-sm text-gray-500">Member since {memberYear}</span>
            </div>

            {(host.responseRate ?? 0) > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-600">
                <FaHeart className="w-3.5 h-3.5 text-rose-400" />
                <span>{host.responseRate}% response rate</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* About section */}
        {(host.bio || detailRows.length > 0) && (
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl p-8 shadow-sm space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900">About {host.firstName}</h2>

            {host.bio && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{host.bio}</p>
            )}

            {detailRows.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {detailRows.map((row, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5">{row.icon}</div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                        {row.label}
                      </p>
                      <p className="text-gray-700 text-sm font-medium">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Why I host */}
        {host.whyIHost && (
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl p-8 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Why {host.firstName} hosts
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line italic">
              &ldquo;{host.whyIHost}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Listings */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {host.firstName}&apos;s listings
          </h2>

          {displayProperties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No active listings at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProperties.map((property, i) => {
                const coverImage = property.images?.[0]?.url;
                const rating = property.averageRating ?? 0;

                return (
                  <motion.div
                    key={property.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={`/properties/${property.id}`}
                      className="group block rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="relative h-44 bg-gray-100">
                        {coverImage ? (
                          <Image
                            src={coverImage}
                            alt={property.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-300 text-4xl">🏠</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-800 truncate mb-1">
                          {property.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-rose-600 font-bold text-sm">
                            {formatPrice(property.pricePerNight, property.currency)}{" "}
                            <span className="text-gray-400 font-normal text-xs">/ night</span>
                          </span>
                          {rating > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <FaStar className="w-3 h-3 text-amber-400" />
                              <span>{rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
