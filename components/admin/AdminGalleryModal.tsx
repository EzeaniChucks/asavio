"use client";

// components/admin/AdminGalleryModal.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

interface AdminGalleryModalProps {
  images: { url: string; publicId?: string }[];
  title: string;
  onClose: () => void;
}

export default function AdminGalleryModal({ images, title, onClose }: AdminGalleryModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(images.length - 1, i + 1));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white font-medium text-sm truncate max-w-xs">{title}</p>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{index + 1} / {images.length}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div
        className="flex-1 relative flex items-center justify-center px-12 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <FaChevronLeft />
          </button>
        )}

        <div className="relative w-full h-full max-w-4xl">
          <Image
            src={images[index].url}
            alt={`${title} — photo ${index + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 80vw"
          />
        </div>

        {index < images.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div
        className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
              i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={img.url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="56px" />
          </button>
        ))}
      </div>
    </div>
  );
}
