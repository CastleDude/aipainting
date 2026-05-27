"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-accent">500</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">Something went wrong</h1>
        <p className="mt-2 text-text-muted">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
