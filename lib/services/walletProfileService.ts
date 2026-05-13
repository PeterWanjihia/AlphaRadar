import { BirdeyeClient, BirdeyeClientError } from "@/lib/birdeye/client";
import type { TimeWindow } from "@/lib/birdeye/types";
import type { WalletProfileResult } from "@/lib/types/wallet";

export class WalletProfileService {
  constructor(private readonly birdeyeClient: BirdeyeClient = new BirdeyeClient()) {}

  async buildWalletProfile(wallet: string, window: TimeWindow): Promise<WalletProfileResult> {
    const warnings: string[] = [];

    const [summaryResult, detailsResult, netWorthResult, holdingsResult, firstFundedResult] =
      await Promise.allSettled([
        this.birdeyeClient.getWalletPnlSummary(wallet, window),
        this.birdeyeClient.getWalletPnlDetails(wallet, window),
        this.birdeyeClient.getWalletNetWorth(wallet, window),
        this.birdeyeClient.getWalletTokenList(wallet),
        this.birdeyeClient.getWalletFirstFunded(wallet),
      ]);

    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const pnlDetails = detailsResult.status === "fulfilled" ? detailsResult.value : [];
    const netWorthSeries = netWorthResult.status === "fulfilled" ? netWorthResult.value : [];
    const currentHoldings = holdingsResult.status === "fulfilled" ? holdingsResult.value : [];
    const firstFunded = firstFundedResult.status === "fulfilled" ? firstFundedResult.value : null;

    if (summaryResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet PNL summary unavailable", summaryResult.reason));
    }
    if (detailsResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet PNL details unavailable", detailsResult.reason));
    }
    if (netWorthResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet net worth history unavailable", netWorthResult.reason));
    }
    if (holdingsResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet token holdings unavailable", holdingsResult.reason));
    }
    if (firstFundedResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet first-funded date unavailable", firstFundedResult.reason));
    }

    const tokenAddresses = Array.from(
      new Set(
        [
          ...pnlDetails.map((row) => row.tokenAddress),
          ...currentHoldings.map((row) => row.tokenAddress),
        ].filter((address) => address && address !== "unknown"),
      ),
    );

    let tokenMetadata: Awaited<ReturnType<BirdeyeClient["getTokenMetadata"]>> = [];

    if (tokenAddresses.length > 0) {
      try {
        tokenMetadata = await this.birdeyeClient.getTokenMetadata(tokenAddresses);
      } catch (error) {
        warnings.push(this.toWarning("Token metadata unavailable", error));
      }
    }

    return {
      profile: {
        wallet,
        window,
        summary,
        pnlDetails,
        netWorthSeries,
        currentHoldings,
        firstFunded,
        tokenMetadata,
        generatedAt: new Date().toISOString(),
      },
      warnings,
      freshness: {
        summary: "fresh",
        pnlDetails: "fresh",
        netWorth: "fresh",
        holdings: "fresh",
        firstFunded: "fresh",
        metadata: tokenMetadata.length > 0 ? "fresh" : "unknown",
      },
    };
  }

  private toWarning(message: string, error: unknown): string {
    if (error instanceof BirdeyeClientError) {
      return `${message}: ${error.message} (${error.code})`;
    }

    if (error instanceof Error) {
      return `${message}: ${error.message}`;
    }

    return message;
  }
}
