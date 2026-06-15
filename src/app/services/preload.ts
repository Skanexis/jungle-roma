import type { SiteData } from "../data/products";
import {
  criticalPreloaderImageUrls,
  preloadLocalImageUrls,
  siteBackgroundAssets,
  siteBackgroundImageUrls,
} from "../assets/siteAssets";

const IMAGE_TIMEOUT_MS = 12000;

type ProgressHandler = (progress: number) => void;
type PriorityImage = HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" };
type PreloadOptions = {
  waitForDecode?: boolean;
};

const preloadedImages = new Map<string, HTMLImageElement>();
const imagePreloadPromises = new Map<string, Promise<void>>();

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.filter(Boolean)));
}

function getVisibleBackgroundUrl() {
  if (typeof window === "undefined") return siteBackgroundAssets.desktop.url;

  if (window.matchMedia("(max-width: 767px)").matches) {
    return siteBackgroundAssets.mobile.url;
  }

  if (
    window.matchMedia("(min-width: 768px) and (max-width: 1199px) and (orientation: portrait)")
      .matches
  ) {
    return siteBackgroundAssets.tablet.url;
  }

  return siteBackgroundAssets.desktop.url;
}

function getPrioritizedBackgroundUrls() {
  const visibleBackground = getVisibleBackgroundUrl();
  return uniqueUrls([visibleBackground, ...siteBackgroundImageUrls]);
}

export function getPreloadImageUrls(siteData: SiteData) {
  return uniqueUrls([
    ...getPrioritizedBackgroundUrls(),
    ...preloadLocalImageUrls,
    ...criticalPreloaderImageUrls,
    ...siteData.products.flatMap((product) => product.images || []),
  ]);
}

function preloadImage(src: string, options: PreloadOptions = {}) {
  const cachedImage = preloadedImages.get(src);
  if (cachedImage?.complete) {
    if (options.waitForDecode && cachedImage.decode) {
      return cachedImage.decode().then(() => undefined).catch(() => undefined);
    }

    return Promise.resolve();
  }

  const existingPromise = imagePreloadPromises.get(src);
  if (existingPromise) {
    if (options.waitForDecode) {
      return existingPromise.then(() => {
        const image = preloadedImages.get(src);
        return image?.decode?.().then(() => undefined).catch(() => undefined);
      });
    }

    return existingPromise;
  }

  const promise = new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !src) {
      resolve();
      return;
    }

    const image = (cachedImage ?? new Image()) as PriorityImage;
    preloadedImages.set(src, image);

    let settled = false;
    let decodeStarted = false;
    const timeoutId = window.setTimeout(finish, IMAGE_TIMEOUT_MS);

    function finish() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    }

    function decodeAndFinish() {
      if (settled || decodeStarted) return;

      if (!options.waitForDecode || !image.decode) {
        finish();
        return;
      }

      decodeStarted = true;
      image.decode().then(finish).catch(finish);
    }

    image.decoding = "sync";
    image.loading = "eager";
    image.fetchPriority = "high";
    image.onload = decodeAndFinish;
    image.onerror = finish;
    image.src = src;

    if (image.complete) decodeAndFinish();
    if (!options.waitForDecode) {
      image.decode?.().then(finish).catch(() => undefined);
    }
  });

  imagePreloadPromises.set(src, promise);
  return promise;
}

export async function preloadVisibleBackgroundImage(onProgress?: ProgressHandler) {
  const [visibleBackground, ...otherBackgrounds] = getPrioritizedBackgroundUrls();

  onProgress?.(0);

  otherBackgrounds.forEach((url) => {
    preloadImage(url, { waitForDecode: true }).catch(() => undefined);
  });

  await preloadImage(visibleBackground, { waitForDecode: true });
  onProgress?.(1);
}

export function keepSiteImagesWarm(siteData: SiteData) {
  getPreloadImageUrls(siteData).forEach((url) => {
    if (!preloadedImages.has(url) && typeof window !== "undefined") {
      const image = new Image() as PriorityImage;
      image.decoding = "sync";
      image.loading = "eager";
      image.fetchPriority = "high";
      image.src = url;
      preloadedImages.set(url, image);
    }
  });
}

export async function preloadSiteImages(siteData: SiteData, onProgress?: ProgressHandler) {
  const urls = getPreloadImageUrls(siteData);
  const total = urls.length;
  let completed = 0;

  onProgress?.(0);

  if (total === 0) {
    onProgress?.(1);
    return;
  }

  await Promise.allSettled(
    urls.map((url) =>
      preloadImage(url).finally(() => {
        completed += 1;
        onProgress?.(completed / total);
      }),
    ),
  );

  onProgress?.(1);
}
