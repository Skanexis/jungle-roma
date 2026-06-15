import { motion } from "motion/react";
import type { SectionId } from "../App";

const buttonBack = new URL("../../../assets/button.webp", import.meta.url).href;
const homepageLogo = new URL("../../../assets/logo-transparent.webp", import.meta.url).href;

interface HeroSectionProps {
  onNavigate: (section: SectionId) => void;
}

const heroNavItems: {
  id: SectionId;
  label: string;
}[] = [
  {
    id: "info",
    label: "INFORMAZIONI",
  },
  {
    id: "catalog",
    label: "PRODOTTI",
  },
  {
    id: "contacts",
    label: "CONTATTI",
  },
];

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        minHeight: "var(--jr-app-height)",
        maxHeight: "var(--jr-app-height)",
        paddingTop: "calc(134px + var(--jr-content-safe-area-top, 0px))",
      }}
    >
      {/* Decorative corner vines */}
      <svg
        className="absolute top-12 left-0 w-32 md:w-48 opacity-30 pointer-events-none"
        viewBox="0 0 120 200"
        fill="none"
      >
        <path
          d="M0 10 Q30 50 10 90 Q-10 130 20 180"
          stroke="#3d8045"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <ellipse cx="15" cy="45" rx="18" ry="10" fill="#2d6635" transform="rotate(-30 15 45)" opacity="0.6" />
        <ellipse cx="5" cy="100" rx="22" ry="12" fill="#3d8045" transform="rotate(20 5 100)" opacity="0.5" />
        <ellipse cx="18" cy="155" rx="16" ry="9" fill="#2d6635" transform="rotate(-15 18 155)" opacity="0.4" />
      </svg>
      <svg
        className="absolute top-12 right-0 w-32 md:w-48 opacity-30 pointer-events-none"
        viewBox="0 0 120 200"
        fill="none"
      >
        <path
          d="M120 10 Q90 50 110 90 Q130 130 100 180"
          stroke="#3d8045"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <ellipse cx="105" cy="45" rx="18" ry="10" fill="#2d6635" transform="rotate(30 105 45)" opacity="0.6" />
        <ellipse cx="115" cy="100" rx="22" ry="12" fill="#3d8045" transform="rotate(-20 115 100)" opacity="0.5" />
        <ellipse cx="102" cy="155" rx="16" ry="9" fill="#2d6635" transform="rotate(15 102 155)" opacity="0.4" />
      </svg>

      {/* Main content */}
      <div className="relative z-10 flex w-full max-w-[1180px] -translate-y-[16vh] flex-col items-center px-4 text-center sm:-translate-y-8 md:-translate-y-2 xl:translate-y-0">
        <style>{`
          .homepage-logo-mark {
            aspect-ratio: 1 / 1;
            align-items: center;
            background:
              radial-gradient(circle at 50% 42%, rgba(238, 234, 220, 0.38), transparent 27%),
              radial-gradient(circle at 52% 58%, #3a3422 0 48%, #15170f 64%, #070b06 100%);
            border-radius: 50%;
            display: flex;
            filter: drop-shadow(0 22px 30px rgba(0, 0, 0, 0.42));
            isolation: isolate;
            justify-content: center;
            overflow: visible;
            padding: clamp(7px, 1.4vw, 13px);
            position: relative;
          }

          .homepage-logo-mark::before {
            content: "";
            position: absolute;
            inset: -6%;
            z-index: -2;
            border-radius: 50%;
            background:
              conic-gradient(from -38deg, #5f5536, #1c2114 12%, #8b7d4e 23%, #202817 34%, #6a5d38 48%, #151b10 63%, #9b8c55 75%, #253017 87%, #5f5536),
              radial-gradient(circle, rgba(176, 224, 90, 0.18), transparent 62%);
            box-shadow:
              inset 0 0 0 2px rgba(238, 234, 220, 0.18),
              inset 0 -14px 22px rgba(0, 0, 0, 0.58),
              0 18px 36px rgba(0, 0, 0, 0.44);
          }

          .homepage-logo-mark::after {
            content: "";
            position: absolute;
            inset: -2%;
            z-index: -1;
            border-radius: 50%;
            background:
              radial-gradient(circle at 30% 18%, rgba(182, 216, 107, 0.28), transparent 16%),
              radial-gradient(circle at 78% 70%, rgba(61, 128, 69, 0.28), transparent 19%),
              transparent;
            filter: blur(0.2px);
          }

          .homepage-logo-inner {
            position: relative;
            height: 100%;
            width: 100%;
            overflow: hidden;
            border-radius: 50%;
            background:
              radial-gradient(circle at 50% 44%, rgba(48, 77, 38, 0.25), transparent 46%),
              #071309;
            box-shadow:
              inset 0 0 0 3px rgba(0, 0, 0, 0.78),
              inset 0 0 26px rgba(0, 0, 0, 0.62);
          }

          .homepage-logo-inner::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            border-radius: 50%;
            background:
              radial-gradient(circle at 50% 42%, transparent 42%, rgba(0, 0, 0, 0.22) 76%),
              linear-gradient(180deg, rgba(255, 246, 198, 0.10), transparent 38%, rgba(0, 0, 0, 0.24));
          }

          .homepage-logo-image {
            height: 100%;
            width: 100%;
            object-fit: contain;
            transform: scale(1.055);
          }
        `}</style>

        {/* Logo icon */}
        <motion.div
          className="mb-4 sm:mb-5 md:mb-6"
          initial={{ y: 16, scale: 0.92, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 150, damping: 18 }}
        >
          <motion.div
            className="homepage-logo-mark mx-auto h-[136px] w-[136px] sm:h-40 sm:w-40 md:h-44 md:w-44 xl:h-60 xl:w-60 2xl:h-64 2xl:w-64"
            animate={{
              y: [0, -7, 0],
              rotate: [-1.4, 1.2, -1.4],
              scale: [1, 1.025, 1],
            }}
            whileHover={{ scale: 1.045, rotate: 0 }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="homepage-logo-inner">
              <motion.img
                src={homepageLogo}
                alt="Jungle Roma"
                className="homepage-logo-image select-none"
                decoding="sync"
                draggable={false}
                fetchPriority="high"
                loading="eager"
                animate={{
                  filter: [
                    "saturate(0.98) contrast(1.04) brightness(0.94)",
                    "saturate(1.06) contrast(1.08) brightness(1)",
                    "saturate(0.98) contrast(1.04) brightness(0.94)",
                  ],
                }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 z-[3]"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 18%, rgba(255,238,164,0.18) 43%, transparent 68%)",
                  transform: "translateX(-72%) rotate(8deg)",
                }}
                animate={{
                  opacity: [0, 0, 1, 0],
                  x: ["-72%", "-72%", "84%", "84%"],
                }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mb-2 text-[26px] leading-none sm:text-[30px] md:text-[34px] lg:text-[44px] xl:text-[64px] 2xl:text-[72px]"
          style={{
            fontFamily: "Russo One, sans-serif",
            color: "#eeeadc",
            letterSpacing: "0.04em",
          }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          JUNGLE ROMA
        </motion.h1>

        {/* Navigation buttons */}
        <motion.div
          className="mt-4 flex flex-col items-center justify-center gap-[19px] sm:mt-5 sm:flex-row sm:gap-4 md:mt-6 lg:gap-5 xl:mt-10 xl:gap-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {heroNavItems.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
              className="relative flex h-[76px] w-[214px] cursor-pointer items-center justify-center overflow-visible transition duration-200 sm:h-[50px] sm:w-[144px] md:h-[56px] md:w-[164px] lg:h-[60px] lg:w-[178px] xl:h-[78px] xl:w-[238px] 2xl:h-[84px] 2xl:w-[260px]"
              style={{
                filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.32))",
                color: "#263421",
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ delay: 0.45 + i * 0.08 }}
            >
              <img
                src={buttonBack}
                alt=""
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 z-[-2] h-[94px] w-[241px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none transition duration-200 sm:h-[62px] sm:w-[162px] md:h-[70px] md:w-[184px] lg:h-[74px] lg:w-[198px] xl:h-[96px] xl:w-[266px] 2xl:h-[104px] 2xl:w-[292px]"
                decoding="sync"
                fetchPriority="high"
                loading="eager"
                style={{ objectFit: "fill" }}
              />
              <span
                className="absolute inset-[10px_16px_12px] z-[-1] rounded-full"
                style={{
                  boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.08)",
                }}
              />
              <span
                className="relative z-10 px-4 text-[12px] font-extrabold leading-none sm:text-[11px] md:text-[12px] lg:text-[12px] xl:text-[14px] 2xl:text-[15px]"
                style={{
                  color: "#263421",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.4px",
                  textShadow: "none",
                  transform: "translateY(1px)",
                }}
              >
                {item.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Bottom decorative leaves */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pointer-events-none">
        <motion.svg
          className="w-24 md:w-36 opacity-25"
          viewBox="0 0 100 80"
          fill="none"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M0 80 Q20 40 60 20 Q40 60 0 80" fill="#3d8045" />
          <path d="M0 80 Q35 50 80 10 Q50 55 0 80" fill="#2d6635" opacity="0.7" />
        </motion.svg>
        <motion.svg
          className="w-24 md:w-36 opacity-25"
          viewBox="0 0 100 80"
          fill="none"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <path d="M100 80 Q80 40 40 20 Q60 60 100 80" fill="#3d8045" />
          <path d="M100 80 Q65 50 20 10 Q50 55 100 80" fill="#2d6635" opacity="0.7" />
        </motion.svg>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-[1px] h-8 rounded-full"
          style={{ background: "linear-gradient(180deg, #3d8045, transparent)" }}
          animate={{ scaleY: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
