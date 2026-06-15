import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Instagram,
  Link,
  MessageCircle,
  Radio,
  Send,
  UserRound,
} from "lucide-react";
import type { ContactIconType, ContactLink } from "../data/products";
import { stoneSpring, stoneStagger } from "../motionPresets";

const wideCardBg = new URL("../../../assets/BG_2200_420_card.webp", import.meta.url).href;
const normalCardBg = new URL("../../../assets/BG_1200_420_card.webp", import.meta.url).href;

const iconByType: Record<ContactIconType, ReactNode> = {
  links: <Link size={23} strokeWidth={2.45} />,
  instagram: <Instagram size={23} strokeWidth={2.45} />,
  telegram: <Send size={23} strokeWidth={2.45} />,
  message: <MessageCircle size={23} strokeWidth={2.45} />,
  signal: <Radio size={23} strokeWidth={2.45} />,
  user: <UserRound size={23} strokeWidth={2.45} />,
};

export function ContactsSection({ contacts }: { contacts: ContactLink[] }) {
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
        .contact-stone-card {
          -webkit-tap-highlight-color: transparent;
        }

        .contact-stone-copy {
          left: 14%;
          right: 14%;
          top: 28%;
          bottom: 27%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .contact-stone-card[data-wide="true"] .contact-stone-copy {
          left: 16%;
          right: 16%;
          top: 29%;
          bottom: 27%;
        }

        .contact-stone-icon,
        .contact-stone-chevron {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        .contact-stone-icon {
          left: 0;
        }

        .contact-stone-chevron {
          right: 0;
          transition: translate 0.2s ease;
        }

        .contact-stone-card:hover .contact-stone-chevron {
          translate: 4px 0;
        }

        .contact-stone-text {
          width: calc(100% - 112px);
          max-width: 330px;
          align-items: center;
          text-align: center;
          transform: translateY(4px);
        }

        .contact-stone-card[data-wide="true"] .contact-stone-text {
          max-width: 470px;
          width: calc(100% - 124px);
        }

        @media (min-width: 768px) {
          .contact-stone-card[data-wide="true"] {
            min-height: clamp(138px, 12.2vw, 168px) !important;
          }

          .contact-stone-card[data-wide="false"] {
            min-height: clamp(124px, 11.4vw, 148px) !important;
          }

          .contact-stone-copy {
            left: 14% !important;
            right: 14% !important;
            top: 29% !important;
            bottom: 27% !important;
          }

          .contact-stone-card[data-wide="true"] .contact-stone-copy {
            left: 17% !important;
            right: 17% !important;
            top: 30% !important;
            bottom: 28% !important;
          }
        }

        @media (max-width: 520px) {
          .contact-stone-copy {
            left: 13% !important;
            right: 13% !important;
            top: 28% !important;
            bottom: 26% !important;
          }

          .contact-stone-text {
            width: calc(100% - 88px);
          }
        }
      `}</style>

      <motion.div
        className="mx-auto grid w-full max-w-[920px] grid-cols-1 gap-2 px-4 pb-10 md:grid-cols-2 md:gap-x-4 md:gap-y-3 md:px-8 xl:gap-x-5 xl:gap-y-3"
        variants={stoneStagger}
        initial="hidden"
        animate="show"
      >
        {contacts.map((contact, index) => {
          const isWide = contact.wide === true;

          return (
            <motion.a
              key={contact.id}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              data-wide={isWide}
              className={`contact-stone-card group relative flex items-center justify-center overflow-visible text-center ${
                isWide ? "md:col-span-2" : ""
              }`}
              style={{
                minHeight: isWide ? "clamp(136px, 34vw, 176px)" : "clamp(122px, 31vw, 152px)",
                padding: isWide
                  ? "clamp(30px, 4vw, 44px) clamp(50px, 11vw, 128px)"
                  : "clamp(28px, 3.6vw, 40px) clamp(40px, 8vw, 72px)",
                background: "transparent",
                cursor: "pointer",
                outline: "none",
                transformOrigin: "50% 58%",
                textDecoration: "none",
              }}
              initial={{ opacity: 0, y: 28, scale: 0.965, rotate: index % 2 === 0 ? -0.35 : 0.35 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ ...stoneSpring, delay: index * 0.055 }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.18, ease: "easeOut" } }}
              whileTap={{ y: 1, scale: 0.985 }}
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${isWide ? wideCardBg : normalCardBg})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.22))",
                  transformOrigin: "50% 58%",
                }}
                whileHover={{
                  filter: "drop-shadow(0 16px 15px rgba(0,0,0,0.33)) brightness(1.035) saturate(1.05)",
                }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              />

              <div className="contact-stone-copy absolute z-10 min-w-0">
                <span
                  aria-hidden="true"
                  className="contact-stone-icon grid shrink-0 place-items-center rounded-full"
                  style={{
                    width: isWide ? "clamp(38px, 8vw, 52px)" : "clamp(34px, 7vw, 44px)",
                    height: isWide ? "clamp(38px, 8vw, 52px)" : "clamp(34px, 7vw, 44px)",
                    color: "#263421",
                    background:
                      "radial-gradient(circle at 34% 28%, rgba(238,232,197,0.64), rgba(143,151,105,0.28) 54%, rgba(47,63,38,0.14))",
                    border: "1px solid rgba(38,52,33,0.32)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -5px 9px rgba(36,42,29,0.16), 0 3px 4px rgba(0,0,0,0.14)",
                  }}
                >
                  {iconByType[contact.type] || iconByType.links}
                </span>

                <span className="contact-stone-text flex min-w-0 flex-col justify-center">
                  <span
                    style={{
                      color: "#263421",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: isWide ? "clamp(13px, 3.2vw, 21px)" : "clamp(10.5px, 2.7vw, 15px)",
                      fontWeight: 850,
                      letterSpacing: isWide ? "0.9px" : "0.3px",
                      lineHeight: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textShadow: "0 1px 0 rgba(255,255,255,0.25)",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contact.title}
                  </span>
                  <span
                    style={{
                      color: "#384337",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: isWide ? "clamp(9.5px, 2.35vw, 13px)" : "clamp(8.4px, 2.1vw, 11px)",
                      fontWeight: 800,
                      letterSpacing: "0.15px",
                      lineHeight: 1.15,
                      marginTop: "5px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textShadow: "0 1px 0 rgba(255,255,255,0.22)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contact.detail}
                  </span>
                  <span
                    style={{
                      color: "#415039",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: isWide ? "clamp(8.6px, 2vw, 11px)" : "clamp(7.8px, 1.85vw, 9.6px)",
                      fontWeight: 750,
                      lineHeight: 1.15,
                      marginTop: "3px",
                      opacity: 0.94,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textShadow: "0 1px 0 rgba(255,255,255,0.18)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contact.handle}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden="true"
                  className="contact-stone-chevron shrink-0"
                  size={isWide ? 22 : 19}
                  color="#263421"
                  strokeWidth={2.65}
                />
              </div>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}
