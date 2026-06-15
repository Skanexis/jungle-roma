import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Preloader } from "./components/Preloader";
import { ImageWarmup } from "./components/ImageWarmup";
import { JungleBackground } from "./components/JungleBackground";
import { SiteBackground } from "./components/SiteBackground";
import { TopNav } from "./components/TopNav";
import { HeroSection } from "./components/HeroSection";
import { InfoSection } from "./components/InfoSection";
import { CatalogSection } from "./components/CatalogSection";
import { ContactsSection } from "./components/ContactsSection";
import { getFallbackSiteData, type SiteData } from "./data/products";
import { fetchPublicData } from "./services/api";
import { preloadSiteImages, preloadVisibleBackgroundImage } from "./services/preload";
import { stoneEase } from "./motionPresets";

export type SectionId = "home" | "info" | "catalog" | "contacts";

const SECTION_ORDER: SectionId[] = ["home", "info", "catalog", "contacts"];
const MIN_PRELOADER_MS = 3600;
const DATA_TIMEOUT_MS = 6000;

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 46 : -46,
    y: 14,
    opacity: 0,
    scale: 0.985,
    filter: "blur(5px) brightness(0.82)",
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -36 : 36,
    y: -8,
    opacity: 0,
    scale: 0.992,
    filter: "blur(4px) brightness(0.88)",
  }),
};

function readProductLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product") || "";
  const section = params.get("section");

  return {
    productId,
    section: section === "catalog" || productId ? "catalog" as SectionId : null,
  };
}

async function fetchPublicDataWithFallback() {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      fetchPublicData(),
      new Promise<SiteData>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("Public data timeout")), DATA_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return getFallbackSiteData();
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [direction, setDirection] = useState(1);
  const [siteData, setSiteData] = useState<SiteData>(() => getFallbackSiteData());
  const [productToOpenId, setProductToOpenId] = useState(() => readProductLinkParams().productId);

  useEffect(() => {
    const params = readProductLinkParams();
    if (params.section) {
      setActiveSection(params.section);
    }

    const handlePopState = () => {
      const nextParams = readProductLinkParams();
      if (nextParams.section) setActiveSection(nextParams.section);
      setProductToOpenId(nextParams.productId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const minDelay = new Promise((resolve) => window.setTimeout(resolve, MIN_PRELOADER_MS));
      const dataPromise = fetchPublicDataWithFallback();
      const setProgress = (nextProgress: number) => {
        if (!cancelled) {
          setPreloadProgress((currentProgress) => Math.max(currentProgress, nextProgress));
        }
      };

      setProgress(0.02);

      await preloadVisibleBackgroundImage((progress) => {
        setProgress(0.02 + progress * 0.22);
      });

      if (cancelled) return;

      const nextSiteData = await dataPromise;

      if (cancelled) return;

      setSiteData(nextSiteData);
      setProgress(0.24);

      await Promise.all([
        preloadSiteImages(nextSiteData, (progress) => {
          setProgress(0.24 + progress * 0.76);
        }),
        minDelay,
      ]);

      if (!cancelled) {
        setPreloadProgress(1);
        setIsLoading(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (id: SectionId) => {
    const currIdx = SECTION_ORDER.indexOf(activeSection);
    const nextIdx = SECTION_ORDER.indexOf(id);
    setDirection(nextIdx >= currIdx ? 1 : -1);
    setActiveSection(id);
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "var(--jr-app-height)",
        height: "var(--jr-app-height)",
        background: "#071309",
      }}
    >
      {/* Responsive stone background */}
      <SiteBackground />

      {/* Subtle animated ambient layer */}
      <JungleBackground />

      <ImageWarmup siteData={siteData} />

      {/* Preloader */}
      <Preloader isVisible={isLoading} progress={preloadProgress} />

      {/* Persistent top navigation */}
      {!isLoading && (
        <TopNav activeSection={activeSection} onNavigate={handleNavigate} />
      )}

      {/* Main sections with animated transitions */}
      {!isLoading && (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSection}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.46, ease: stoneEase }}
            className="absolute inset-0 z-10"
            style={{ transformOrigin: "50% 58%", willChange: "transform, opacity, filter" }}
          >
            {activeSection === "home" && <HeroSection onNavigate={handleNavigate} />}
            {activeSection === "info" && <InfoSection onNavigate={handleNavigate} />}
            {activeSection === "catalog" && (
              <CatalogSection
                categories={siteData.categories}
                orderHref={siteData.settings.orderUrl}
                productToOpenId={productToOpenId}
                products={siteData.products}
                onProductOpened={() => setProductToOpenId("")}
              />
            )}
            {activeSection === "contacts" && <ContactsSection contacts={siteData.contacts} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
