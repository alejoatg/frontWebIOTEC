import Image from "next/image";
import { LOGO_PATH } from "@/lib/branding";

export interface BrandLogoProps {
  /** Ancho en píxeles (ignorado si se define `height`). */
  width?: number;
  /** Alto fijo en píxeles. */
  height?: number;
  className?: string;
  priority?: boolean;
}

const LOGO_ASPECT = 0.42;

export default function BrandLogo({
  width = 120,
  height,
  className,
  priority = false,
}: BrandLogoProps) {
  const imgHeight = height ?? Math.round(width * LOGO_ASPECT);
  const imgWidth = height != null ? Math.round(height / LOGO_ASPECT) : width;

  return (
    <Image
      src={LOGO_PATH}
      alt="UTEN Colombia"
      width={imgWidth}
      height={imgHeight}
      className={className}
      priority={priority}
      style={{ height: imgHeight, width: "auto", maxWidth: "100%" }}
    />
  );
}
