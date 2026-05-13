import { apiError, apiSuccess } from "@/lib/api/response";
import { getEnvHealth } from "@/lib/config/env";

export async function GET() {
  try {
    const env = getEnvHealth();

    return apiSuccess(
      {
        app: "AlphaTrace",
        ok: true,
        timestamp: new Date().toISOString(),
        env,
        version: process.env.npm_package_version ?? "0.1.0",
      },
      {
        source: "AlphaTrace-derived",
        freshness: { health: "fresh" },
      },
    );
  } catch (error) {
    return apiError(
      {
        code: "HEALTH_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Health check failed",
      },
      {
        freshness: { health: "unknown" },
        source: "AlphaTrace-derived",
      },
      500,
    );
  }
}
