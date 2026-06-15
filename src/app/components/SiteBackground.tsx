import { siteBackgroundAssets } from "../assets/siteAssets";

const desktopBackground = siteBackgroundAssets.desktop.url;
const mobileBackground = siteBackgroundAssets.mobile.url;
const tabletBackground = siteBackgroundAssets.tablet.url;

export function SiteBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#071309]" aria-hidden="true">
      <style>{`
        .site-background-art {
          --site-background-scale-x: 1;
          transform: scaleX(var(--site-background-scale-x));
          transform-origin: center center;
        }

        @media (max-width: 767px) {
          .site-background-art {
            --site-background-scale-x: 1.08;
          }
        }
      `}</style>

      <picture className="absolute inset-0 block h-full w-full overflow-hidden">
        <source
          media="(min-width: 768px) and (max-width: 1199px) and (orientation: portrait)"
          srcSet={tabletBackground}
        />
        <source media="(max-width: 767px)" srcSet={mobileBackground} />
        <img
          src={desktopBackground}
          alt=""
          className="site-background-art h-full w-full select-none"
          decoding="sync"
          fetchPriority="high"
          loading="eager"
          style={{
            objectFit: "fill",
            objectPosition: "center",
          }}
        />
      </picture>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,7,3,0.16), rgba(2,7,3,0.02) 34%, rgba(2,7,3,0.2) 100%)",
          boxShadow: "inset 0 0 96px rgba(0,0,0,0.42)",
        }}
      />
    </div>
  );
}
