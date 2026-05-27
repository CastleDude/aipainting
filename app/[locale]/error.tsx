"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="mt-3 max-w-md text-center text-text-secondary">
        An unexpected error occurred. Please try again or refresh the page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-border-primary px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
