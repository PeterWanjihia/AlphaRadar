import type {
  BirdeyeTokenMetadata,
  BirdeyeWalletFirstFunded,
  BirdeyeWalletHolding,
  BirdeyeWalletNetWorthPoint,
  BirdeyeWalletPnlDetailRow,
  BirdeyeWalletPnlSummary,
  TimeWindow,
} from "@/lib/birdeye/types";

export type WalletProfile = {
  wallet: string;
  window: TimeWindow;
  summary: BirdeyeWalletPnlSummary | null;
  pnlDetails: BirdeyeWalletPnlDetailRow[];
  netWorthSeries: BirdeyeWalletNetWorthPoint[];
  currentHoldings: BirdeyeWalletHolding[];
  firstFunded: BirdeyeWalletFirstFunded | null;
  tokenMetadata: BirdeyeTokenMetadata[];
  generatedAt: string;
};

export type WalletProfileResult = {
  profile: WalletProfile;
  warnings: string[];
  freshness: Record<string, "fresh" | "cached" | "stale" | "unknown">;
};
