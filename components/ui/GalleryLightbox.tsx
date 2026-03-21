"use client";

// components/ui/GalleryLightbox.tsx
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface GalleryLightboxProps {
  images: { url: string }[];
  startIndex?: number;
  onClose: () => void;
}

export default function GalleryLightbox({ images, startIndex = 0, onClose }: GalleryLightboxProps) {
  // Clamp to valid range — guard against clicking an empty tile
  const safeStart = Math.min(Math.max(startIndex, 0), images.length - 1);
  const [idx, setIdx] = useState(safeStart);

  if (!images.length) return null;

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
        aria-label="Close gallery"
      >
        <FaTimes size={18} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium pointer-events-none">
        {idx + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          aria-label="Previous photo"
        >
          <FaChevronLeft size={18} />
        </button>
      )}

      {/* Main image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="relative z-10 w-full h-[80vh] max-w-5xl mx-auto px-14 sm:px-20"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[idx]?.url ?? ""}
            alt={`Photo ${idx + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          aria-label="Next photo"
        >
          <FaChevronRight size={18} />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 overflow-x-auto max-w-[90vw] px-2 pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-white scale-105" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img.url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
