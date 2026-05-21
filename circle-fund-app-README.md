# Circle Fund App

The functional side of the Circle Fund protocol. Built with Vite, React, RainbowKit, and Supabase.

## Prerequisites
- Node.js environment
- Supabase project
- WalletConnect Project ID

## Environment Variables
Create a `.env` file containing:
- `VITE_SUPABASE_URL`: Your Supabase REST URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_WALLETCONNECT_PROJECT_ID`: ID for RainbowKit wallet connection
- `VITE_ADMIN_WALLET`: The wallet address of the admin (e.g., `0x27545eB2be12eAF146CaAB5f2436FC933AfA57a5`)

## Features Implemented
- [x] Wallet Connection (RainbowKit)
- [x] User Profile
- [x] Dashboard
- [x] Active Proposals View
- [x] Submit Proposal Form
- [x] Milestone Tracker & Claim Simulation
- [x] Proposal Browsing (Explore)
- [x] Voting and Comments 
- [x] Protected Admin Panel

## Running
Start via Vite: `npm run dev`
