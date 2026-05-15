import { apiError, apiSuccess } from "@/lib/api/response";
import { BirdeyeClient, BirdeyeClientError } from "@/lib/birdeye/client";
import { assertValidWalletAddress } from "@/lib/validators/wallet";
import { parseTimeWindow } from "@/lib/validators/window";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletInput = url.searchParams.get("wallet");

  try {
    const wallet = assertValidWalletAddress(walletInput ?? "");
    const window = parseTimeWindow(url.searchParams.get("window"), "7d");
    const warnings: string[] = [];
    const birdeyeClient = new BirdeyeClient();

    const [summaryResult, detailsResult] = await Promise.allSettled([
      birdeyeClient.getWalletPnlSummary(wallet, window),
      birdeyeClient.getWalletPnlDetails(wallet, window),
    ]);

    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const details = detailsResult.status === "fulfilled" ? detailsResult.value : [];

    if (summaryResult.status === "rejected") {
      warnings.push(toWarning("PNL summary request failed", summaryResult.reason));
    }
    if (detailsResult.status === "rejected") {
      warnings.push(toWarning("PNL details request failed", detailsResult.reason));
    }

    if (!summary && details.length === 0) {
      return apiError(
        {
          code: "WALLET_PNL_UNAVAILABLE",
          message: "Both PNL summary and PNL details failed for this wallet.",
        },
        {
          warnings,
          freshness: { summary: "unknown", details: "unknown" },
          source: "Birdeye-derived",
        },
        502,
      );
    }

    return apiSuccess(
      {
        wallet,
        window,
        summary,
        details,
      },
      {
        warnings,
        freshness: {
          summary: summary ? "fresh" : "unknown",
          details: details.length > 0 ? "fresh" : "unknown",
        },
        source: "Birdeye-derived",
      },
    );
  } catch (error) {
    return apiError(
      {
        code: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Invalid request",
      },
      {
        freshness: { summary: "unknown", details: "unknown" },
        source: "AlphaTrace-derived",
      },
      400,
    );
  }
}

function toWarning(context: string, error: unknown): string {
  if (error instanceof BirdeyeClientError) {
    return `${context}: ${error.message} (${error.code})`;
  }

  if (error instanceof Error) {
    return `${context}: ${error.message}`;
  }

  return context;
}
