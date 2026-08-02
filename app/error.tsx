"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-starlight">
        Unable to load space weather data
      </h1>
      <p className="mt-4 text-faint-star">
        {error.message || "Please try again later."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-aurora-green px-6 py-3 font-medium text-void-navy transition hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
