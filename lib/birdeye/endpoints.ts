export const BIRDEYE_ENDPOINTS = {
  walletPnlSummary: "/wallet/v2/pnl/summary",
  walletPnlDetails: "/wallet/v2/pnl/details",
  walletNetWorth: "/wallet/v2/net-worth",
  walletTokenList: "/v1/wallet/token_list",
  walletFirstFunded: "/wallet/v2/tx/first-funded",
  tokenMetadataMultiple: "/defi/v3/token/meta-data/multiple",
  traderGainersLosers: "/trader/gainers-losers",
} as const;
