import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-olive-200 bg-olive-900 text-cream">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-semibold">Terra Olivo</p>
          <p className="mt-2 text-sm text-olive-200">
            The official guide to the world&apos;s best extra virgin olive oils.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-olive-300">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm text-olive-200">
            <li>
              <Link href="/winners" className="hover:text-cream">
                Winners
              </Link>
            </li>
            <li>
              <Link href="/producers" className="hover:text-cream">
                Producers
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-olive-300">
            About
          </p>
          <p className="mt-3 text-sm text-olive-200">
            Terra Olivo recognises excellence in olive oil through an audited,
            independent classification.
          </p>
        </div>
      </div>
      <div className="border-t border-olive-800">
        <div className="container-page py-5 text-xs text-olive-300">
          &copy; {new Date().getFullYear()} Terra Olivo Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
