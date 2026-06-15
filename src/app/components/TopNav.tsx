import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Home, Menu, Phone, ShoppingBag, X } from "lucide-react";
import type { SectionId } from "../App";
import { fastStoneSpring } from "../motionPresets";

const headerBack = new URL("../../../assets/header.webp", import.meta.url).href;
const headerMobileBack = new URL("../../../assets/HEADER_MOBILE_CROP.webp", import.meta.url).href;
const buttonBack = new URL("../../../assets/button.webp", import.meta.url).href;
const productsButtonMobile = new URL("../../../assets/catalogo_button_CROP.webp", import.meta.url).href;
const contactsButtonMobile = new URL("../../../assets/Contatti_button_CROP.webp", import.meta.url).href;
const homeButtonMobile = new URL("../../../assets/home_button_CROP.webp", import.meta.url).href;
const infoButtonMobile = new URL("../../../assets/informazioni_button_CROP.webp", import.meta.url).href;
const HEADER_HEIGHT = 172;

interface TopNavProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

const navItems: { id: SectionId; label: string; icon: ReactNode; mobileButtonBack?: string }[] = [
  { id: "home", label: "HOME", icon: <Home size={16} />, mobileButtonBack: homeButtonMobile },
  { id: "info", label: "INFORMAZIONI", icon: <BookOpen size={16} />, mobileButtonBack: infoButtonMobile },
  { id: "catalog", label: "PRODOTTI", icon: <ShoppingBag size={16} />, mobileButtonBack: productsButtonMobile },
  { id: "contacts", label: "CONTATTI", icon: <Phone size={16} />, mobileButtonBack: contactsButtonMobile },
];

export function TopNav({ activeSection, onNavigate }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id: SectionId) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        .top-nav-shell {
          --top-nav-height: 134px;
          --top-nav-inner-height: 112px;
          --top-nav-art-left: 49.5%;
          --top-nav-art-width: 105vw;
          --top-nav-art-box-height: auto;
          --top-nav-art-top: calc(58px - 29vw);
          --top-nav-menu-top: 108px;
          --top-nav-menu-button-right: 16px;
          --top-nav-menu-button-top: 0px;
          --top-nav-menu-button-x: 0px;
          --top-nav-menu-button-width: 74px;
          --top-nav-menu-button-height: 48px;
          --top-nav-menu-button-art-width: 96px;
          --top-nav-menu-button-art-height: 58px;
          --top-nav-dropdown-top: var(--top-nav-menu-top);
          --top-nav-dropdown-item-height: 56px;
          --top-nav-dropdown-item-art-height: 66px;
          --top-nav-button-gap: 6px;
          --top-nav-button-width: 148px;
          --top-nav-button-height: 41px;
          --top-nav-button-art-width: 148px;
          --top-nav-button-art-height: 49px;
          --top-nav-mobile-section-art-height: 52px;
          --top-nav-mobile-section-art-y: 0px;
          --top-nav-button-indicator-bottom: -8px;
          --top-nav-button-indicator-width: 26px;
          --top-nav-buttons-y: 0px;
        }

        @media (max-width: 767px) {
          .top-nav-shell {
            --top-nav-height: clamp(118px, 18vw, 144px);
            --top-nav-inner-height: calc(var(--top-nav-art-box-height) + (var(--top-nav-art-top) * 2));
            --top-nav-art-width: 118vw;
            --top-nav-art-box-height: clamp(102px, 16vw, 126px);
            --top-nav-art-top: clamp(6px, 1.2vw, 10px);
            --top-nav-menu-top: calc(var(--top-nav-height) - 12px);
            --top-nav-menu-button-right: 18px;
            --top-nav-menu-button-top: 18px;
            --top-nav-button-gap: clamp(4px, 1.3vw, 6px);
            --top-nav-button-width: clamp(74px, 22vw, 96px);
            --top-nav-button-height: clamp(31px, 8.7vw, 39px);
            --top-nav-button-art-width: clamp(74px, 22vw, 96px);
            --top-nav-button-art-height: clamp(37px, 10.6vw, 47px);
            --top-nav-mobile-section-art-height: clamp(45px, 12.6vw, 56px);
            --top-nav-mobile-section-art-y: -4px;
            --top-nav-button-indicator-bottom: 5px;
            --top-nav-button-indicator-width: clamp(18px, 5.4vw, 24px);
            --top-nav-buttons-y: -4px;
          }

          .top-nav-button-icon svg {
            width: clamp(17px, 4.8vw, 21px);
            height: clamp(17px, 4.8vw, 21px);
            stroke-width: 2.2;
          }
        }

        @media (max-width: 580px) {
          .top-nav-shell {
            --top-nav-art-width: 121vw;
            --top-nav-art-box-height: clamp(96px, 22vw, 118px);
            --top-nav-art-top: clamp(5px, 1.4vw, 8px);
            --top-nav-button-gap: clamp(3px, 1vw, 5px);
            --top-nav-button-width: clamp(70px, 21vw, 86px);
            --top-nav-button-height: clamp(30px, 8.4vw, 36px);
            --top-nav-button-art-width: clamp(70px, 21vw, 86px);
            --top-nav-button-art-height: clamp(36px, 10.2vw, 43px);
            --top-nav-mobile-section-art-height: clamp(43px, 12vw, 53px);
            --top-nav-mobile-section-art-y: -5px;
            --top-nav-button-indicator-width: clamp(17px, 5vw, 21px);
            --top-nav-buttons-y: -4px;
          }
        }

        @media (max-width: 500px) {
          .top-nav-shell {
            --top-nav-button-width: clamp(68px, calc(68px + (100vw - 320px) * 0.14), 84px);
            --top-nav-button-art-width: clamp(68px, calc(68px + (100vw - 320px) * 0.14), 84px);
            --top-nav-buttons-y: -4px;
          }
        }

        @media (max-width: 430px) {
          .top-nav-shell {
            --top-nav-height: clamp(106px, calc(106px + (100vw - 320px) * 0.11), 118px);
            --top-nav-inner-height: calc(var(--top-nav-art-box-height) + (var(--top-nav-art-top) * 2));
            --top-nav-art-width: 122vw;
            --top-nav-art-box-height: clamp(92px, calc(92px + (100vw - 320px) * 0.08), 101px);
            --top-nav-art-top: 6px;
            --top-nav-menu-top: calc(var(--top-nav-height) - 13px);
            --top-nav-menu-button-right: 14px;
            --top-nav-menu-button-top: 15px;
            --top-nav-button-gap: 3px;
            --top-nav-button-width: clamp(66px, calc(66px + (100vw - 320px) * 0.13), 80px);
            --top-nav-button-height: clamp(29px, calc(29px + (100vw - 320px) * 0.055), 35px);
            --top-nav-button-art-width: clamp(66px, calc(66px + (100vw - 320px) * 0.13), 80px);
            --top-nav-button-art-height: clamp(35px, calc(35px + (100vw - 320px) * 0.065), 42px);
            --top-nav-mobile-section-art-height: clamp(40px, calc(40px + (100vw - 320px) * 0.075), 48px);
            --top-nav-mobile-section-art-y: -5px;
            --top-nav-button-indicator-width: clamp(17px, calc(17px + (100vw - 320px) * 0.027), 20px);
            --top-nav-buttons-y: -4px;
          }
        }

        @media (max-width: 360px) {
          .top-nav-shell {
            --top-nav-height: 106px;
            --top-nav-inner-height: calc(var(--top-nav-art-box-height) + (var(--top-nav-art-top) * 2));
            --top-nav-art-width: 123vw;
            --top-nav-art-box-height: 92px;
            --top-nav-art-top: 6px;
            --top-nav-menu-top: 94px;
            --top-nav-menu-button-right: 12px;
            --top-nav-menu-button-top: 13px;
            --top-nav-mobile-section-art-y: -4px;
            --top-nav-buttons-y: -4px;
          }
        }

        @media (min-width: 1024px) {
          .top-nav-shell {
            --top-nav-button-width: 156px;
            --top-nav-button-art-width: 156px;
          }
        }

        @media (min-width: 1280px) {
          .top-nav-shell {
            --top-nav-height: 172px;
            --top-nav-inner-height: 118px;
            --top-nav-art-width: clamp(1320px, 96vw, 1780px);
            --top-nav-art-top: clamp(-430px, calc(6px - 23vw), -304px);
            --top-nav-button-gap: 12px;
            --top-nav-button-width: 178px;
            --top-nav-button-height: 48px;
            --top-nav-button-art-width: 178px;
            --top-nav-button-art-height: 58px;
            --top-nav-button-indicator-width: 34px;
            --top-nav-buttons-y: -4px;
          }

          .top-nav-button-content {
            font-size: 13px;
            gap: 8px;
          }
        }

        @media (min-width: 1600px) {
          .top-nav-shell {
            --top-nav-button-gap: 14px;
            --top-nav-button-width: 192px;
            --top-nav-button-height: 52px;
            --top-nav-button-art-width: 192px;
            --top-nav-button-art-height: 64px;
            --top-nav-button-indicator-width: 38px;
          }

          .top-nav-button-content {
            font-size: 14px;
          }
        }

        .stone-nav-button {
          isolation: isolate;
        }

        .stone-nav-button::after {
          content: "";
          position: absolute;
          inset: 10px 16px 12px;
          z-index: -1;
          border-radius: 999px;
          background: transparent;
          box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }

        .stone-nav-button:hover .stone-nav-button-art {
          filter: brightness(1.08) saturate(1.04);
        }

        .stone-nav-button-art-mobile-section {
          display: none;
        }

        .stone-nav-button-active {
          transform: translateY(2px);
        }

        .stone-nav-button-active .stone-nav-button-art {
          filter: brightness(0.9) saturate(1.08);
        }

        .stone-nav-button-active::after {
          inset: 9px 15px 11px;
          box-shadow:
            inset 0 2px 5px rgba(0, 0, 0, 0.16),
            inset 0 -1px 2px rgba(255, 255, 255, 0.08),
            0 1px 0 rgba(238, 234, 220, 0.14);
        }

        .top-nav-buttons {
          display: flex;
        }

        .top-nav-art-mobile {
          display: none;
        }

        .top-nav-art-desktop,
        .top-nav-art-mobile img {
          filter: brightness(0.84) saturate(0.96) contrast(1.03);
        }

        .top-nav-menu-button {
          display: none;
        }

        .top-nav-button-content {
          color: #263421 !important;
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.4px;
          line-height: 1;
          text-shadow: none;
          transform: translateY(1px);
        }

        .top-nav-button-content *,
        .top-nav-button-content svg {
          color: #263421 !important;
          stroke: #263421 !important;
        }

        .top-nav-button-icon {
          display: flex;
          flex-shrink: 0;
        }

        .top-nav-button-label-compact {
          font-size: 11px;
        }

        @media (min-width: 1280px) {
          .top-nav-button-label-compact {
            font-size: 12px;
          }
        }

        @media (max-width: 767px) {
          .top-nav-art-desktop {
            display: none;
          }

          .top-nav-art-mobile {
            display: block;
          }

          .top-nav-art-mobile img {
            height: 100%;
            object-fit: cover;
            object-position: center 46%;
            width: 100%;
          }

          .top-nav-button-content {
            padding-inline: 0;
          }

          .stone-nav-button-has-mobile-art .stone-nav-button-art-default {
            display: none;
          }

          .stone-nav-button-has-mobile-art .stone-nav-button-art-mobile-section {
            display: block;
            height: var(--top-nav-mobile-section-art-height);
            top: calc(50% + var(--top-nav-mobile-section-art-y)) !important;
            transform: translate(-50%, -50%) !important;
            translate: none !important;
            width: auto;
          }

          .stone-nav-button-has-mobile-art .top-nav-button-content {
            display: none;
          }

          .top-nav-button-label {
            display: none;
          }
        }

        @media (max-width: 320px) {
          .top-nav-shell {
            --top-nav-menu-button-right: 50%;
            --top-nav-menu-button-top: 10px;
            --top-nav-menu-button-x: 50%;
            --top-nav-menu-button-width: 86px;
            --top-nav-menu-button-height: 42px;
            --top-nav-menu-button-art-width: 108px;
            --top-nav-menu-button-art-height: 52px;
            --top-nav-dropdown-top: 78px;
            --top-nav-dropdown-item-height: 48px;
            --top-nav-dropdown-item-art-height: 58px;
          }

          .top-nav-buttons {
            display: none;
          }

          .top-nav-menu-button {
            display: flex;
          }
        }
      `}</style>

      <motion.header
        className="top-nav-shell fixed left-0 right-0 z-[85] overflow-visible"
        style={{
          top: "var(--jr-content-safe-area-top, 0px)",
          height: "var(--top-nav-height)",
        }}
        initial={{ y: -HEADER_HEIGHT, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div
          className="absolute inset-x-0 top-0 h-full pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={headerBack}
            alt=""
            className="top-nav-art-desktop absolute max-w-none -translate-x-1/2"
            decoding="sync"
            fetchPriority="high"
            loading="eager"
            style={{
              left: "var(--top-nav-art-left)",
              width: "var(--top-nav-art-width)",
              height: "auto",
              top: "var(--top-nav-art-top)",
            }}
          />
          <picture
            className="top-nav-art-mobile absolute max-w-none -translate-x-1/2"
            style={{
              left: "var(--top-nav-art-left)",
              width: "var(--top-nav-art-width)",
              height: "var(--top-nav-art-box-height)",
              top: "var(--top-nav-art-top)",
            }}
          >
            <source media="(max-width: 767px)" srcSet={headerMobileBack} />
            <img
              src={headerMobileBack}
              alt=""
              className="block w-full select-none"
              decoding="sync"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
        </div>

        <nav
          className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-center gap-3 px-4 md:px-8"
          style={{ height: "var(--top-nav-inner-height)" }}
        >
          <div
            className="top-nav-buttons items-center justify-center rounded-xl px-1 py-2"
            style={{
              gap: "var(--top-nav-button-gap)",
              background: "transparent",
              boxShadow: "none",
              transform: "translateY(var(--top-nav-buttons-y))",
            }}
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`stone-nav-button relative flex cursor-pointer items-center justify-center overflow-visible transition duration-200 ${
                    isActive ? "stone-nav-button-active" : ""
                  } ${item.mobileButtonBack ? "stone-nav-button-has-mobile-art" : ""}`}
                  style={{
                    height: "var(--top-nav-button-height)",
                    minWidth: "var(--top-nav-button-width)",
                    color: "#263421",
                    textShadow: "none",
                  }}
                  whileHover={{ y: isActive ? 1 : -2 }}
                  whileTap={{ y: 2, scale: 0.975 }}
                  transition={fastStoneSpring}
                >
                  <img
                    src={buttonBack}
                    alt=""
                    aria-hidden="true"
                    className="stone-nav-button-art stone-nav-button-art-default absolute left-1/2 top-1/2 z-[-2] max-w-none -translate-x-1/2 -translate-y-1/2 select-none transition duration-200"
                    decoding="sync"
                    fetchPriority="high"
                    loading="eager"
                    style={{
                      width: "var(--top-nav-button-art-width)",
                      height: "var(--top-nav-button-art-height)",
                      objectFit: "fill",
                    }}
                  />
                  {item.mobileButtonBack && (
                    <img
                      src={item.mobileButtonBack}
                      alt=""
                      aria-hidden="true"
                      className="stone-nav-button-art stone-nav-button-art-mobile-section absolute left-1/2 top-1/2 z-[-2] max-w-none -translate-x-1/2 -translate-y-1/2 select-none transition duration-200"
                      decoding="sync"
                      fetchPriority="high"
                      loading="eager"
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-1/2 h-[2px] -translate-x-1/2 rounded-full"
                      style={{
                        bottom: "var(--top-nav-button-indicator-bottom)",
                        width: "var(--top-nav-button-indicator-width)",
                        background: "#b6d86b",
                        boxShadow: "0 0 12px rgba(182,216,107,0.8)",
                      }}
                      transition={fastStoneSpring}
                    />
                  )}
                  <span className="top-nav-button-content relative z-10 flex items-center justify-center gap-1.5 px-3">
                    <span className="top-nav-button-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className={item.id === "home" ? "top-nav-button-label" : "top-nav-button-label top-nav-button-label-compact"}>
                      {item.label}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.button
          className="stone-nav-button top-nav-menu-button absolute h-12 w-[74px] cursor-pointer items-center justify-center overflow-visible"
          style={{
            top: "var(--top-nav-menu-button-top)",
            right: "var(--top-nav-menu-button-right)",
            width: "var(--top-nav-menu-button-width)",
            height: "var(--top-nav-menu-button-height)",
            transform: "translateX(var(--top-nav-menu-button-x))",
            color: "#f7f0d4",
          }}
            onClick={() => setMenuOpen((v) => !v)}
            whileTap={{ scale: 0.93 }}
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={menuOpen}
          >
            <img
              src={buttonBack}
              alt=""
              aria-hidden="true"
              className="stone-nav-button-art absolute left-1/2 top-1/2 z-[-2] max-w-none -translate-x-1/2 -translate-y-1/2 select-none transition duration-200"
              decoding="sync"
              fetchPriority="high"
              loading="eager"
              style={{
                width: "var(--top-nav-menu-button-art-width)",
                height: "var(--top-nav-menu-button-art-height)",
                objectFit: "fill",
              }}
            />
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={21} color="#f7f0d4" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={21} color="#f7f0d4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </nav>
      </motion.header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed left-3 right-3 z-50 overflow-hidden rounded-xl py-2 md:hidden"
              style={{
                top: "calc(var(--top-nav-dropdown-top) + var(--jr-content-safe-area-top, 0px))",
                background: "rgba(7,19,9,0.94)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(238,234,220,0.24)",
                boxShadow: "0 18px 36px rgba(0,0,0,0.42)",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {navItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`stone-nav-button relative mx-3 my-1 flex w-[calc(100%-24px)] cursor-pointer items-center justify-center gap-3 overflow-visible px-5 transition duration-150 ${
                    activeSection === item.id ? "stone-nav-button-active" : ""
                  }`}
                  style={{
                    height: "var(--top-nav-dropdown-item-height)",
                    color: "#263421",
                    textShadow: "none",
                  }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <img
                    src={buttonBack}
                    alt=""
                    aria-hidden="true"
                    className="stone-nav-button-art absolute left-1/2 top-1/2 z-[-2] w-full max-w-none -translate-x-1/2 -translate-y-1/2 select-none transition duration-200"
                    decoding="sync"
                    fetchPriority="high"
                    loading="eager"
                    style={{
                      height: "var(--top-nav-dropdown-item-art-height)",
                      objectFit: "fill",
                    }}
                  />
                  <span className="flex shrink-0 items-center">{item.icon}</span>
                  <span
                    className="relative z-10 text-[13px] font-bold leading-none"
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 800,
                      letterSpacing: "0.4px",
                    }}
                  >
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
