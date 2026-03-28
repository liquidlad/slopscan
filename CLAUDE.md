@AGENTS.md

# SlopScan

## What This Is
Human-only social platform on Solana. A captcha.social competitor that actually blocks AI agents instead of just charging a fee.

## Stack
- Next.js 16.2, React 19, Tailwind CSS 4, TypeScript
- Solana wallet adapter (Phantom, Solflare)
- X OAuth 2.0 PKCE for sign-in and account auditing

## Project Structure
- `app/page.tsx` — Main app with full auth flow and feed
- `app/layout.tsx` — Root layout with Solana wallet providers
- `app/providers.tsx` — Solana ConnectionProvider + WalletProvider
- `app/globals.css` — Theme variables, animations, grid background
- `app/api/auth/twitter/route.ts` — X OAuth 2.0 initiation (PKCE)
- `app/api/auth/callback/route.ts` — X OAuth callback, token exchange, user fetch

## Auth Flow
1. User clicks "Sign In With X" → OAuth 2.0 PKCE redirect
2. Callback exchanges code for token, fetches user profile, stores in cookie
3. Animated 8-signal scan of X account (auto-approves for now)
4. Account creation with "Copy from X" option (name, username, bio, profile pic)
5. Feed with compose, wallet connect for posting

## Environment Variables (not committed)
- `TWITTER_CLIENT_ID` — X OAuth 2.0 Client ID
- `TWITTER_CLIENT_SECRET` — X OAuth 2.0 Client Secret
- `NEXT_PUBLIC_BASE_URL` — Base URL (http://localhost:3000 or https://slopscan.social)

## Deployment
- Vercel project: `slopscan`
- Domain: `slopscan.social`
- GitHub: `liquidlad/slopscan`
- DNS: A record → 76.76.21.21

## Token
- $SLOPSCAN on Solana
- Buy link: pump.fun/?q=slopscan

## Key Decisions
- Scan always auto-approves for now (layer 2 challenge and rejection logic exist but are bypassed)
- No database yet — session via cookies, posts in client state
- Human verification is the core differentiator vs captcha.social
