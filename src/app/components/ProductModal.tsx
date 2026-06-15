import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Tag } from "lucide-react";
import { Gallery } from "./Gallery";
import { ModalCloseImage, modalCloseButtonClassName } from "./ui/modal-close-button";
import { getProductCategories, type Product } from "../data/products";
import { fastStoneSpring, stoneEase, stoneSpring } from "../motionPresets";

const stoneChoiceBg = new URL("../../../assets/BG_1200_420_card.webp", import.meta.url).href;
const addButtonBg = new URL("../../../assets/button.webp", import.meta.url).href;
const detailCardBg = new URL("../../../assets/detailed card.webp", import.meta.url).href;

const modalContentVariants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.065,
    },
  },
};

const modalItemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97, filter: "brightness(0.9)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "brightness(1)",
    transition: stoneSpring,
  },
};

const modalMediaVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.94, filter: "brightness(0.82) saturate(0.92)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "brightness(1) saturate(1)",
    transition: { ...stoneSpring, stiffness: 230 },
  },
};

interface ProductModalProps {
  product: Product | null;
  orderHref: string;
  onClose: () => void;
}

export function ProductModal({ product, orderHref, onClose }: ProductModalProps) {
  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrowMobile, setIsNarrowMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrowMobile(window.innerWidth <= 360);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedPriceIdx(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const modalStyle = isMobile
    ? {
        width: "min(145.78vw, 620px)",
        height: isNarrowMobile ? "min(60svh, 460px)" : "min(78svh, 650px)",
      }
    : {
        width: "min(94vw, calc(92vh * 1.5), 940px)",
        aspectRatio: "3 / 2",
      };

  const videos = product?.videos?.length ? product.videos : product?.videoUrl ? [product.videoUrl] : [];

  return createPortal(
    <AnimatePresence mode="wait">
      {product && (
        <>
          <motion.div
            className="fixed inset-0 z-[180]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 46%, rgba(7,19,9,0.16), rgba(3,8,6,0.58) 76%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: stoneEase }}
            onClick={onClose}
          />

          <div className="pointer-events-none fixed inset-0 z-[190] flex items-center justify-center px-0 py-2 md:p-4">
            <style>{`
              .product-detail-modal {
                filter: drop-shadow(0 24px 34px rgba(0,0,0,0.58)) drop-shadow(0 0 18px rgba(140,198,63,0.08));
              }

              .product-detail-frame {
                object-fit: fill;
              }

              .product-detail-safe {
                position: absolute;
                z-index: 10;
                left: 19.7%;
                right: 19.4%;
                top: 15.8%;
                bottom: 11.6%;
                display: grid;
                grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr);
                grid-template-rows: auto clamp(184px, 26vh, 216px) auto auto;
                column-gap: clamp(14px, 2.1vw, 26px);
                row-gap: clamp(4px, 0.65vw, 7px);
              }

              .product-detail-header {
                grid-column: 1 / -1;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: clamp(28px, 4vw, 42px);
                gap: 14px;
                position: relative;
              }

              .product-detail-title {
                color: #f3ead7;
                font-family: "Russo One", sans-serif;
                font-size: clamp(18px, 2.6vw, 28px);
                line-height: 1;
                max-width: 54%;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 3px 5px rgba(0,0,0,0.82), 0 0 10px rgba(240,192,64,0.14);
                white-space: nowrap;
                text-align: center;
              }

              .product-detail-badge {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                color: #263421;
                font-family: "Montserrat", sans-serif;
                font-size: clamp(8px, 1vw, 10px);
                font-weight: 850;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                text-shadow: 0 1px 0 rgba(255,255,255,0.24);
              }

              .product-detail-media {
                position: relative;
                grid-column: 1 / -1;
                grid-row: 2;
                align-self: stretch;
                justify-self: center;
                width: 80%;
                min-height: 0;
                overflow: hidden;
                border: 1px solid rgba(238,234,220,0.12);
                border-radius: clamp(16px, 2.2vw, 24px);
                background: transparent;
                box-shadow: none;
                transform: translateX(clamp(5px, 0.75vw, 10px));
              }

              .product-detail-media::after {
                content: none;
                position: absolute;
                inset: 0;
                z-index: 20;
                pointer-events: none;
                background: transparent;
                box-shadow: none;
              }

              .product-detail-media .rounded-xl {
                border-radius: 0;
              }

              .product-detail-media button {
                z-index: 30;
              }

              .product-detail-info {
                grid-column: 1 / -1;
                grid-row: 3;
                min-height: 0;
                overflow: visible;
                padding: 0;
                scrollbar-width: thin;
                scrollbar-color: rgba(140,198,63,0.45) transparent;
              }

              .product-detail-prices-grid {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: clamp(4px, 0.75vw, 8px);
                width: 100%;
              }

              .product-detail-prices-row {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
              }

              .product-detail-prices-row-top {
                gap: clamp(0px, 0.18vw, 2px);
              }

              .product-detail-prices-row-bottom {
                gap: clamp(6px, 1vw, 12px);
              }

              .product-detail-price-button {
                width: clamp(136px, 19vw, 184px);
              }

              .product-detail-price-button--compact {
                width: clamp(94px, 13.5vw, 129px);
              }

              .product-detail-variants-label {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: clamp(230px, 48%, 330px);
                min-height: clamp(26px, 4vw, 34px);
                margin: clamp(3px, 0.6vw, 6px) auto 0;
              }

              .product-detail-footer {
                grid-column: 1 / -1;
                grid-row: 4;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: clamp(44px, 6vw, 60px);
                gap: 16px;
              }

              .product-detail-close {
                position: absolute;
                z-index: 30;
                right: 15.2%;
                top: 4.8%;
                width: clamp(104px, 12vw, 134px);
              }

              .product-detail-add-button {
                translate: 0 clamp(12px, 1.7vw, 18px);
              }

              @media (max-width: 767px) {
                .product-detail-modal {
                  margin-top: 5svh;
                }

                .product-detail-frame {
                  object-fit: fill;
                }

                .product-detail-safe {
                  left: 12.8%;
                  right: 12.8%;
                  top: 12.4%;
                  bottom: 11.4%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: clamp(4px, 1.1svh, 8px);
                }

                .product-detail-header {
                  width: min(94%, 300px);
                  min-height: clamp(28px, 5.3svh, 34px);
                }

                .product-detail-title {
                  max-width: 100%;
                  font-size: clamp(16px, 5.4vw, 22px);
                }

                .product-detail-badge {
                  display: none;
                }

                .product-detail-media {
                  align-self: center;
                  height: clamp(172px, 31svh, 236px);
                  width: min(82%, 286px);
                  flex-shrink: 0;
                  border-radius: clamp(14px, 4vw, 18px);
                  transform: translateX(8px);
                }

                .product-detail-info {
                  min-height: 0;
                  flex: 0 0 auto;
                  width: min(88%, 300px);
                  padding: 0;
                }

                .product-detail-prices-grid {
                  gap: clamp(2px, 0.8svh, 5px);
                }

                .product-detail-prices-row-top {
                  gap: 0;
                }

                .product-detail-prices-row-bottom {
                  gap: clamp(4px, 1.6vw, 8px);
                }

                .product-detail-price-button {
                  height: clamp(36px, 5svh, 40px);
                  width: clamp(98px, 31vw, 116px);
                }

                .product-detail-price-button--compact {
                  width: clamp(70px, 23vw, 84px);
                }

                .product-detail-price-button > span[aria-hidden="true"] {
                  inset: -4px -3px;
                }

                .product-detail-variants-label {
                  width: min(76%, 190px);
                  min-height: clamp(20px, 3.6svh, 24px);
                  margin-top: clamp(1px, 0.35svh, 3px);
                }

                .product-detail-footer {
                  box-sizing: border-box;
                  width: min(88%, 300px);
                  min-height: clamp(44px, 7.5svh, 52px);
                  flex-shrink: 0;
                  gap: clamp(6px, 2vw, 10px);
                  padding: 0 clamp(6px, 2.2vw, 10px);
                  margin-top: auto;
                  transform: translateY(clamp(-10px, -1.5svh, -5px));
                  align-items: flex-end;
                }

                .product-detail-total {
                  min-width: 96px;
                  text-align: center;
                  transform: translate(-46px, -18px);
                }

                .product-detail-close {
                  left: 78.1%;
                  right: auto;
                  top: calc(11.35% + 4px);
                  translate: -50% -50%;
                  width: clamp(104px, 12vw, 134px);
                }

                .product-detail-add-button {
                  translate: 0 clamp(-20px, -3svh, -12px);
                  margin-left: auto;
                }
              }

              @media (max-width: 360px) {
                .product-detail-safe {
                  top: 10.4%;
                  bottom: 8.8%;
                  gap: 2px;
                }

                .product-detail-header {
                  min-height: clamp(22px, 4.2svh, 28px);
                }

                .product-detail-title {
                  font-size: clamp(15px, 5vw, 20px);
                }

                .product-detail-media {
                  height: clamp(124px, 23svh, 158px);
                  width: min(80%, 262px);
                  transform: translateX(6px);
                }

                .product-detail-prices-grid {
                  gap: 1px;
                }

                .product-detail-price-button {
                  height: clamp(27px, 4svh, 32px);
                  width: clamp(90px, 30vw, 108px);
                }

                .product-detail-price-button--compact {
                  width: clamp(64px, 22vw, 78px);
                }

                .product-detail-variants-label {
                  min-height: 16px;
                  margin-top: 0;
                }

                .product-detail-footer {
                  min-height: clamp(34px, 5.8svh, 42px);
                  gap: 5px;
                  padding: 0 5px;
                  transform: translateY(clamp(-7px, -1.2svh, -3px));
                }

                .product-detail-total {
                  min-width: 86px;
                  transform: translate(-39px, -14px);
                }

                .product-detail-add-button {
                  translate: 0 clamp(-14px, -2.4svh, -8px);
                }
              }
            `}</style>

            <motion.div
              className="product-detail-modal pointer-events-auto relative overflow-hidden"
              style={{
                ...modalStyle,
                background: "transparent",
                flexShrink: 0,
                transformPerspective: 900,
                transformOrigin: "50% 58%",
              }}
              initial={{ opacity: 0, scale: 0.86, y: 30, rotateX: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18, rotateX: -3 }}
              transition={{ ...stoneSpring, stiffness: 300, damping: 30 }}
            >
              <img
                src={detailCardBg}
                alt=""
                aria-hidden="true"
                className="product-detail-frame pointer-events-none absolute inset-0 h-full w-full select-none"
                decoding="sync"
                fetchPriority="high"
                loading="eager"
              />

              <motion.button
                type="button"
                onClick={onClose}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                aria-label="Chiudi scheda"
                className={`product-detail-close ${modalCloseButtonClassName}`}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={fastStoneSpring}
              >
                <ModalCloseImage />
              </motion.button>

              <motion.div
                className="product-detail-safe"
                variants={modalContentVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                <motion.header className="product-detail-header" variants={modalItemVariants}>
                  <h2 className="product-detail-title">{product.name}</h2>
                  <span className="product-detail-badge">{getProductCategories(product).join(" / ")}</span>
                </motion.header>

                <motion.div className="product-detail-media" variants={modalMediaVariants}>
                  <Gallery images={product.images} videos={videos} alt={product.name} maxHeightClass="" />
                </motion.div>

                <ModalInfo
                  product={product}
                  selectedPriceIdx={selectedPriceIdx}
                  setSelectedPriceIdx={setSelectedPriceIdx}
                />

                <motion.footer className="product-detail-footer" variants={modalItemVariants}>
                  <div className="product-detail-total min-w-0">
                  <div
                      style={{
                        color: "#f0c040",
                        fontFamily: "Russo One, sans-serif",
                        fontSize: "clamp(21px, 3.4vw, 34px)",
                        lineHeight: 1,
                        textShadow: "0 3px 5px rgba(0,0,0,0.82), 0 0 12px rgba(240,192,64,0.22)",
                      }}
                    >
                      {(product.prices[selectedPriceIdx]?.price ?? 0).toLocaleString("it-IT")} €
                    </div>
                    <div
                      style={{
                        color: "#bed6a8",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "clamp(10px, 1.4vw, 13px)",
                        fontWeight: 800,
                        marginTop: "3px",
                        textShadow: "0 2px 4px rgba(0,0,0,0.68)",
                      }}
                    >
                      {product.prices[selectedPriceIdx]?.label}
                    </div>
                  </div>

                  <a
                    href={orderHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Acquista ${product.name}`}
                    className="product-detail-add-button relative flex h-12 flex-shrink-0 items-center justify-center gap-1.5 overflow-visible uppercase transition-transform hover:scale-[1.02]"
                    style={{
                      width: isMobile ? "clamp(108px, 34vw, 124px)" : "clamp(134px, 19vw, 172px)",
                      background: "transparent",
                      color: "#263421",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 850,
                      letterSpacing: "0.4px",
                      textDecoration: "none",
                      textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                    }}
                  >
                    <img
                      src={addButtonBg}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2"
                      decoding="sync"
                      fetchPriority="high"
                      loading="eager"
                      style={{
                        width: isMobile ? "calc(100% + 14px)" : "calc(100% + 22px)",
                        height: isMobile ? "calc(100% + 7px)" : "calc(100% + 10px)",
                        objectFit: "fill",
                        filter: "brightness(1.04) saturate(1.04) drop-shadow(0 7px 8px rgba(0,0,0,0.34))",
                      }}
                    />
                    <Plus className="relative z-10" color="#263421" size={14} strokeWidth={2.7} />
                    <span
                      className="relative z-10"
                      style={{
                        color: "#263421",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "clamp(11px, 1.35vw, 14px)",
                        fontWeight: 850,
                        lineHeight: 1,
                        transform: "translateY(1px)",
                      }}
                    >
                      Acquista
                    </span>
                  </a>
                </motion.footer>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalInfo({
  product,
  selectedPriceIdx,
  setSelectedPriceIdx,
}: {
  product: Product;
  selectedPriceIdx: number;
  setSelectedPriceIdx: (i: number) => void;
}) {
  return (
    <motion.div className="product-detail-info" variants={modalItemVariants}>
      <div className="flex min-h-full flex-col gap-2.5">
        <div>
          <div className="product-detail-prices-grid">
            {[
              { className: "product-detail-prices-row product-detail-prices-row-top", offset: 0, prices: product.prices.slice(0, 3) },
              { className: "product-detail-prices-row product-detail-prices-row-bottom", offset: 3, prices: product.prices.slice(3) },
            ].map((row) => (
              <div className={row.className} key={row.offset}>
                {row.prices.map((p, rowIdx) => {
                  const i = row.offset + rowIdx;

                  return (
                    <motion.button
                      key={p.label}
                      type="button"
                      onClick={() => setSelectedPriceIdx(i)}
                      className={`product-detail-price-button ${
                        row.offset === 0 ? "product-detail-price-button--compact" : ""
                      } relative flex h-11 cursor-pointer flex-col items-center justify-center overflow-visible text-center`}
                      style={{
                        background: "transparent",
                        border: 0,
                        transition: "all 0.15s",
                      }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      animate={selectedPriceIdx === i ? { y: -1, scale: 1.018 } : { y: 0, scale: 1 }}
                      transition={selectedPriceIdx === i ? fastStoneSpring : { duration: 0.16, ease: "easeOut" }}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-[-5px_-4px] z-0"
                        style={{
                          backgroundImage: `url(${stoneChoiceBg})`,
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "100% 100%",
                          filter:
                            selectedPriceIdx === i
                              ? "brightness(1.13) saturate(1.06) drop-shadow(0 5px 6px rgba(0,0,0,0.36))"
                              : "brightness(1.01) saturate(0.95) drop-shadow(0 3px 4px rgba(0,0,0,0.24))",
                          opacity: 1,
                        }}
                      />
                      <span
                        className="relative z-10"
                        style={{
                          color: "#263421",
                          fontFamily: "Montserrat, sans-serif",
                          fontSize: "clamp(12px, 1.45vw, 15px)",
                          fontWeight: 850,
                          letterSpacing: "0.3px",
                          lineHeight: 1.05,
                          textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                          transform: "translateY(2px)",
                        }}
                      >
                        {p.label}
                      </span>
                      <span
                        className="relative z-10"
                        style={{
                          color: "#384337",
                          fontFamily: "Montserrat, sans-serif",
                          fontSize: "clamp(9px, 1.15vw, 10.5px)",
                          fontWeight: 850,
                          lineHeight: 1.1,
                          textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                          transform: "translateY(2px)",
                        }}
                      >
                        {p.price.toLocaleString("it-IT")} €
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="product-detail-variants-label">
            <Tag size={13} color="#f0c040" />
            <span
              style={{
                color: "#f0c040",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(10px, 1.35vw, 12px)",
                fontWeight: 850,
                letterSpacing: "0.08em",
                textShadow: "0 2px 4px rgba(0,0,0,0.72)",
              }}
            >
              VARIANTI
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
