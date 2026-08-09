"use client";

import { TodayError } from "@/components/workspace/today/today-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <TodayError error={error} reset={reset} />;
}
