"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

interface ScrollToServicesButtonProps {
  /** id of the element that starts the services section. */
  targetId: string;
}

/**
 * Floating hint in the bottom-right corner: the hero and info cards can fill
 * the whole mobile viewport, so without it the services list looks absent.
 * It hides once the section is on screen or already scrolled past.
 */
export function ScrollToServicesButton({
  targetId,
}: ScrollToServicesButtonProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const reachedOrPassed =
          entry.isIntersecting || entry.boundingClientRect.top < 0;
        setIsVisible(!reachedOrPassed);
      },
      // Shrink the viewport's bottom edge: a heading peeking at the very
      // bottom still leaves every service card off screen.
      { rootMargin: "0px 0px -30% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Ir a los servicios"
      onClick={() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-safe:animate-bounce"
    >
      <ArrowDown aria-hidden="true" className="size-5" />
    </button>
  );
}
