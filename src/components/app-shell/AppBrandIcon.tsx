import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const MASK: CSSProperties = {
  maskImage: "url(/app-brand-icon.png)",
  WebkitMaskImage: "url(/app-brand-icon.png)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  // White-on-black asset: luminance so dark areas become transparent when tinting.
  maskMode: "luminance",
  WebkitMaskSourceType: "luminance",
};

/** Raster brand mark from `public/app-brand-icon.png`, tinted with inherited `color`. */
export function AppBrandIcon({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="img"
      aria-hidden
      className={cx("shrink-0 bg-current", className)}
      style={{ ...MASK, ...style }}
      {...props}
    />
  );
}
