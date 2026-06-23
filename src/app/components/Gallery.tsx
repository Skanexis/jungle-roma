import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { motion } from "motion/react";

type MediaKind = "image" | "video";

interface MediaItem {
  src: string;
  type: MediaKind;
}

interface GalleryProps {
  images: string[];
  videos?: string[];
  alt?: string;
  maxHeightClass?: string;
}

function buildMediaItems(images: string[] = [], videos: string[] = []): MediaItem[] {
  return [
    ...images.filter(Boolean).map((src) => ({ src, type: "image" as const })),
    ...videos.filter(Boolean).map((src) => ({ src, type: "video" as const })),
  ];
}

function isNativeVideo(src: string) {
  return src.startsWith("/uploads/") || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(src);
}

function EmptyMedia() {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl text-center"
      style={{
        background: "linear-gradient(135deg, rgba(7,19,9,0.92), rgba(18,43,20,0.86))",
        color: "#8cc63f",
        fontFamily: "Montserrat, sans-serif",
        fontSize: "12px",
        fontWeight: 850,
        letterSpacing: "0.08em",
      }}
    >
      MEDIA
    </div>
  );
}

function MediaSlide({
  item,
  alt,
  controls,
  poster,
  imageClassName = "",
  imageStyle,
}: {
  item: MediaItem;
  alt: string;
  controls: boolean;
  poster?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.src]);

  if (item.type === "image") {
    if (imageFailed) {
      return <EmptyMedia />;
    }

    return (
      <img
        src={item.src}
        alt={alt}
        className={`h-full w-full object-cover ${imageClassName}`}
        decoding="sync"
        fetchPriority="high"
        loading="eager"
        onError={() => setImageFailed(true)}
        style={imageStyle}
      />
    );
  }

  if (isNativeVideo(item.src)) {
    return (
      <video
        src={item.src}
        className="h-full w-full object-cover"
        controls={controls}
        muted={!controls}
        loop={!controls}
        autoPlay={!controls}
        playsInline
        poster={poster || undefined}
        preload={controls ? "metadata" : "auto"}
        style={{ backgroundColor: "#020403" }}
      />
    );
  }

  return (
    <iframe
      src={item.src}
      className="h-full w-full"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title={alt}
      style={{ border: 0, backgroundColor: "#020403" }}
    />
  );
}

export function Gallery({
  images,
  videos = [],
  alt = "Product media",
  maxHeightClass = "max-h-[40vh]",
}: GalleryProps) {
  const media = useMemo(() => buildMediaItems(images, videos), [images, videos]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: media.length > 1 });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, media.length]);

  const onPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const onNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!media.length) {
    return <EmptyMedia />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className={`relative min-h-0 flex-1 overflow-hidden rounded-xl ${maxHeightClass}`}
        ref={emblaRef}
      >
        <div className="flex h-full">
          {media.map((item, index) => (
            <div key={`${item.type}-${item.src}`} className="relative h-full flex-[0_0_100%]">
              <MediaSlide
                item={item}
                alt={`${alt} ${index + 1}`}
                controls={selectedIndex === index}
                poster={images[0]}
              />
              {item.type === "video" && (
                <div
                  className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-md px-2 py-1"
                  style={{
                    background: "rgba(7,19,9,0.78)",
                    border: "1px solid rgba(140,198,63,0.34)",
                    color: "#8cc63f",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "10px",
                    fontWeight: 850,
                  }}
                >
                  <Play size={12} fill="#8cc63f" />
                  VIDEO
                </div>
              )}
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full hover:opacity-90"
              style={{ background: "rgba(7,19,9,0.78)", border: "1px solid rgba(61,128,69,0.55)" }}
            >
              <ChevronLeft size={18} color="#8cc63f" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full hover:opacity-90"
              style={{ background: "rgba(7,19,9,0.78)", border: "1px solid rgba(61,128,69,0.55)" }}
            >
              <ChevronRight size={18} color="#8cc63f" />
            </button>
          </>
        )}

        <div
          className="absolute bottom-2 right-2 z-30 rounded-md px-2 py-0.5 text-xs"
          style={{ background: "rgba(7,19,9,0.82)", color: "#8cc63f", fontFamily: "Nunito, sans-serif", fontWeight: 800 }}
        >
          {selectedIndex + 1} / {media.length}
        </div>
      </div>

    </div>
  );
}

export function CardGallery({
  images,
  videos = [],
  alt = "Product",
  imageClassName = "",
  imageStyle,
}: {
  images: string[];
  videos?: string[];
  alt?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
}) {
  const media = useMemo(() => buildMediaItems(images, videos), [images, videos]);
  const [current, setCurrent] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: media.length > 1 });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, media.length]);

  if (!media.length) {
    return <EmptyMedia />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={emblaRef} className="h-full w-full overflow-hidden">
        <div className="flex h-full">
          {media.map((item, index) => (
            <div key={`${item.type}-${item.src}`} className="relative h-full flex-[0_0_100%]">
              <div className="pointer-events-none h-full w-full">
                <MediaSlide
                  item={item}
                  alt={`${alt} ${index + 1}`}
                  controls={false}
                  poster={images[0]}
                  imageClassName={imageClassName}
                  imageStyle={imageStyle}
                />
              </div>
              {item.type === "video" && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 1 }}
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full"
                    style={{
                      background: "rgba(7,19,9,0.74)",
                      border: "1px solid rgba(140,198,63,0.42)",
                      color: "#8cc63f",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.3)",
                    }}
                  >
                    <Play size={18} fill="#8cc63f" />
                  </span>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 gap-1">
          {media.map((item, index) => (
            <button
              key={`${item.type}-card-dot-${item.src}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                emblaApi?.scrollTo(index);
              }}
              className="grid cursor-pointer place-items-center rounded-full transition-all"
              style={{
                width: current === index ? "16px" : "7px",
                height: "7px",
                background: current === index ? "#8cc63f" : "rgba(255,255,255,0.5)",
              }}
              title={item.type === "video" ? "Video" : "Foto"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
