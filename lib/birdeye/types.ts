export type TimeWindow = "24h" | "7d" | "30d";

export type BirdeyeWalletPnlSummary = {
  wallet: string;
  window: TimeWindow;
  pnlUsd: number | null;
  roiPercent: number | null;
  winRate: number | null;
  tradeCount: number | null;
  volumeUsd: number | null;
};

export type BirdeyeWalletPnlDetailRow = {
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  realizedPnlUsd: number | null;
  unrealizedPnlUsd: number | null;
  roiPercent: number | null;
  buyCount: number | null;
  sellCount: number | null;
  volumeUsd: number | null;
  lastActivityAt: string | null;
};

export type BirdeyeWalletNetWorthPoint = {
  timestamp: string;
  valueUsd: number;
};

export type BirdeyeWalletHolding = {
  tokenAddress: string;
  symbol: string | null;
  name: string | null;
  balance: number | null;
  valueUsd: number | null;
};

export type BirdeyeTokenMetadata = {
  address: string;
  symbol: string | null;
  name: string | null;
  logoUri: string | null;
  decimals: number | null;
};

export type BirdeyeWalletFirstFunded = {
  firstFundedAt: string | null;
  walletAgeDays: number | null;
};

export type BirdeyeTraderGainersLoserRow = {
  wallet: string;
  rank: number | null;
  pnlUsd: number | null;
  roiPercent: number | null;
  winRate: number | null;
  tradeCount: number | null;
  tokenCount: number | null;
  volumeUsd: number | null;
  lastActivityAt: string | null;
};
