type TelegramInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

type TelegramWebApp = {
  initData?: string;
  version?: string;
  platform?: string;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  onEvent?: (eventType: string, eventHandler: (...args: unknown[]) => void) => void;
  offEvent?: (eventType: string, eventHandler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const FALLBACK_HEIGHT = "100dvh";
let initialized = false;

function px(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}px` : "0px";
}

function runTelegramCall(action: () => void) {
  try {
    action();
  } catch {
    // Telegram can reject methods on old or unsupported clients.
  }
}

function setViewportVariables(webApp?: TelegramWebApp) {
  const root = document.documentElement;
  const viewportHeight = webApp?.viewportHeight || window.innerHeight;
  const stableHeight = webApp?.viewportStableHeight || viewportHeight;
  const safe = webApp?.safeAreaInset || {};
  const contentSafe = webApp?.contentSafeAreaInset || safe;

  root.style.setProperty("--jr-app-height", viewportHeight ? `${viewportHeight}px` : FALLBACK_HEIGHT);
  root.style.setProperty("--jr-app-stable-height", stableHeight ? `${stableHeight}px` : FALLBACK_HEIGHT);
  root.style.setProperty("--jr-safe-area-top", px(safe.top));
  root.style.setProperty("--jr-safe-area-right", px(safe.right));
  root.style.setProperty("--jr-safe-area-bottom", px(safe.bottom));
  root.style.setProperty("--jr-safe-area-left", px(safe.left));
  root.style.setProperty("--jr-content-safe-area-top", px(contentSafe.top));
  root.style.setProperty("--jr-content-safe-area-right", px(contentSafe.right));
  root.style.setProperty("--jr-content-safe-area-bottom", px(contentSafe.bottom));
  root.style.setProperty("--jr-content-safe-area-left", px(contentSafe.left));
}

function requestBestTelegramViewport(webApp: TelegramWebApp) {
  runTelegramCall(() => webApp.expand?.());

  const supportsFullscreen =
    typeof webApp.requestFullscreen === "function" &&
    (webApp.isVersionAtLeast?.("8.0") ?? false);

  if (supportsFullscreen && !webApp.isFullscreen) {
    runTelegramCall(() => webApp.requestFullscreen?.());
  }
}

export function initTelegramMiniApp() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const webApp = window.Telegram?.WebApp;
  const updateViewport = () => setViewportVariables(webApp);

  setViewportVariables(webApp);
  window.addEventListener("resize", updateViewport, { passive: true });
  window.addEventListener("orientationchange", updateViewport, { passive: true });

  if (!webApp) return;

  document.documentElement.classList.add("telegram-mini-app");
  runTelegramCall(() => webApp.setHeaderColor?.("#071309"));
  runTelegramCall(() => webApp.setBackgroundColor?.("#071309"));
  runTelegramCall(() => webApp.setBottomBarColor?.("#071309"));
  runTelegramCall(() => webApp.ready?.());

  requestBestTelegramViewport(webApp);
  window.requestAnimationFrame(() => {
    updateViewport();
    requestBestTelegramViewport(webApp);
  });
  window.setTimeout(() => {
    updateViewport();
    runTelegramCall(() => webApp.expand?.());
  }, 300);

  const handleTelegramViewportChange = () => {
    updateViewport();
    requestBestTelegramViewport(webApp);
  };

  webApp.onEvent?.("viewportChanged", updateViewport);
  webApp.onEvent?.("safeAreaChanged", updateViewport);
  webApp.onEvent?.("contentSafeAreaChanged", updateViewport);
  webApp.onEvent?.("fullscreenChanged", handleTelegramViewportChange);
  webApp.onEvent?.("fullscreenFailed", updateViewport);
}
