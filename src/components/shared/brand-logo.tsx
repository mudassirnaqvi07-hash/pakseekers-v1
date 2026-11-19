"use client";

/**
 * BrandLogo — Official PakSeekers Logo Component.
 *
 * Centralizes logo rendering across Public Website, Student Portal, and Admin Panel.
 * Supports:
 * - "horizontal" (default): Emblem crest icon + stylized typography ("PAK" in emerald, "SEEKERS" in navy)
 * - "icon": Emblem crest icon only (for avatars, compact sidebars, and tight mobile spaces)
 * - "full": Complete authentic 1080x1080 logo (emblem + wordmark + slogan) for splash/auth/about headers
 */

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface BrandLogoProps {
  /**
   * Presentation variant:
   * - "horizontal": Emblem crest + stylized wordmark (best for headers & footers)
   * - "icon": Emblem crest mark only (best for compact spaces)
   * - "full": Full official logo asset with emblem, wordmark & slogan
   */
  variant?: "horizontal" | "icon" | "full";
  /** Predefined size scale */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Optional link destination (default: no link or root) */
  href?: string;
  /** Whether to render for dark backgrounds (e.g. admin dark sidebar) */
  dark?: boolean;
  /** Custom subtitle text below the brand name (e.g. "Entry Test Prep", "Admin Portal") */
  subtitle?: string;
  /** Custom wrapper classes */
  className?: string;
  /** Custom image classes */
  imageClassName?: string;
  /** Optional click handler (e.g. to close mobile drawers) */
  onClick?: () => void;
  /** Next.js Image priority flag */
  priority?: boolean;
}

const SIZE_CONFIG = {
  xs: {
    iconSize: 28,
    iconClass: "w-7 h-7",
    fullWidth: 100,
    fullHeight: 100,
    textClass: "text-base",
    subClass: "text-[9px]",
  },
  sm: {
    iconSize: 36,
    iconClass: "w-9 h-9",
    fullWidth: 130,
    fullHeight: 130,
    textClass: "text-lg",
    subClass: "text-[10px]",
  },
  md: {
    iconSize: 42,
    iconClass: "w-10 h-10 sm:w-11 sm:h-11",
    fullWidth: 160,
    fullHeight: 160,
    textClass: "text-lg sm:text-xl",
    subClass: "text-[10px] sm:text-[11px]",
  },
  lg: {
    iconSize: 52,
    iconClass: "w-12 h-12 sm:w-14 sm:h-14",
    fullWidth: 200,
    fullHeight: 200,
    textClass: "text-2xl sm:text-3xl",
    subClass: "text-xs",
  },
  xl: {
    iconSize: 72,
    iconClass: "w-16 h-16 sm:w-20 sm:h-20",
    fullWidth: 260,
    fullHeight: 260,
    textClass: "text-3xl sm:text-4xl",
    subClass: "text-sm",
  },
};

export function BrandLogo({
  variant = "horizontal",
  size = "md",
  href,
  dark = false,
  subtitle,
  className,
  imageClassName,
  onClick,
  priority = false,
}: BrandLogoProps) {
  const config = SIZE_CONFIG[size];

  // 1. Full Official Logo Variant
  if (variant === "full") {
    const fullContent = (
      <div className={cn("flex flex-col items-center text-center", className)}>
        <Image
          src="/logo.png"
          alt="PakSeekers — Prepare • Achieve • Lead"
          width={config.fullWidth}
          height={config.fullHeight}
          priority={priority}
          className={cn("h-auto w-auto object-contain drop-shadow-xs", imageClassName)}
        />
        {subtitle && (
          <span
            className={cn(
              "font-semibold tracking-wider uppercase mt-2",
              config.subClass,
              dark ? "text-white/70" : "text-text-secondary"
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    );

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClick}
          className="inline-flex transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          {fullContent}
        </Link>
      );
    }
    return fullContent;
  }

  // 2. Icon-Only Variant (Emblem Crest)
  if (variant === "icon") {
    const iconContent = (
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden transition-transform",
          config.iconClass,
          dark ? "bg-white/10" : "bg-primary/5",
          className
        )}
      >
        <Image
          src="/logo-icon.png"
          alt="PakSeekers Crest"
          width={config.iconSize}
          height={config.iconSize}
          priority={priority}
          className={cn("w-full h-full object-contain p-0.5", imageClassName)}
        />
      </div>
    );

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClick}
          title="PakSeekers Home"
          className="inline-flex shrink-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          {iconContent}
        </Link>
      );
    }
    return iconContent;
  }

  // 3. Horizontal Lockup Variant (Emblem Icon + Stylized Typography)
  const horizontalContent = (
    <div className={cn("flex items-center gap-2.5 sm:gap-3 min-w-0 group", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-2xs transition-transform group-hover:scale-[1.02]",
          config.iconClass,
          dark ? "bg-white/10 border border-white/15" : "bg-primary/5 border border-primary/10"
        )}
      >
        <Image
          src="/logo-icon.png"
          alt="PakSeekers Crest"
          width={config.iconSize}
          height={config.iconSize}
          priority={priority}
          className={cn("w-full h-full object-contain p-0.5", imageClassName)}
        />
      </div>

      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none truncate font-sans",
            config.textClass
          )}
        >
          <span className="text-secondary font-black">PAK</span>
          <span className={dark ? "text-white" : "text-primary"}>SEEKERS</span>
        </span>

        {subtitle && (
          <span
            className={cn(
              "font-bold tracking-wider uppercase mt-1 truncate",
              config.subClass,
              dark ? "text-white/60" : "text-text-secondary"
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl min-w-0"
      >
        {horizontalContent}
      </Link>
    );
  }

  return horizontalContent;
}
