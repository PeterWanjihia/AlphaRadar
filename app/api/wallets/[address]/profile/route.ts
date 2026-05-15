import { apiError, apiSuccess } from "@/lib/api/response";
import { WalletProfileService } from "@/lib/services/walletProfileService";
import { assertValidWalletAddress } from "@/lib/validators/wallet";
import { parseTimeWindow } from "@/lib/validators/window";

type RouteParams = {
  params: Promise<{ address: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { address } = await context.params;
  const url = new URL(request.url);

  try {
    const wallet = assertValidWalletAddress(address);
    const window = parseTimeWindow(url.searchParams.get("window"), "7d");

    const walletProfileService = new WalletProfileService();
    const { profile, warnings, freshness } = await walletProfileService.buildWalletProfile(wallet, window);

    return apiSuccess(profile, {
      warnings,
      freshness,
      source: "AlphaTrace-derived",
    });
  } catch (error) {
    return apiError(
      {
        code: "WALLET_PROFILE_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Failed to build wallet profile",
      },
      {
        source: "AlphaTrace-derived",
        freshness: {
          summary: "unknown",
          pnlDetails: "unknown",
          netWorth: "unknown",
          holdings: "unknown",
          firstFunded: "unknown",
          metadata: "unknown",
        },
      },
      400,
    );
  }
}
