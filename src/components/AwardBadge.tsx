import type { Prize } from "@/lib/types";

function badgeStyle(prize: Prize): string {
  if (prize === "Grand Prestige Gold") return "bg-gold-400 text-olive-950";
  if (prize === "Gold Medal") return "bg-gold-500 text-olive-950";
  if (prize === "Prestige Gold") return "bg-gold-500 text-olive-950";
  if (prize === "Prestige Silver") return "bg-olive-200 text-olive-900";
  if (prize.startsWith("Raúl") || prize.startsWith("Moshe") || prize.includes("Champion Trophy"))
    return "bg-terracotta-500 text-white";
  if (prize === "TOP TEN") return "bg-olive-700 text-cream";
  if (prize.startsWith("Best of") || prize.startsWith("Best Israeli") || prize.startsWith("Best International") || prize.startsWith("Best "))
    return "bg-olive-500 text-white";
  return "bg-olive-200 text-olive-900";
}

export default function AwardBadge({
  prize,
  year,
  className = "",
}: {
  prize: Prize;
  year?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyle(prize)} ${className}`}
    >
      {prize}
      {year !== undefined && (
        <span className="font-normal opacity-80">{year}</span>
      )}
    </span>
  );
}
