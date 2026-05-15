import type { TimeWindow } from "@/lib/birdeye/types";

const VALID_WINDOWS: TimeWindow[] = ["24h", "7d", "30d"];

export function parseTimeWindow(input: string | null | undefined, fallback: TimeWindow = "7d"): TimeWindow {
  if (!input) {
    return fallback;
  }

  if (VALID_WINDOWS.includes(input as TimeWindow)) {
    return input as TimeWindow;
  }

  throw new Error(`Invalid window. Use one of: ${VALID_WINDOWS.join(", ")}.`);
}
