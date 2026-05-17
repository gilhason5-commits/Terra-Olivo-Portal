"use client";

import { useMemo, useState } from "react";
import OilCard from "@/components/OilCard";
import { prizeRank, type OliveOil, type Prize } from "@/lib/types";

interface Props {
  oils: OliveOil[];
  years: number[];
  prizes: Prize[];
  countries: string[];
}

const ALL = "All";

export default function WinnersExplorer({
  oils,
  years,
  prizes,
  countries,
}: Props) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<string>(ALL);
  const [prize, setPrize] = useState<string>(ALL);
  const [country, setCountry] = useState<string>(ALL);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return oils.filter((oil) => {
      if (country !== ALL && oil.country !== country) return false;
      if (year !== ALL && !oil.awards.some((a) => a.year === Number(year)))
        return false;
      if (prize !== ALL && !oil.awards.some((a) => a.prize === prize))
        return false;
      if (q) {
        const haystack = [
          oil.name,
          oil.region,
          oil.country,
          ...oil.varieties,
          ...oil.tastingNotes,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [oils, query, year, prize, country]);

  const reset = () => {
    setQuery("");
    setYear(ALL);
    setPrize(ALL);
    setCountry(ALL);
  };

  const isFiltered =
    query !== "" || year !== ALL || prize !== ALL || country !== ALL;

  const selectClass =
    "rounded-lg border border-olive-300 bg-white px-3 py-2 text-sm text-olive-900 focus:border-olive-600 focus:outline-none";

  return (
    <div>
      <div className="rounded-xl border border-olive-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search oils, varieties, notes…"
            className={selectClass}
            aria-label="Search winners"
          />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={selectClass}
            aria-label="Filter by edition year"
          >
            <option value={ALL}>All editions</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            className={selectClass}
            aria-label="Filter by prize"
          >
            <option value={ALL}>All prizes</option>
            {[...prizes]
              .sort((a, b) => prizeRank(a) - prizeRank(b))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={selectClass}
            aria-label="Filter by country"
          >
            <option value={ALL}>All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-olive-600">
            {results.length} {results.length === 1 ? "winner" : "winners"}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-olive-700 hover:text-olive-500"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((oil) => (
            <OilCard key={oil.slug} oil={oil} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-olive-600">
          No winners match these filters.
        </p>
      )}
    </div>
  );
}
