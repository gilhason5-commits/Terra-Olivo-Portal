import Link from "next/link";

const navLinks = [
  { href: "/winners", label: "Winners" },
  { href: "/producers", label: "Producers" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-olive-200 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-olive-700 font-serif text-lg font-bold text-cream">
            T
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-olive-900">
            Terra Olivo
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-olive-800 hover:text-olive-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
