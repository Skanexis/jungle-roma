import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { CardGallery } from "./Gallery";
import { getProductCategories, type Product } from "../data/products";
import { stoneSpring } from "../motionPresets";

const stoneChoiceBg = new URL("../../../assets/BG_1200_420_card.webp", import.meta.url).href;
const addButtonBg = new URL("../../../assets/button.webp", import.meta.url).href;
const productCardBg = new URL("../../../assets/product_card.webp", import.meta.url).href;

interface ProductCardProps {
  product: Product;
  orderHref: string;
  onOpen: (product: Product) => void;
  index: number;
}

export function ProductCard({ product, orderHref, onOpen, index }: ProductCardProps) {
  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const selectedPrice = product.prices[selectedPriceIdx] ?? product.prices[0];
  const visiblePrices = product.prices;
  const featuredTags = [product.badge, ...getProductCategories(product)].filter((tag): tag is string => Boolean(tag)).slice(0, 2);
  const videos = product.videos?.length ? product.videos : product.videoUrl ? [product.videoUrl] : [];

  return (
    <motion.article
      className="product-card group relative flex h-full min-w-0 cursor-pointer flex-col overflow-visible"
      style={{
        background: "transparent",
        filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.34))",
      }}
      initial={{ opacity: 0, y: 34, scale: 0.955, rotate: index % 2 === 0 ? -0.6 : 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ ...stoneSpring, delay: index * 0.055 }}
      whileHover={{
        filter: "drop-shadow(0 22px 28px rgba(0,0,0,0.42)) drop-shadow(0 0 12px rgba(140,198,63,0.1))",
        y: -3,
      }}
      whileTap={{ scale: 0.992, y: 1 }}
      onClick={() => onOpen(product)}
    >
      <img
        src={productCardBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        decoding="sync"
        fetchPriority="high"
        loading="eager"
        style={{ objectFit: "fill" }}
      />

      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: "clamp(54px, 17.6%, 68px)",
          right: "clamp(50px, 16.8%, 64px)",
          top: "clamp(64px, 16%, 82px)",
          height: "clamp(132px, 30%, 154px)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "18px 22px 18px 20px",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.12) 28%, rgba(238,234,220,0.04) 48%, rgba(0,0,0,0.34))",
            border: "1px solid rgba(11,15,10,0.46)",
            boxShadow:
              "inset 0 -10px 12px rgba(238,234,220,0.04)",
            clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%, 0 32%)",
          }}
        />

        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: "13px 17px 14px 16px",
            background: "rgba(4,9,5,0.82)",
            border: "0",
            boxShadow:
              "inset 0 -18px 24px rgba(0,0,0,0.82)",
            clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%, 0 32%)",
          }}
        >
          <CardGallery
            images={product.images}
            videos={videos}
            alt={product.name}
            imageStyle={{ objectPosition: "center 58%" }}
          />

          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(238,234,220,0.02), rgba(0,0,0,0.12) 58%, rgba(0,0,0,0.44)), linear-gradient(180deg, transparent, transparent 62%, rgba(0,0,0,0.5))",
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.46), inset 0 -14px 18px rgba(0,0,0,0.56)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 z-10 h-8"
            style={{
              left: "18%",
              background: "linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0.12) 52%, transparent)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, rgba(238,234,220,0.08), transparent 18%, transparent 80%, rgba(0,0,0,0.28)), repeating-linear-gradient(105deg, rgba(238,234,220,0.08) 0 1px, transparent 1px 18px)",
              mixBlendMode: "soft-light",
            }}
          />

          {featuredTags.length > 0 && (
            <div className="pointer-events-none absolute left-3 top-3 z-30 flex max-w-[calc(100%-58px)] flex-wrap gap-1">
              {featuredTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md px-2 py-1 text-[8.5px] uppercase leading-none tracking-[0.08em]"
                  style={{
                    background: "rgba(7,19,9,0.64)",
                    border: "1px solid rgba(238,234,220,0.14)",
                    color: "rgba(238,234,220,0.72)",
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 900,
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.28)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <a
            href={orderHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Acquista ${product.name}`}
            className="absolute right-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-md transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #f0c040, #dca83b)",
              color: "#071309",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 18px rgba(0,0,0,0.34)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Plus size={17} strokeWidth={2.4} />
          </a>

        </div>
      </div>

      <div
        className="pointer-events-none absolute z-30 flex items-center justify-center"
        style={{
          left: "clamp(20px, 7.8%, 30px)",
          bottom: "var(--product-card-total-price-bottom)",
          width: "clamp(92px, 28%, 118px)",
        }}
      >
        <span
          style={{
            color: "#f0c040",
            fontFamily: "Russo One, sans-serif",
            fontSize: "var(--product-card-total-price-size)",
            lineHeight: 1,
            textShadow:
              "0 2px 3px rgba(0,0,0,0.88), 0 0 8px rgba(240,192,64,0.28)",
          }}
        >
          {(selectedPrice?.price ?? 0).toLocaleString("it-IT")} €
        </span>
      </div>

      <h3
        className="pointer-events-none absolute z-30 block"
        style={{
          left: "clamp(56px, 18%, 72px)",
          right: "clamp(44px, 15%, 60px)",
          top: "clamp(214px, 48%, 244px)",
          fontFamily: "Nunito, sans-serif",
          color: "#eeeadc",
          fontSize: "clamp(16px, 1.45vw, 20px)",
          fontWeight: 900,
          letterSpacing: "0",
          lineHeight: 1.05,
          overflow: "hidden",
          textAlign: "center",
          textOverflow: "ellipsis",
          textShadow: "0 2px 4px rgba(0,0,0,0.86)",
          whiteSpace: "nowrap",
        }}
      >
        {product.name}
      </h3>

      <div
        className="absolute z-30 grid content-start justify-center"
        style={{
          left: "clamp(68px, 22%, 86px)",
          right: "clamp(42px, 15%, 58px)",
          top: "clamp(238px, 52%, 264px)",
          bottom: "clamp(108px, 21%, 122px)",
          columnGap: "clamp(8px, 3%, 12px)",
          gridTemplateColumns: "repeat(2, minmax(0, clamp(58px, 5.2vw, 70px)))",
          rowGap: "3px",
        }}
      >
        {visiblePrices.map((variant, variantIndex) => {
          const isSelected = selectedPriceIdx === variantIndex;
          const isCenteredLast = visiblePrices.length % 2 === 1 && variantIndex === visiblePrices.length - 1;

          return (
            <motion.button
              key={variant.label}
              type="button"
              className="relative flex h-8 cursor-pointer items-center justify-center overflow-visible text-[10px] leading-none"
              style={{
                width: "clamp(58px, 4.8vw, 68px)",
                background: "transparent",
                border: 0,
                color: "#263421",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 800,
                letterSpacing: "0.3px",
                textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                gridColumn: isCenteredLast ? "1 / -1" : undefined,
                justifySelf: isCenteredLast ? "center" : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPriceIdx(variantIndex);
              }}
              whileHover={{ y: -1, scale: 1.025 }}
              whileTap={{ y: 1, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[-5px_-3px] z-0"
                style={{
                  backgroundImage: `url(${stoneChoiceBg})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  filter: isSelected
                    ? "brightness(1.12) saturate(1.06) drop-shadow(0 4px 5px rgba(0,0,0,0.32))"
                    : "brightness(1.01) saturate(0.95) drop-shadow(0 3px 4px rgba(0,0,0,0.22))",
                  opacity: 1,
                }}
              />
              <span
                className="relative z-10 flex h-full w-full items-center justify-center whitespace-nowrap"
                style={{
                  color: "#263421",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "clamp(12px, 0.95vw, 13px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  padding: "0 10px",
                  textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                  transform: "translateY(2px)",
                }}
              >
                {variant.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div
        className="relative z-20 flex min-h-0 flex-1 flex-col"
        style={{
          padding: "clamp(214px, 48%, 250px) clamp(24px, 9.2%, 34px) clamp(64px, 14%, 82px)",
        }}
      >
        <div className="relative mt-auto flex flex-col items-end gap-1.5">
          <a
            href={orderHref}
            target="_blank"
            rel="noreferrer"
            className="relative flex h-11 flex-shrink-0 items-center justify-center gap-1.5 overflow-visible text-[10px] uppercase tracking-[0.08em] transition-transform hover:scale-[1.02]"
            style={{
              width: "clamp(112px, 10vw, 150px)",
              background: "transparent",
              color: "#263421",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              letterSpacing: "0.4px",
              textShadow: "0 1px 0 rgba(255,255,255,0.32)",
            }}
            onClick={(e) => e.stopPropagation()}
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
                width: "calc(100% + 18px)",
                height: "calc(100% + 8px)",
                objectFit: "fill",
                filter: "brightness(1.04) saturate(1.04) drop-shadow(0 6px 7px rgba(0,0,0,0.32))",
              }}
            />
            <Plus className="relative z-10" color="#263421" size={13} strokeWidth={2.6} />
            <span
              className="relative z-10"
              style={{
                color: "#263421",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(10.5px, 0.82vw, 12px)",
                fontWeight: 800,
                lineHeight: 1,
                transform: "translateY(1px)",
                textShadow: "0 1px 0 rgba(255,255,255,0.32)",
              }}
            >
              Acquista
            </span>
          </a>
        </div>
      </div>
    </motion.article>
  );
}
