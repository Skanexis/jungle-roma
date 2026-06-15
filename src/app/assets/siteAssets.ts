export interface LocalImageAsset {
  name: string;
  url: string;
}

const diamond1 = new URL("../../../assets/diamond1.webp", import.meta.url).href;
const diamond2 = new URL("../../../assets/diamond2.webp", import.meta.url).href;
const diamond3 = new URL("../../../assets/diamond3.webp", import.meta.url).href;
const desktopBackground = new URL("../../../assets/desktop_bg.webp", import.meta.url).href;
const mobileBackground = new URL("../../../assets/mobile_bg.webp", import.meta.url).href;
const tabletBackground = new URL("../../../assets/tablet_bg.webp", import.meta.url).href;

const localImageModules = import.meta.glob("../../../assets/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const backgroundAssetPattern = /(?:^|\/)(desktop_bg|mobile_bg|tablet_bg)\.webp$/i;

export const localImageAssets: LocalImageAsset[] = Object.entries(localImageModules)
  .map(([path, url]) => ({
    name: path.split("/").pop() ?? path,
    url,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const preloadLocalImageUrls = localImageAssets.map((asset) => asset.url);

export const siteBackgroundAssets = {
  desktop: { name: "desktop_bg.webp", url: desktopBackground },
  mobile: { name: "mobile_bg.webp", url: mobileBackground },
  tablet: { name: "tablet_bg.webp", url: tabletBackground },
} satisfies Record<"desktop" | "mobile" | "tablet", LocalImageAsset>;

export const siteBackgroundImageUrls = [
  siteBackgroundAssets.desktop.url,
  siteBackgroundAssets.mobile.url,
  siteBackgroundAssets.tablet.url,
];

export const preloaderBlockAssets = localImageAssets.filter(
  (asset) => !backgroundAssetPattern.test(asset.name),
);

export const preloaderDiamondAssets: LocalImageAsset[] = [
  { name: "diamond1.webp", url: diamond1 },
  { name: "diamond2.webp", url: diamond2 },
  { name: "diamond3.webp", url: diamond3 },
];

export const criticalPreloaderImageUrls = preloaderDiamondAssets.map((asset) => asset.url);
