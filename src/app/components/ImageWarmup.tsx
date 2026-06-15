import { useEffect, useMemo } from "react";
import type { SiteData } from "../data/products";
import { getPreloadImageUrls, keepSiteImagesWarm } from "../services/preload";

interface ImageWarmupProps {
  siteData: SiteData;
}

export function ImageWarmup({ siteData }: ImageWarmupProps) {
  const urls = useMemo(() => getPreloadImageUrls(siteData), [siteData]);

  useEffect(() => {
    keepSiteImagesWarm(siteData);
  }, [siteData]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-10000px] top-[-10000px] h-px w-px overflow-hidden opacity-0"
    >
      {urls.map((url) => (
        <img
          key={url}
          src={url}
          alt=""
          decoding="sync"
          fetchPriority="high"
          loading="eager"
        />
      ))}
    </div>
  );
}
