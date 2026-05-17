import Link from "next/link";
import AwardBadge from "@/components/AwardBadge";
import OilImage from "@/components/OilImage";
import { bestAward } from "@/lib/data";
import type { OliveOil } from "@/lib/types";

export default function OilCard({ oil }: { oil: OliveOil }) {
  const best = bestAward(oil);
  const wins = oil.awards.length;

  return (
    <Link
      href={`/winners/${oil.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-olive-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative">
        <OilImage
          src={oil.image}
          name={oil.name}
          intensity={oil.intensity}
          className="h-44 w-full"
        />
        {best.score !== undefined && (
          <span className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-olive-900 text-sm font-bold text-cream">
            {best.score}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-olive-500">
          {oil.varieties.join(" · ")}
        </p>
        <h3 className="font-serif text-lg font-semibold text-olive-900 group-hover:text-olive-600">
          {oil.name}
        </h3>
        <p className="text-sm text-olive-600">
          {oil.region}, {oil.country}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <AwardBadge prize={best.prize} year={best.year} />
          {wins > 1 && (
            <span className="rounded-full bg-olive-100 px-2.5 py-1 text-xs font-medium text-olive-700">
              {wins} prizes
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
