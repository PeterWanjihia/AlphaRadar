const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaWalletAddress(address: string): boolean {
  return SOLANA_ADDRESS_REGEX.test(address.trim());
}

export function assertValidWalletAddress(address: string): string {
  const normalized = address.trim();

  if (!normalized) {
    throw new Error("Wallet address is required.");
  }

  if (!isValidSolanaWalletAddress(normalized)) {
    throw new Error("Invalid Solana wallet address format.");
  }

  return normalized;
}
