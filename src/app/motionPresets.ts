export const stoneEase = [0.22, 0.61, 0.36, 1] as [number, number, number, number];

export const stoneSpring = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
} as const;

export const fastStoneSpring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.75,
} as const;

export const stoneStagger = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.075,
    },
  },
};

export const stoneReveal = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.965,
    filter: "brightness(0.86) saturate(0.92)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "brightness(1) saturate(1)",
    transition: stoneSpring,
  },
};
