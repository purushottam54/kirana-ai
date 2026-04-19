"use client";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Camera, X, AlertCircle, CheckCircle } from "lucide-react";
import clsx from "clsx";

export interface UploadedImage {
  file: File;
  preview: string;
  label: string;
}

const LABELS = [
  "Interior Shelves",
  "Counter Area",
  "Exterior Storefront",
  "Street View",
  "Other",
];

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ images, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const valid = arr.filter((f) => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > 10 * 1024 * 1024) return false;
        return true;
      });

      const next: UploadedImage[] = [
        ...images,
        ...valid.map((file, i) => ({
          file,
          preview: URL.createObjectURL(file),
          label: LABELS[Math.min(images.length + i, LABELS.length - 1)],
        })),
      ].slice(0, 10); // max 10

      onChange(next);
    },
    [images, onChange]
  );

  const remove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  };

  const updateLabel = (idx: number, label: string) => {
    const next = images.map((img, i) => (i === idx ? { ...img, label } : img));
    onChange(next);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const isReady = images.length >= 3;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div
        className={clsx(
          "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg w-fit",
          isReady
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        )}
      >
        {isReady ? (
          <CheckCircle size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        {images.length} / 3 min images {isReady ? "— ready!" : "— need more"}
      </div>

      {/* Dropzone */}
      <div
        className={clsx(
          "dropzone",
          dragging && "dropzone-active"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-saffron-500/10 border border-saffron-500/30 flex items-center justify-center">
            <Upload className="text-saffron-400" size={28} />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              Drag & drop shop photos here
            </p>
            <p className="text-white/40 text-sm mt-1">
              Interior • Counter • Exterior • Street view (max 10MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          className="btn-secondary flex items-center gap-2 flex-1 justify-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} /> Browse Files
        </button>
        <button
          type="button"
          className="btn-secondary flex items-center gap-2 flex-1 justify-center"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={16} /> Take Photo
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative glass-card overflow-hidden group">
              <div className="aspect-square relative">
                <img
                  src={img.preview}
                  alt={img.label}
                  className="w-full h-full object-cover"
                />
                {/* Label overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6">
                  <select
                    className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                    value={img.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {LABELS.map((l) => (
                      <option key={l} value={l} className="bg-dark-800 text-white">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tip about image quality */}
      <div className="text-xs text-white/30 flex gap-2 items-start">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>
          Images need to be well-lit and in focus. Blurry or dark images lower
          the confidence score. Tip: turn on shop lights before capturing.
        </span>
      </div>
    </div>
  );
}
