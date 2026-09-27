"use client";

import { useEffect, useState } from "react";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";

const AUTO_ADVANCE_MS = 4000;

interface LocalHeroCarouselProps {
  /** Ordered GALLERY_IMAGE urls only. */
  galleryImages: string[];
  coverImageUrl: string | null;
  logoUrl: string | null;
  localName: string;
  city: string;
  province: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hero for the local profile: a crossfading gallery carousel (falling back
 * to the cover image, then to a neutral pattern) with the logo/name/location
 * overlaid at the bottom.
 */
export function LocalHeroCarousel({
  galleryImages,
  coverImageUrl,
  logoUrl,
  localName,
  city,
  province,
}: LocalHeroCarouselProps) {
  const images =
    galleryImages.length > 0
      ? galleryImages
      : coverImageUrl
        ? [coverImageUrl]
        : [];
  // Dots/counter only make sense for a real multi-photo gallery; a single
  // gallery photo (or the cover-image fallback) renders static.
  const hasGallery = galleryImages.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Depend on a stable string, not the array reference: the parent may pass
  // a freshly-filtered array on every render (React Query loop-of-identity
  // trap documented in AGENTS.md), which would otherwise reset the index on
  // every unrelated re-render instead of only when the photos truly change.
  const galleryKey = galleryImages.join("|");
  useEffect(() => {
    setActiveIndex(0);
    setIsPaused(false);
  }, [galleryKey, coverImageUrl]);

  useEffect(() => {
    if (!hasGallery || isPaused || prefersReducedMotion()) return;
    const galleryLength = galleryImages.length;
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % galleryLength);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGallery, isPaused, galleryImages.length]);

  function handlePause() {
    setIsPaused(true);
  }

  function handleSelect(index: number) {
    setActiveIndex(index);
    setIsPaused(true);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: localName,
          url,
        });
        return;
      } catch {
        // User cancelled, or Web Share failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No pudimos copiar el enlace");
    }
  }

  const initials = getInitials(localName);

  return (
    <div className="relative -mx-4 h-[420px] overflow-hidden sm:mx-0 sm:rounded-xl">
      {images.length > 0 ? (
        images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`Foto ${index + 1} de ${localName}`}
            onClick={handlePause}
            className="absolute inset-0 h-full w-full cursor-pointer object-cover transition-opacity duration-700"
            style={{ opacity: index === activeIndex ? 1 : 0 }}
          />
        ))
      ) : (
        <div
          data-testid="hero-empty-pattern"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full bg-card [background-image:repeating-linear-gradient(135deg,hsl(var(--border))_0,hsl(var(--border))_2px,transparent_2px,transparent_14px)]"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {hasGallery && (
        <span className="absolute left-3 top-3 rounded-full border border-white/12 bg-black/75 px-2.5 py-1 text-xs font-medium text-white">
          {activeIndex + 1} / {images.length}
        </span>
      )}

      <button
        type="button"
        aria-label="Compartir local"
        onClick={handleShare}
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-white/12 bg-black/75 text-white outline-none transition-colors hover:bg-black/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Share2 className="size-5" />
      </button>

      {hasGallery && (
        <div className="absolute bottom-24 right-3 flex gap-1 sm:bottom-28">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              onClick={() => handleSelect(index)}
              className="grid size-6 place-items-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`Logo de ${localName}`}
            className="size-16 rounded-2xl border-[3px] border-background object-cover"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-2xl border-[3px] border-primary/35 bg-card text-primary">
            <span className="text-lg font-semibold">{initials}</span>
          </div>
        )}
        <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.02em] text-foreground">
          {localName}
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span>{[city, province].filter(Boolean).join(", ")}</span>
        </p>
      </div>
    </div>
  );
}
