const REQUIRED_ENV_VARS = ["BIRDEYE_API_KEY", "BIRDEYE_BASE_URL", "DEFAULT_CHAIN"] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

type AppEnv = {
  BIRDEYE_API_KEY: string;
  BIRDEYE_BASE_URL: string;
  DEFAULT_CHAIN: string;
  ADMIN_REFRESH_SECRET?: string;
  NODE_ENV: string;
  APP_NAME: string;
  APP_VERSION: string;
};

function getMissingEnvVars(): RequiredEnvVar[] {
  return REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !process.env[key]?.trim());
}

export function getEnv(): AppEnv {
  const missing = getMissingEnvVars();

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY!,
    BIRDEYE_BASE_URL: process.env.BIRDEYE_BASE_URL!,
    DEFAULT_CHAIN: process.env.DEFAULT_CHAIN!,
    ADMIN_REFRESH_SECRET: process.env.ADMIN_REFRESH_SECRET,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    APP_NAME: "AlphaTrace",
    APP_VERSION: process.env.npm_package_version ?? "0.1.0",
  };
}

export function getEnvHealth() {
  const missing = getMissingEnvVars();

  return {
    loaded: missing.length === 0,
    missing,
    required: [...REQUIRED_ENV_VARS],
  };
}
