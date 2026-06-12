# Circle Fund

Circle Fund is a premium, secure, decentralized Web3 Grant Funding and Milestone Tracker protocol designed to streamline proposal workflows, funding allocations, and milestone claims for builders and communities.

## Features

- **Decentralized Profiles**: Connected with Web3 wallets (RainbowKit & Wagmi).
- **Proposal Ecosystem**: Seamless creation, submission, and management of grant funding proposals.
- **Milestone-Based Releases**: Smart distribution where funds are unlocked incrementally upon approved milestones.
- **Interactive Discussions & Polling**: Support for community discussions, comments, and voting elements.
- **Admin Dashboard**: Comprehensive moderation interface for managing proposal status flows.
- **Production Integration**: Robust backend powered by Supabase with secure, server-verified action layers to ensure maximum precision and RLS consistency.

## Prerequisites

- **Node.js**: v18 or later
- **Pnpm / Npm / Yarn**: Package manager
- **Supabase**: Relational database framework
- **WalletConnect**: Project ID for secure wallet connection interface

## Environment Setup

Create a `.env` file in the root directory and define the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_JWT_SECRET="YOUR_SUPABASE_JWT_SECRET"

# Web3 Configuration
VITE_WALLETCONNECT_PROJECT_ID="YOUR_WALLETCONNECT_PROJECT_ID"
ADMIN_WALLET="0x27545eB2be12eAF146CaAB5f2436FC933AfA57a5"
VITE_APP_ENTRY_URL="/app"
```

## Running the Application Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

3. **Build Core Production Assets**:
   ```bash
   npm run build
   ```

4. **Start Production Host**:
   ```bash
   npm run start
   ```

## Security Design

All operations are guarded on the database level. Direct writes to sensitive states of proposals, funding limits, or milestones are validated through custom database rules or routed securely via full-stack verifying API endpoints on the server side using the secure Node backend.
