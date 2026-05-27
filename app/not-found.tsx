import Link from "next/link";

export default function NotFound() {
  // During SSR we don't have access to the current locale from the URL.
  // The browser will resolve / → redirect to /en (or preferred locale).
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-accent">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">Page Not Found</h1>
        <p className="mt-2 text-text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
