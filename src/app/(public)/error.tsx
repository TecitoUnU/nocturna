"use client";

import { ErrorBorde } from "@/components/error-borde";

export default function ErrorPublico({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBorde error={error} reset={reset} />;
}
