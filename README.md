# AlphaTrace

AlphaTrace is a Solana wallet intelligence product built on Birdeye data.
It identifies profitable wallets, composes wallet profile read models, and prepares smart-money signal infrastructure.
This repository currently implements milestones through ticket 2.6 (foundation, Birdeye integration, and wallet profile backend API).

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Fill in `BIRDEYE_API_KEY`, `BIRDEYE_BASE_URL`, and `DEFAULT_CHAIN`.
3. Run `npm run dev`.

## Implemented API Endpoints

- `GET /api/health`
- `GET /api/debug/wallet-pnl?wallet=<address>&window=7d`
- `GET /api/wallets/:address/profile?window=7d`
