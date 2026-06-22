import Image from "next/image";
import { LOGO_PATH } from "@/lib/branding";

export interface BrandLogoProps {
  /** Ancho máximo en píxeles. */
  width?: number;
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({
  width = 120,
  className,
  priority = false,
}: BrandLogoProps) {
  const height = Math.round(width * 0.42);

  return (
    <Image
      src={LOGO_PATH}
      alt="UTEN Colombia"
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{ width, height: "auto", maxWidth: "100%" }}
    />
  );
}
