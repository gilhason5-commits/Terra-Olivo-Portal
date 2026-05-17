import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid place-items-center py-32 text-center">
      <p className="font-serif text-6xl font-bold text-olive-300">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold text-olive-900">
        Page not found
      </h1>
      <p className="mt-2 text-olive-600">
        The page you were looking for could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-olive-700 px-6 py-3 text-sm font-semibold text-cream hover:bg-olive-600"
      >
        Back to home
      </Link>
    </div>
  );
}
