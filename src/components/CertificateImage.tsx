import AwardBadge from "@/components/AwardBadge";
import type { Award } from "@/lib/types";

/**
 * Renders an award certificate. Shows the supplied image when available,
 * otherwise a styled placeholder so the layout is complete before real
 * scans are added.
 */
export default function CertificateImage({ award }: { award: Award }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-olive-200 bg-white">
      {award.certificateImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={award.certificateImage}
          alt={`${award.prize} certificate, ${award.year}`}
          className="h-32 w-full bg-olive-50 object-contain p-2"
        />
      ) : (
        <div className="grid h-32 w-full place-items-center bg-gradient-to-br from-cream to-olive-100">
          <div className="text-center">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-olive-500">
              Terra Olivo {award.year}
            </p>
            <p className="mt-1 font-serif text-lg font-bold text-olive-900">
              Certificate
            </p>
          </div>
        </div>
      )}
      <figcaption className="flex items-center justify-between gap-2 border-t border-olive-200 p-2.5">
        <AwardBadge prize={award.prize} year={award.year} />
        {award.score !== undefined && (
          <span className="text-sm font-semibold text-olive-700">
            {award.score}/100
          </span>
        )}
      </figcaption>
    </figure>
  );
}
