import { useState } from "react";
import { motion } from "motion/react";
import type { SectionId } from "../App";
import { stoneSpring, stoneStagger } from "../motionPresets";

const wideCardBg = new URL("../../../assets/BG_2200_420_card.webp", import.meta.url).href;
const normalCardBg = new URL("../../../assets/BG_1200_420_card.webp", import.meta.url).href;

interface InfoSectionProps {
  onNavigate: (section: SectionId) => void;
}

const infoBlocks = [
  {
    title: "INFO",
    text: "Dal 2023 selezioniamo i migliori prodotti sul mercato con i nostri soci in spagna, garantendo il miglior rapporto qualità-prezzo per i nostri clienti",
  },
  {
    title: "MEET UP/DELIVERY",
    text: "Disponibile in tutta Roma dalle 15 alle 20, è consigliato prenotarsi dal giorno prima, verifica obbligatoria",
  },
  {
    title: "SHIP ITA",
    text: "Con un rate di consegna superiore al 99%, utilizziamo diverse soluzioni logistiche per garantire la massima sicurezza del pacco fino alla consegna. Gli ordini vengono spediti il giorno lavorativo successivo alla conferma del pagamento.",
  },
  {
    title: "PAGAMENTI",
    text: "pagamenti delle ship disponibili: bitcoin/monero/usdt/ltc · bonifico (max 1200€) · spedizione contanti nel pacco",
    list: true,
  },
  {
    title: "T.O.S.",
    text: "Reship del 100% se: pacco perso · pacco bloccato · errore nostro nei dati spedizione\nqualità prodotto diverso dal video",
    list: true,
  },
];

export function InfoSection({ onNavigate: _onNavigate }: InfoSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  return (
    <section
      className="relative overflow-y-auto"
      style={{
        minHeight: "var(--jr-app-height)",
        maxHeight: "var(--jr-app-height)",
        paddingTop: "calc(clamp(125px, 9.2vw, 170px) + var(--jr-content-safe-area-top, 0px))",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .info-stone-card[data-wide="true"] {
            min-height: clamp(152px, 16vw, 210px) !important;
          }

          .info-stone-card[data-wide="false"] {
            min-height: clamp(165px, 19vw, 194px) !important;
          }

          .info-stone-copy[data-wide="true"] {
            left: 12% !important;
            right: 12% !important;
            top: 28% !important;
            bottom: 22% !important;
          }

          .info-stone-copy[data-wide="false"] {
            left: 9% !important;
            right: 9% !important;
            top: 30% !important;
            bottom: 17% !important;
          }
        }

        @media (max-width: 767px) {
          .info-stone-copy[data-mobile-tight="true"] {
            transform: translateY(-3px);
          }

          .info-stone-copy[data-mobile-tight="true"] h2 {
            margin-bottom: 6px !important;
          }
        }
      `}</style>
      <motion.div
        className="mx-auto grid w-full max-w-[980px] grid-cols-1 gap-3 px-4 pb-10 md:grid-cols-2 md:gap-4 md:px-8 xl:gap-5"
        variants={stoneStagger}
        initial="hidden"
        animate="show"
      >
        {infoBlocks.map((block, index) => {
          const isWide = index === 0 || index === 2;
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          const isPressed = pressedIndex === index;
          const isActive = isSelected || isHovered;
          const isListBlock = block.list === true;
          const isInfo = block.title === "INFO";
          const isMobileTight = block.title === "INFO" || block.title === "SHIP ITA";
          const isTos = block.title === "T.O.S.";
          const isLongWide = isWide && block.text.length > 150;

          return (
            <motion.button
              key={block.title}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedIndex(index)}
              onFocus={() => setSelectedIndex(index)}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => {
                setHoveredIndex(null);
                setPressedIndex(null);
              }}
              onPointerDown={() => setPressedIndex(index)}
              onPointerUp={() => setPressedIndex(null)}
              onPointerCancel={() => setPressedIndex(null)}
              data-wide={isWide}
              data-list={isListBlock}
              className={`info-stone-card relative flex items-center justify-center overflow-visible text-center ${
                isWide ? "md:col-span-2" : ""
              }`}
              style={{
                minHeight: isWide
                  ? isLongWide
                    ? "clamp(198px, 48vw, 242px)"
                    : "clamp(176px, 42vw, 220px)"
                  : isListBlock
                    ? "clamp(188px, 46vw, 214px)"
                    : "clamp(154px, 37vw, 184px)",
                padding: isWide
                  ? "clamp(34px, 4vw, 50px) clamp(58px, 12vw, 138px)"
                  : "clamp(38px, 4vw, 48px) clamp(54px, 8vw, 82px)",
                background: "transparent",
                cursor: "pointer",
                outline: "none",
                transformOrigin: "50% 58%",
                WebkitTapHighlightColor: "transparent",
              }}
              initial={{ opacity: 0, y: 30, scale: 0.96, rotate: index % 2 === 0 ? -0.45 : 0.45 }}
              animate={
                isPressed
                  ? { opacity: 1, y: 1, scale: 0.99, rotate: 0 }
                  : isSelected || isHovered
                    ? { opacity: 1, y: -3, scale: 1.01, rotate: 0 }
                    : { opacity: 1, y: 0, scale: 1, rotate: 0 }
              }
              transition={{ ...stoneSpring, delay: isActive || isPressed ? 0 : index * 0.055 }}
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${isWide ? wideCardBg : normalCardBg})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  filter: isPressed
                    ? "drop-shadow(0 4px 4px rgba(0,0,0,0.24)) brightness(0.99)"
                    : isActive
                      ? "drop-shadow(0 15px 13px rgba(0,0,0,0.3)) brightness(1.03) saturate(1.04)"
                      : "drop-shadow(0 8px 8px rgba(0,0,0,0.18))",
                  transformOrigin: "50% 58%",
                }}
                animate={
                  isSelected && !isPressed
                    ? {
                        filter: [
                          "drop-shadow(0 13px 12px rgba(0,0,0,0.27)) brightness(1.02) saturate(1.03)",
                          "drop-shadow(0 16px 14px rgba(0,0,0,0.32)) brightness(1.035) saturate(1.05)",
                          "drop-shadow(0 13px 12px rgba(0,0,0,0.27)) brightness(1.02) saturate(1.03)",
                        ],
                      }
                    : {}
                }
                transition={
                  isSelected && !isPressed
                    ? {
                        duration: 2.6,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }
                    : { duration: 0.18, ease: "easeOut" }
                }
              />
              {isSelected && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[13%] right-[13%] bottom-[13%] h-[3px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(76,92,42,0.2), rgba(41,54,32,0.34), rgba(76,92,42,0.2), transparent)",
                  }}
                  initial={{ opacity: 0, scaleX: 0.65 }}
                  animate={{ opacity: [0.25, 0.48, 0.25], scaleX: [0.75, 1, 0.75] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div
                data-wide={isWide}
                data-list={isListBlock}
                data-mobile-tight={isMobileTight}
                className="info-stone-copy absolute z-10 flex min-w-0 flex-col items-center justify-center text-center"
                style={{
                  left: isWide ? "15%" : isTos ? "6%" : isListBlock ? "4.5%" : "12%",
                  right: isWide ? "15%" : isTos ? "3%" : isListBlock ? "4.5%" : "12%",
                  top: isInfo ? "31%" : isWide ? "30%" : isTos ? "24%" : isListBlock ? "26%" : "34%",
                  bottom: isInfo ? "27%" : isWide ? "28%" : isTos ? "24%" : isListBlock ? "22%" : "22%",
                }}
              >
                <h2
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: isWide
                      ? "clamp(13px, 3.7vw, 22px)"
                      : isListBlock
                        ? "clamp(12px, 3.4vw, 15px)"
                        : "clamp(10px, 3vw, 15px)",
                    color: "#263421",
                    fontWeight: 800,
                    letterSpacing: isWide ? "1.3px" : "0.5px",
                    lineHeight: 1,
                    marginBottom: isWide ? "9px" : "5px",
                    textShadow: "0 1px 0 rgba(255,255,255,0.24)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {block.title}
                </h2>
                <p
                  style={{
                    color: "#384337",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: isWide
                      ? isLongWide
                        ? "clamp(9.2px, 2.55vw, 15px)"
                        : "clamp(10.2px, 2.85vw, 15px)"
                      : isListBlock
                        ? "clamp(10px, 2.85vw, 12.5px)"
                        : "clamp(8.8px, 2.45vw, 11px)",
                    fontWeight: 700,
                    lineHeight: isWide ? 1.24 : isListBlock ? 1.18 : 1.2,
                    margin: 0,
                    overflowWrap: "break-word",
                    textShadow: "0 1px 0 rgba(255,255,255,0.22)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {block.text}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}
