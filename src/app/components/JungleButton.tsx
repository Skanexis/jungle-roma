import { motion } from "motion/react";
import { type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface JungleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;
  icon?: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const sizeMap: Record<ButtonSize, { w: string; h: string; text: string }> = {
  sm: { w: "w-[140px]", h: "h-[48px]", text: "text-[13px]" },
  md: { w: "w-[180px]", h: "h-[56px]", text: "text-[14px]" },
  lg: { w: "w-[240px]", h: "h-[64px]", text: "text-[15px]" },
};

const variantMap: Record<ButtonVariant, { bg: string; border: string; text: string; glow: string }> = {
  primary: {
    bg: "bg-gradient-to-b from-[#a0db50] to-[#6aaa28]",
    border: "border-[#4d8a1a] border-2",
    text: "text-[#071309]",
    glow: "hover:shadow-[0_0_20px_rgba(140,198,63,0.5)]",
  },
  secondary: {
    bg: "bg-gradient-to-b from-[#2a5c30] to-[#1a3d20]",
    border: "border-[#3d8045] border",
    text: "text-[#eeeadc]",
    glow: "hover:shadow-[0_0_16px_rgba(61,128,69,0.4)]",
  },
  ghost: {
    bg: "bg-transparent",
    border: "border-[#3d8045] border",
    text: "text-[#8cc63f]",
    glow: "hover:bg-[#1a3d20]",
  },
  danger: {
    bg: "bg-gradient-to-b from-[#c83030] to-[#8a1a1a]",
    border: "border-[#8a1a1a] border",
    text: "text-white",
    glow: "hover:shadow-[0_0_16px_rgba(200,48,48,0.4)]",
  },
};

export function JungleButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  href,
  icon,
  className = "",
  type = "button",
}: JungleButtonProps) {
  const { w, h, text } = sizeMap[size];
  const { bg, border, text: textColor, glow } = variantMap[variant];

  const baseClasses = [
    "relative inline-flex items-center justify-center gap-2 select-none",
    "rounded-xl transition-all duration-200 cursor-pointer",
    "active:scale-95",
    fullWidth ? "w-full" : w,
    h,
    text,
    bg,
    border,
    textColor,
    glow,
    disabled
      ? "opacity-40 cursor-not-allowed pointer-events-none grayscale"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {/* Inner shadow highlight */}
      <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <span className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-t-xl" />
        <span className="absolute inset-x-0 bottom-0 h-[1px] bg-black/30 rounded-b-xl" />
      </span>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="relative z-10 font-bold tracking-wide leading-none">{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
    >
      {inner}
    </motion.button>
  );
}

/* Square icon button (96/80/64px) */
interface SquareButtonProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  href?: string;
  title?: string;
}

const squareSizeMap = {
  sm: "w-[64px] h-[64px] text-xl",
  md: "w-[80px] h-[80px] text-2xl",
  lg: "w-[96px] h-[96px] text-3xl",
};

export function SquareButton({
  children,
  onClick,
  size = "md",
  variant = "secondary",
  disabled = false,
  className = "",
  href,
  title,
}: SquareButtonProps) {
  const { bg, border, text: textColor, glow } = variantMap[variant];
  const sizeClass = squareSizeMap[size];

  const baseClasses = [
    "relative inline-flex items-center justify-center",
    "rounded-xl transition-all duration-200 cursor-pointer",
    "active:scale-95",
    sizeClass,
    bg,
    border,
    textColor,
    glow,
    disabled ? "opacity-40 cursor-not-allowed pointer-events-none grayscale" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        title={title}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses}
      title={title}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
