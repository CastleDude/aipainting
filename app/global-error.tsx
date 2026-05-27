"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary px-4">
        <div className="text-center">
          <p className="text-8xl font-bold text-accent">500</p>
          <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-text-muted">
            A critical error occurred. Please try again later.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
