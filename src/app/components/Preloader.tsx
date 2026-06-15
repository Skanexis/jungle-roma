import { AnimatePresence, motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { gsap } from "gsap";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { preloaderDiamondAssets } from "../assets/siteAssets";

interface PreloaderProps {
  isVisible: boolean;
  progress: number;
}

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type PriorityImage = HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" };

const CRYSTAL_COUNT = 7;

const layout = [
  { x: -106, y: 48, size: 54, rotate: -18 },
  { x: -62, y: 6, size: 68, rotate: 12 },
  { x: -22, y: 58, size: 48, rotate: -8 },
  { x: 0, y: -12, size: 124, rotate: 0 },
  { x: 54, y: 42, size: 62, rotate: 16 },
  { x: 96, y: -4, size: 50, rotate: -14 },
  { x: 18, y: 86, size: 42, rotate: 10 },
];

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image() as PriorityImage;
    let settled = false;

    function finish() {
      if (settled) return;
      settled = true;
      resolve();
    }

    image.decoding = "sync";
    image.loading = "eager";
    image.fetchPriority = "high";
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    image.decode?.().then(finish).catch(finish);
  });
}

export function Preloader({ isVisible, progress }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const crystalRefs = useRef<HTMLDivElement[]>([]);
  const gsapContextRef = useRef<{ revert: () => void } | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const playTickRef = useRef<(index: number) => void>(() => undefined);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [crystalsReady, setCrystalsReady] = useState(false);

  const crystals = useMemo(
    () =>
      Array.from({ length: CRYSTAL_COUNT }, (_, index) => ({
        id: `diamond-${index}`,
        asset: preloaderDiamondAssets[index % preloaderDiamondAssets.length],
        ...layout[index],
      })),
    [],
  );

  const safeProgress = clampProgress(progress);
  const progressLabel = Math.round(safeProgress * 100);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    let cancelled = false;

    Promise.all(preloaderDiamondAssets.map((asset) => preloadImage(asset.url))).then(() => {
      if (!cancelled) setCrystalsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const playTick = useCallback((index: number) => {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context || context.state !== "running") return;

    const now = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(220 + index * 22, now);
    oscillator.frequency.exponentialRampToValueAtTime(165 + index * 14, now + 0.13);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }, []);

  useEffect(() => {
    playTickRef.current = playTick;
  }, [playTick]);

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        context.close().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!progressFillRef.current) return;

    gsap.to(progressFillRef.current, {
      scaleX: safeProgress,
      duration: 0.34,
      ease: "power2.out",
      overwrite: true,
    });
  }, [safeProgress]);

  useLayoutEffect(() => {
    if (isVisible) return;

    const pieces = crystalRefs.current.filter(Boolean);
    timelineRef.current?.kill();
    timelineRef.current = null;

    gsap.killTweensOf([stageRef.current, ...pieces]);
    gsap.set(pieces, { opacity: 0 });
    gsap.set(stageRef.current, { autoAlpha: 0 });
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !rootRef.current || !crystalsReady || gsapContextRef.current) return;

    const pieces = crystalRefs.current.filter(Boolean);
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      gsap.set(stageRef.current, {
        autoAlpha: 1,
        perspective: 700,
        transformStyle: "preserve-3d",
      });
      gsap.set(pieces, {
        xPercent: -50,
        yPercent: -50,
        opacity: 0,
        transformOrigin: "50% 50%",
        transformStyle: "preserve-3d",
      });

      gsap.fromTo(
        [titleRef.current, detailsRef.current],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.07 },
      );

      if (prefersReducedMotion) {
        gsap.set(pieces, {
          opacity: 1,
          x: (index) => crystals[index]?.x ?? 0,
          y: (index) => crystals[index]?.y ?? 0,
          rotate: (index) => crystals[index]?.rotate ?? 0,
          scale: 1,
        });
        return;
      }

      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.45 });
      timelineRef.current = timeline;

      pieces.forEach((piece, index) => {
        const crystal = crystals[index];
        const startX = crystal.x + (index % 2 === 0 ? -28 : 28);
        const startY = -190 - index * 18;
        const startRotate = crystal.rotate + (index % 2 === 0 ? -22 : 22);
        const settleAt = 0.18 + index * 0.17;

        timeline.fromTo(
          piece,
          {
            opacity: 0,
            x: startX,
            y: startY,
            z: 90 - index * 10,
            rotate: startRotate,
            rotateX: index % 2 === 0 ? 18 : -18,
            scale: 0.84,
          },
          {
            opacity: 1,
            x: crystal.x,
            y: crystal.y,
            z: 0,
            rotate: crystal.rotate,
            rotateX: 0,
            scale: 1,
            duration: 1.05,
            ease: "power3.out",
          },
          settleAt,
        );

        timeline.call(() => playTickRef.current(index), [], settleAt + 0.74);
      });

      timeline
        .to(
          pieces,
          {
            x: (index) => (crystals[index]?.x ?? 0) + (index % 2 === 0 ? 8 : -8),
            y: (index) => (crystals[index]?.y ?? 0) + (index % 3 === 0 ? -6 : 5),
            rotate: (index) => (crystals[index]?.rotate ?? 0) + (index % 2 === 0 ? 4 : -4),
            duration: 0.82,
            ease: "sine.inOut",
            stagger: { each: 0.03, from: "center" },
          },
          1.72,
        )
        .to(
          pieces,
          {
            x: (index) => crystals[index]?.x ?? 0,
            y: (index) => crystals[index]?.y ?? 0,
            rotate: (index) => crystals[index]?.rotate ?? 0,
            duration: 0.86,
            ease: "sine.inOut",
            stagger: { each: 0.03, from: "center" },
          },
          2.44,
        )
        .to(
          pieces,
          {
            y: (index) => (crystals[index]?.y ?? 0) - 4,
            duration: 0.56,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
            stagger: { each: 0.02, from: "center" },
          },
          3.1,
        )
        .to(
          pieces,
          {
            opacity: 0,
            y: (index) => (crystals[index]?.y ?? 0) + 44,
            scale: 0.92,
            duration: 0.42,
            ease: "power2.in",
            stagger: { each: 0.035, from: "edges" },
          },
          4.05,
        );
    }, rootRef);

    gsapContextRef.current = context;

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsapContextRef.current?.revert();
      gsapContextRef.current = null;
    };
  }, [crystals, crystalsReady]);

  const handleExitComplete = () => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    gsapContextRef.current?.revert();
    gsapContextRef.current = null;
  };

  const toggleSound = async () => {
    if (soundEnabled) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      return;
    }

    const AudioCtor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioCtor) return;

    try {
      const context = audioContextRef.current ?? new AudioCtor();
      audioContextRef.current = context;
      await context.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      playTick(2);
    } catch {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="preloader"
          ref={rootRef}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "rgba(3, 8, 6, 0.16)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <style>{`
            .diamond-preloader-backdrop {
              background:
                linear-gradient(180deg, rgba(3, 8, 6, 0.7) 0%, rgba(7, 19, 9, 0.42) 46%, rgba(3, 8, 6, 0.72) 100%),
                repeating-linear-gradient(100deg, rgba(238, 234, 220, 0.014) 0 1px, transparent 1px 22px);
            }

            .diamond-stage {
              height: min(48vh, 390px);
              width: min(92vw, 660px);
              transform-style: preserve-3d;
            }

            .diamond-piece {
              left: 50%;
              opacity: 0;
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              will-change: transform, opacity;
            }

            .diamond-piece img {
              display: block;
              height: 100%;
              width: 100%;
              object-fit: cover;
              user-select: none;
              filter: saturate(0.92) brightness(0.92) contrast(1.02);
            }

            .diamond-piece[data-shape="diamond"] img {
              clip-path: polygon(50% 12%, 86% 50%, 50% 88%, 14% 50%);
            }

            .diamond-piece[data-shape="base"] img {
              clip-path: polygon(50% 12%, 87% 50%, 66% 50%, 66% 72%, 50% 84%, 34% 72%, 34% 50%, 13% 50%);
            }

            .diamond-warmup {
              animation: diamondWarmup 1.4s ease-in-out infinite;
              border: 1px solid rgba(238, 234, 220, 0.18);
            }

            @keyframes diamondWarmup {
              0%, 100% { opacity: 0.22; transform: translate(-50%, -50%) rotate(0deg) scale(0.96); }
              50% { opacity: 0.46; transform: translate(-50%, -50%) rotate(45deg) scale(1.03); }
            }

            @media (max-width: 520px) {
              .diamond-stage {
                height: min(44vh, 340px);
                width: 98vw;
              }
            }
          `}</style>

          <div className="diamond-preloader-backdrop absolute inset-0" aria-hidden="true" />

          <button
            type="button"
            aria-label={soundEnabled ? "Disattiva suono" : "Attiva suono"}
            onClick={toggleSound}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#eeeadc]/20 bg-[#030806]/72 text-[#eeeadc] backdrop-blur-md transition hover:border-[#eeeadc]/42"
          >
            {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          <div ref={stageRef} className="diamond-stage relative z-10 mb-4">
            {!crystalsReady && (
              <div
                aria-hidden="true"
                className="diamond-warmup absolute left-1/2 top-1/2 h-20 w-20"
                style={{ clipPath: "polygon(50% 6%, 94% 50%, 50% 94%, 6% 50%)" }}
              />
            )}

            {crystals.map((crystal, index) => {
              const shape = crystal.asset.name.includes("diamond3") ? "base" : "diamond";

              return (
                <div
                  key={crystal.id}
                  ref={(node) => {
                    if (node) crystalRefs.current[index] = node;
                  }}
                  className="diamond-piece pointer-events-none"
                  data-shape={shape}
                  style={{
                    height: crystal.size,
                    width: crystal.size,
                    zIndex: 20 + index,
                  }}
                >
                  <img
                    src={crystal.asset.url}
                    alt=""
                    aria-hidden="true"
                    decoding="sync"
                    draggable={false}
                    fetchPriority="high"
                    loading="eager"
                  />
                </div>
              );
            })}
          </div>

          <div ref={detailsRef} className="relative z-10 w-full px-6 text-center">
            <div
              ref={titleRef}
              style={{
                color: "#eeeadc",
                fontFamily: "Russo One, sans-serif",
                fontSize: "clamp(27px, 5.6vw, 52px)",
                lineHeight: 1,
                textShadow: "0 4px 8px rgba(0,0,0,0.78)",
              }}
            >
              JUNGLE ROMA
            </div>
            <div
              className="mx-auto mt-4 h-[3px] overflow-hidden rounded-full bg-[#173128]"
              style={{ width: "min(390px, 74vw)" }}
            >
              <div
                ref={progressFillRef}
                className="h-full origin-left rounded-full"
                style={{
                  background: "linear-gradient(90deg, #6bc9b8, #8cc63f, #d6b64b)",
                  transform: "scaleX(0)",
                }}
              />
            </div>
            <div
              className="mt-3 uppercase"
              style={{
                color: crystalsReady ? "#bed6c7" : "#78908a",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "11px",
                fontWeight: 850,
                letterSpacing: "0.18em",
                textShadow: "0 2px 5px rgba(0,0,0,0.66)",
              }}
            >
              CARICAMENTO {progressLabel}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
