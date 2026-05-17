import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AwardBadge from "@/components/AwardBadge";
import CertificateImage from "@/components/CertificateImage";
import OilCard from "@/components/OilCard";
import OilImage from "@/components/OilImage";
import {
  awardsByYear,
  bestAward,
  getAllOils,
  getOilBySlug,
  getOilsByProducer,
  getProducerBySlug,
} from "@/lib/data";

export function generateStaticParams() {
  return getAllOils().map((oil) => ({ slug: oil.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const oil = getOilBySlug(slug);
  if (!oil) return { title: "Winner Not Found" };
  return { title: oil.name, description: oil.description };
}

export default async function WinnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const oil = getOilBySlug(slug);
  if (!oil) notFound();

  const producer = getProducerBySlug(oil.producerSlug);
  const best = bestAward(oil);
  const awards = awardsByYear(oil);
  const related = getOilsByProducer(oil.producerSlug).filter(
    (o) => o.slug !== oil.slug,
  );

  const facts: { label: string; value: string }[] = [
    { label: "Intensity", value: oil.intensity },
    { label: "Varieties", value: oil.varieties.join(", ") },
    { label: "Country", value: oil.country },
    { label: "Region", value: oil.region },
  ];
  if (oil.harvestYear)
    facts.push({ label: "Harvest Year", value: String(oil.harvestYear) });
  if (oil.acidity !== undefined)
    facts.push({ label: "Free Acidity", value: `${oil.acidity.toFixed(2)}%` });

  return (
    <div className="container-page py-12">
      <nav className="text-sm text-olive-600">
        <Link href="/winners" className="hover:text-olive-500">
          Winners
        </Link>
        <span className="mx-2">/</span>
        <span className="text-olive-900">{oil.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[340px_1fr]">
        <div className="self-start overflow-hidden rounded-2xl border border-olive-200 bg-white">
          <OilImage
            src={oil.image}
            name={oil.name}
            intensity={oil.intensity}
            className="h-80 w-full"
          />
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-olive-500">
            {oil.varieties.join(" · ")}
          </p>
          <h1 className="mt-1 font-serif text-4xl font-bold text-olive-900">
            {oil.name}
          </h1>
          {producer && (
            <p className="mt-2 text-olive-600">
              by{" "}
              <Link
                href={`/producers/${producer.slug}`}
                className="font-medium text-olive-700 underline-offset-2 hover:underline"
              >
                {producer.name}
              </Link>
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AwardBadge prize={best.prize} year={best.year} />
            <span className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-bold text-cream">
              {oil.awards.length}{" "}
              {oil.awards.length === 1 ? "prize" : "prizes"} won
            </span>
          </div>
          <p className="mt-5 max-w-2xl text-olive-700">{oil.description}</p>

          <h2 className="mt-8 font-serif text-lg font-semibold text-olive-900">
            Tasting Notes
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {oil.tastingNotes.map((note) => (
              <li
                key={note}
                className="rounded-full bg-olive-100 px-3 py-1 text-sm text-olive-800"
              >
                {note}
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-olive-200 bg-olive-200 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-olive-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-medium text-olive-900">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-2xl font-bold text-olive-900">
          Prizes &amp; Certificates
        </h2>
        <p className="mt-1 text-sm text-olive-600">
          Every Terra Olivo award this oil has earned.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <CertificateImage key={`${award.year}-${award.prize}`} award={award} />
          ))}
        </div>
      </section>

      {producer && (
        <section className="mt-14 rounded-2xl border border-olive-200 bg-olive-50 p-6">
          <p className="text-xs uppercase tracking-wide text-olive-500">
            About the producer
          </p>
          <Link
            href={`/producers/${producer.slug}`}
            className="mt-1 inline-block font-serif text-2xl font-bold text-olive-900 hover:text-olive-600"
          >
            {producer.name}
          </Link>
          <p className="mt-1 text-sm text-olive-600">
            {producer.region}, {producer.country}
          </p>
          <p className="mt-3 max-w-3xl text-olive-700">
            {producer.description}
          </p>
          <Link
            href={`/producers/${producer.slug}`}
            className="mt-4 inline-block text-sm font-semibold text-olive-700 hover:text-olive-500"
          >
            View producer profile &rarr;
          </Link>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-bold text-olive-900">
            More from {producer?.name ?? "this producer"}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((o) => (
              <OilCard key={o.slug} oil={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
