import BottleVisual from "@/components/BottleVisual";
import type { Intensity } from "@/lib/types";

/**
 * Renders an olive oil photo when one is supplied, otherwise a styled
 * fallback. Real photos can be dropped in later by setting the `image` field.
 */
export default function OilImage({
  src,
  name,
  intensity,
  className = "",
}: {
  src?: string;
  name: string;
  intensity: Intensity;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <BottleVisual label={name} category={intensity} className={className} />
  );
}
