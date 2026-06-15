import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import type { Category, Product } from "../data/products";
import { getProductCategories } from "../data/products";
import { fastStoneSpring, stoneStagger } from "../motionPresets";

const stoneFilterBg = new URL("../../../assets/BG_1200_420_card.webp", import.meta.url).href;
const ALL_CATEGORY = "TUTTI";

interface CatalogSectionProps {
  products: Product[];
  categories: Category[];
  orderHref: string;
  productToOpenId?: string;
  onProductOpened?: () => void;
}

function getCategoryStoneWidth(label: string) {
  if (label.length >= 10) return 158;
  if (label.length >= 8) return 138;
  if (label.length >= 6) return 118;
  return 88;
}

export function CatalogSection({ products, categories, orderHref, productToOpenId, onProductOpened }: CatalogSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const openedProductRef = useRef("");
  const categoryNames = [
    ALL_CATEGORY,
    ...Array.from(new Set([
      ...categories.map((category) => category.name),
      ...products.flatMap((product) => getProductCategories(product)),
    ].filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === ALL_CATEGORY || getProductCategories(p).includes(activeCategory);
    return matchCat;
  });

  useEffect(() => {
    if (!productToOpenId || openedProductRef.current === productToOpenId) return;

    const product = products.find((item) => item.id === productToOpenId);
    if (!product) return;

    openedProductRef.current = productToOpenId;
    setActiveCategory(ALL_CATEGORY);
    setSelectedProduct(product);
    onProductOpened?.();
  }, [onProductOpened, productToOpenId, products]);

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{
        height: "var(--jr-app-height)",
        maxHeight: "var(--jr-app-height)",
        paddingTop: "calc(clamp(130px, 10.5vw, 190px) + var(--jr-content-safe-area-top, 0px))",
      }}
    >
      {/* ── Top toolbar ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 pb-2 pt-0 md:px-8"
        style={{ borderBottom: "1px solid rgba(45,85,48,0.3)" }}
      >
        <div className="flex">
          <motion.div
            className="flex items-center gap-2 overflow-x-auto px-3 py-3 md:gap-3"
            variants={stoneStagger}
            initial="hidden"
            animate="show"
          >
            {categoryNames.map((cat, index) => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative flex h-11 flex-shrink-0 cursor-pointer items-center justify-center overflow-visible text-xs transition-all"
                style={{
                  width: `${getCategoryStoneWidth(cat)}px`,
                  background: "transparent",
                  border: 0,
                  color: "#263421",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.4px",
                  textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                }}
                initial={{ opacity: 0, y: -12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...fastStoneSpring, delay: index * 0.04 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[-7px_-8px] z-0"
                  style={{
                    backgroundImage: `url(${stoneFilterBg})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    filter: activeCategory === cat
                      ? "brightness(1.12) saturate(1.06) drop-shadow(0 5px 7px rgba(0,0,0,0.34))"
                      : "brightness(1.02) saturate(0.96) drop-shadow(0 4px 5px rgba(0,0,0,0.24))",
                    opacity: 1,
                  }}
                />
                <span
                  className="relative z-10 flex h-full w-full items-center justify-center whitespace-nowrap leading-none"
                  style={{
                    color: "#263421",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "0.4px",
                    padding: "0 18px",
                    textShadow: "0 1px 0 rgba(255,255,255,0.32)",
                    transform: "translateY(1px)",
                  }}
                >
                  {cat}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Cards grid ──────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2d6635 transparent" }}
      >
        {filtered.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">🌿</div>
            <h3 style={{ color: "#eeeadc", fontFamily: "Russo One, sans-serif", marginBottom: "8px" }}>
              Nessun prodotto trovato
            </h3>
            <p style={{ color: "#4a7045", fontFamily: "Nunito, sans-serif", fontSize: "14px" }}>
              Prova a cambiare categoria
            </p>
          </motion.div>
        ) : (
          /* Mobile: 2 cols | Tablet: 3 cols | Desktop: 4 cols
             Cards: min 260px, max 300px per specifica */
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            variants={stoneStagger}
            initial="hidden"
            animate="show"
          >
            {filtered.map((product, i) => (
              <div
                key={product.id}
                style={{
                  height: "clamp(460px, 54vw, 510px)",
                  maxWidth: "320px",
                  width: "100%",
                }}
                className="justify-self-center w-full"
              >
                <ProductCard
                  product={product}
                  orderHref={orderHref}
                  onOpen={setSelectedProduct}
                  index={i}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Product detail modal */}
      <ProductModal
        product={selectedProduct}
        orderHref={orderHref}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
