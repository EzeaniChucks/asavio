"use client";

// components/forms/ImageUpload.tsx
import { useRef, useState } from "react";
import Image from "next/image";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";

interface PreviewFile {
  file: File;
  url: string;
}

interface ImageUploadProps {
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
}

export default function ImageUpload({
  maxFiles = 10,
  onFilesChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const remaining = maxFiles - previews.length;
    const accepted = Array.from(incoming)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    const newPreviews = accepted.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          dragging
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <FaCloudUploadAlt className="text-4xl text-gray-400" />
        <div className="text-center">
          <p className="font-medium text-gray-700">
            Drag & drop images here, or{" "}
            <span className="text-black underline">browse</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            JPEG, PNG, WebP — up to 5 MB each · max {maxFiles} images
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {previews.map((p, i) => (
            <div key={p.url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image src={p.url} alt={`Upload ${i + 1}`} fill className="object-cover" />
              {i === 0 && (
                <div className="absolute bottom-1 left-1 bg-secondary text-black text-xs font-semibold px-1.5 py-0.5 rounded">
                  Cover
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
