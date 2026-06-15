import * as React from "react";

import { cn } from "./utils";

export const closeButtonSrc = new URL(
  "../../../../assets/close_button.webp",
  import.meta.url,
).href;

export const modalCloseButtonClassName =
  "group/modal-close relative inline-flex aspect-[3/2] w-24 shrink-0 cursor-pointer items-center justify-center overflow-visible border-0 bg-transparent p-0 text-transparent outline-none transition-transform duration-150 hover:scale-[1.04] active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-[#f0c040]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102112] disabled:pointer-events-none disabled:opacity-60";

type ModalCloseImageProps = React.ComponentPropsWithoutRef<"span"> & {
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
};

function ModalCloseImage({
  className,
  imageClassName,
  imageStyle,
  ...props
}: ModalCloseImageProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-visible", className)}
      {...props}
    >
      <img
        src={closeButtonSrc}
        alt=""
        decoding="sync"
        draggable={false}
        fetchPriority="high"
        loading="eager"
        className={cn(
          "absolute inset-0 block h-full w-full select-none object-contain",
          imageClassName,
        )}
        style={{
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.42))",
          ...imageStyle,
        }}
      />
    </span>
  );
}

export { ModalCloseImage };
