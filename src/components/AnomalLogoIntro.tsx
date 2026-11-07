"use client";

import { useId, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import {
  ANOMAL_LEAF_LEFT_D,
  ANOMAL_LEAF_RIGHT_D,
  ANOMAL_WORDMARK_D,
} from "@/components/anomal-logo-paths";

gsap.registerPlugin(useGSAP);

/**
 * Animated ANØMAL wordmark for the brand splash.
 *
 * ## Why the SVG is inline
 *
 * `public/anomal-logo-white.svg` holds three paths: two sage-green leaves and
 * one white compound path carrying BOTH the central emblem and the lettering.
 * An `<img>` or a CSS background renders that file as an opaque image — its
 * inner nodes never reach the DOM, so GSAP cannot touch them. Animating the
 * logo therefore requires the SVG inline. The path data is imported verbatim
 * from `anomal-logo-paths.ts`; the vector is never redrawn.
 *
 * ## How the two phases work without editing the vector
 *
 * The emblem and the letters are the same path, so they cannot be targeted
 * separately. Instead that one path is rendered twice and each copy is clipped
 * to a different region of the artwork — regions that partition the viewBox
 * exactly, with no gap and no overlap (see the geometry constants below). Each
 * copy then gets its own animated mask: a disc that grows over the emblem, and
 * a left-to-right wipe over the lettering.
 *
 * ## Degradation, and why the markup ships REVEALED
 *
 * This component lives inside `SplashScreen`, a server-rendered overlay whose
 * exit is a CSS animation specifically so that slow or failed hydration cannot
 * leave the app covered. The logo honours the same contract:
 *
 * - The markup carries the finished geometry (`r={EMBLEM_RADIUS}`,
 *   `width={VIEW_BOX_WIDTH}`). Without JS the logo is complete, not blank.
 * - `FALLBACK_CLASS` holds it at `opacity: 0` and a CSS keyframe fades the
 *   complete logo in at {@link REVEAL_FALLBACK_DELAY_MS}. That is the no-JS
 *   path, and it is also what covers the gap before hydration lands.
 * - When GSAP runs it removes that class and plays the real timeline.
 * - If GSAP runs *after* the fallback already revealed the logo — slow device,
 *   late hydration — it stands down. Starting the timeline then would blank an
 *   on-screen logo and replay it, which reads as a glitch.
 *
 * ## Why the timeline can be compressed
 *
 * GSAP only runs once React hydrates, which on a cold load is hundreds of ms
 * after first paint — while the host overlay is already counting down to its
 * own exit. A timeline that always ran at its designed length would therefore
 * overrun the fade and animate the logo while it disappears. So the caller
 * passes a `deadlineMs` and a late start plays the same choreography faster
 * (see {@link introTimeScale}) rather than being truncated.
 *
 * Note the deliberate departure from the starter pack under
 * `~/Downloads/anomal-gsap-starter`: it hardcodes `r="0"` / `width="0"` and
 * only reveals from inside `useGSAP`, which would leave this splash showing an
 * invisible logo whenever hydration fails.
 */

/** `viewBox` of the source asset. Do not change without replacing the SVG. */
const VIEW_BOX_WIDTH = 1440;
const VIEW_BOX_HEIGHT = 483.08;

/*
 * Clip geometry. Measured against the real path data, not guessed.
 *
 * The emblem and the lettering interleave on the x axis, so a single vertical
 * cut cannot separate them:
 *
 *   letter N   x  305.71 ..  496.47
 *   emblem     x  514.85 ..  780.41
 *   letter M   x  754.76 ..  956.97
 *
 * They do separate in the overlap band x ∈ [745, 800]: there the emblem's right
 * flourish sits at y ∈ [169.3, 208.0] and the M at y ∈ [232.3, 417.1], a clear
 * 24px gap. So the emblem region is the band between the N and the M plus a
 * notch above the M, and the lettering region is its exact complement.
 */

/** Vertical cut between the N (ends at 496.47) and the emblem (starts at 514.85). */
const SPLIT_X = 505;
/** Start of the band where the emblem and the M overlap horizontally. */
const BAND_X = 745;
/** End of that band; past it the artwork is lettering only. */
const BAND_END_X = 800;
/** Horizontal cut inside the band: emblem above, the M below. */
const BAND_SPLIT_Y = 220;

/*
 * Emblem reveal disc. The emblem spans x ∈ [514.85, 780.41], y ∈ [63.02,
 * 439.12]; its centre is ~(648, 251) and its furthest point sits ~221 away, so
 * 235 covers it with margin. The disc is wider than the emblem band, which is
 * harmless: the clip region stops it from reaching the lettering.
 */
const EMBLEM_CENTER_X = 648;
const EMBLEM_CENTER_Y = 251;
const EMBLEM_RADIUS = 235;

/**
 * When the CSS fallback starts revealing the logo on its own, in ms from first
 * paint. Must match the `animation-delay` of `.anomal-intro` in
 * `src/styles.css`. Past this point GSAP stands down.
 */
const REVEAL_FALLBACK_DELAY_MS = 1100;

/**
 * Below this much remaining time the intro is not worth playing: it would read
 * as a flicker rather than as an animation.
 */
const MIN_PLAYABLE_MS = 900;

/** Holds the logo hidden and fades it in on its own. See `src/styles.css`. */
const FALLBACK_CLASS = "anomal-intro";

/** Total length of the GSAP timeline, in ms. Keep in sync with the tweens. */
export const ANOMAL_INTRO_DURATION_MS = 2000;

/**
 * Earliest `deadlineMs` a host can set while still guaranteeing that everyone
 * who hydrates before the CSS fallback gets a playable intro. Below it there
 * is a band of hydration times that arrive in time to animate but are refused
 * for want of room, so the intro silently never runs for them.
 */
export const ANOMAL_INTRO_MIN_DEADLINE_MS =
  REVEAL_FALLBACK_DELAY_MS + MIN_PLAYABLE_MS;

/**
 * How long the logo has been mounted, in ms from first paint.
 *
 * Read from the CSS fallback animation's own progress rather than from
 * `performance.now()`: the latter counts from navigation start, while the CSS
 * animation starts at first paint, so only the animation knows how long the
 * logo has actually been on screen. Absent Web Animations support the answer
 * is 0, which keeps the full-speed animated path as the default.
 */
function elapsedSincePaint(svg: SVGSVGElement): number {
  if (typeof svg.getAnimations !== "function") return 0;

  const [fallback] = svg.getAnimations();
  const elapsed = fallback?.currentTime;

  return typeof elapsed === "number" ? elapsed : 0;
}

/**
 * Playback rate that still lands the intro on `deadlineMs`.
 *
 * Returns 1 — the designed speed — when there is no deadline or enough room
 * left; otherwise the factor that squeezes {@link ANOMAL_INTRO_DURATION_MS}
 * into what remains. Never slower than designed: a deadline is a ceiling, not
 * a target to stretch into.
 */
export function introTimeScale(elapsedMs: number, deadlineMs?: number): number {
  if (deadlineMs === undefined) return 1;

  const available = deadlineMs - elapsedMs;

  return available >= ANOMAL_INTRO_DURATION_MS
    ? 1
    : ANOMAL_INTRO_DURATION_MS / available;
}

type AnomalLogoIntroProps = {
  /** Applied to the wrapper, not to the `<svg>`. */
  className?: string;
  /** Runs once the logo is fully on screen, however it got there. */
  onComplete?: () => void;
  /**
   * Moment, in ms from first paint, by which the intro must be over — normally
   * when the host starts hiding it. A late start is compressed to fit instead
   * of overrunning it. Omitted, the intro always runs at its designed length.
   */
  deadlineMs?: number;
};

export function AnomalLogoIntro({
  className,
  onComplete,
  deadlineMs,
}: AnomalLogoIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  // A typed ref rather than a selector: the <svg> is the one node the timeline
  // needs by identity, for its class and its settle transform.
  const svgRef = useRef<SVGSVGElement>(null);

  // The timeline is built once; reading the callback through a ref keeps a
  // caller's inline arrow from re-running `useGSAP` and replaying the intro.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // React's `useId` emits characters that are invalid in an SVG id, and two
  // instances on one page must not share mask ids or they overwrite each other.
  const instanceId = `anomal-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  const emblemClipId = `${instanceId}-emblem-clip`;
  const emblemMaskId = `${instanceId}-emblem-mask`;
  const wordClipId = `${instanceId}-word-clip`;
  const wordMaskId = `${instanceId}-word-mask`;

  useGSAP(
    () => {
      const svg = svgRef.current;
      if (!svg) return;

      const q = gsap.utils.selector(root);

      const emblemReveal = q("[data-part='emblem-reveal']");
      const wordReveal = q("[data-part='word-reveal']");
      const leafLeft = q("[data-part='leaf'][data-side='left']");
      const leafRight = q("[data-part='leaf'][data-side='right']");

      const mm = gsap.matchMedia();

      // The markup already holds the finished logo and the same media query
      // makes the CSS fallback show it with no delay, so there is nothing to do
      // but report completion.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        onCompleteRef.current?.();
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Read before the class is removed: removing it would end the
        // animation this reads from.
        const elapsed = elapsedSincePaint(svg);
        const available =
          deadlineMs === undefined
            ? ANOMAL_INTRO_DURATION_MS
            : deadlineMs - elapsed;

        // Either the fallback already put the logo on screen, or too little
        // time is left for the intro to read as one. Both mean: leave it be.
        if (elapsed >= REVEAL_FALLBACK_DELAY_MS || available < MIN_PLAYABLE_MS) {
          onCompleteRef.current?.();
          return;
        }

        gsap.set(emblemReveal, { attr: { r: 0 } });
        gsap.set(wordReveal, { attr: { width: 0 } });
        // Each leaf grows from the end that attaches to the emblem: the left
        // leaf from its bottom-right, the right leaf from its bottom-left.
        gsap.set(leafLeft, { transformOrigin: "100% 100%", scale: 0 });
        gsap.set(leafRight, { transformOrigin: "0% 100%", scale: 0 });
        gsap.set(svg, { transformOrigin: "50% 50%", scale: 0.985 });

        // GSAP owns the reveal from here, so the CSS fallback steps aside.
        svg.classList.remove(FALLBACK_CLASS);

        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => onCompleteRef.current?.(),
        });

        timeline
          // 1. The emblem irises open.
          .to(
            emblemReveal,
            { attr: { r: EMBLEM_RADIUS }, duration: 0.85, ease: "power2.out" },
            0,
          )
          // 2. The leaves sprout from their bases with a restrained overshoot.
          .to(
            [...leafLeft, ...leafRight],
            {
              scale: 1,
              duration: 0.65,
              stagger: 0.15,
              ease: "back.out(1.6)",
            },
            0.35,
          )
          // 3. The lettering wipes in, left to right.
          .to(
            wordReveal,
            {
              attr: { width: VIEW_BOX_WIDTH },
              duration: 1.05,
              ease: "power2.inOut",
            },
            0.65,
          )
          // 4. The whole mark settles to its final size. Ends at 2.00s.
          .to(svg, { scale: 1, duration: 0.4, ease: "power2.out" }, 1.6);

        timeline.timeScale(introTimeScale(elapsed, deadlineMs));

        return () => {
          timeline.kill();
          svg.classList.add(FALLBACK_CLASS);
        };
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [deadlineMs], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={className} role="img" aria-label="ANØMAL">
      <svg
        ref={svgRef}
        className={`${FALLBACK_CLASS} block h-auto w-full`}
        viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Emblem region: the band between the N and the M, plus the notch
              above the M where the emblem's right flourish overhangs. */}
          <clipPath id={emblemClipId}>
            <rect
              x={SPLIT_X}
              y={0}
              width={BAND_X - SPLIT_X}
              height={VIEW_BOX_HEIGHT}
            />
            <rect
              x={BAND_X}
              y={0}
              width={BAND_END_X - BAND_X}
              height={BAND_SPLIT_Y}
            />
          </clipPath>

          {/* Lettering region: the exact complement of the one above. */}
          <clipPath id={wordClipId}>
            <rect x={0} y={0} width={SPLIT_X} height={VIEW_BOX_HEIGHT} />
            <rect
              x={BAND_X}
              y={BAND_SPLIT_Y}
              width={BAND_END_X - BAND_X}
              height={VIEW_BOX_HEIGHT - BAND_SPLIT_Y}
            />
            <rect
              x={BAND_END_X}
              y={0}
              width={VIEW_BOX_WIDTH - BAND_END_X}
              height={VIEW_BOX_HEIGHT}
            />
          </clipPath>

          {/* No black backing rect: whatever a mask does not paint is already
              fully masked out. */}
          <mask
            id={emblemMaskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={VIEW_BOX_WIDTH}
            height={VIEW_BOX_HEIGHT}
          >
            <circle
              data-part="emblem-reveal"
              cx={EMBLEM_CENTER_X}
              cy={EMBLEM_CENTER_Y}
              r={EMBLEM_RADIUS}
              fill="#fff"
            />
          </mask>

          <mask
            id={wordMaskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={VIEW_BOX_WIDTH}
            height={VIEW_BOX_HEIGHT}
          >
            <rect
              data-part="word-reveal"
              x={0}
              y={0}
              width={VIEW_BOX_WIDTH}
              height={VIEW_BOX_HEIGHT}
              fill="#fff"
            />
          </mask>
        </defs>

        {/* Source order matches the asset: the leaves sit under the white path,
            which has hollows cut out for them. */}
        <path
          data-part="leaf"
          data-side="left"
          d={ANOMAL_LEAF_LEFT_D}
          fill="#98ba96"
          stroke="#98ba96"
          strokeWidth={1.659}
        />
        <path
          data-part="leaf"
          data-side="right"
          d={ANOMAL_LEAF_RIGHT_D}
          fill="#98ba96"
          stroke="#98ba96"
          strokeWidth={1.659}
        />

        <path
          data-part="emblem"
          d={ANOMAL_WORDMARK_D}
          fill="#fff"
          clipPath={`url(#${emblemClipId})`}
          mask={`url(#${emblemMaskId})`}
        />
        <path
          data-part="word"
          d={ANOMAL_WORDMARK_D}
          fill="#fff"
          clipPath={`url(#${wordClipId})`}
          mask={`url(#${wordMaskId})`}
        />
      </svg>
    </div>
  );
}
