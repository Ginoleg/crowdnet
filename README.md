## Crowdnet — Permissionless Prediction Market (PoC)

CrowdBet is a proof of concept for a permissionless prediction market, built for the [Aleph Hackathon on DoraHacks](https://dorahacks.io/hackathon/aleph-hackathon/detail).

This repository showcases a minimal, end-to-end flow for creating and trading on prediction markets with a modern web stack (Next.js 14, TypeScript, TailwindCSS, and Supabase).

### Quick start

- **Prerequisites**

  - **Node.js**: v18+ (LTS recommended)
  - **Package manager**: npm, pnpm, or yarn

- **Install dependencies**

```bash
npm install
# or
yarn
# or
pnpm install
```

- **Environment variables**
  1. Copy the example env file and create your local env file:

```bash
cp .example.env .env.local
```

2. Open `.env.local` and replace the placeholder values:
   - **SUPABASE_PUBLISHABLE_KEY**: Your Supabase anon/public key (safe for client use)
   - **SUPABASE_SECRET_KEY**: Your Supabase service role key (server-only; never exposed to the client)
   - **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL (starts with `https://`)
   - **SESSION_SECRET**: A long random string used to sign sessions. Generate one with:

```bash
openssl rand -hex 32
```

- **APP_DOMAIN**: App domain for callbacks (e.g. `localhost:3000` for local dev)
- **APP_ORIGIN**: Full origin (e.g. `http://localhost:3000`)
- **AI_GATEWAY_API_KEY**: Optional; only needed if you enable AI-powered features

- **Run the app**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit `http://localhost:3000` to get started.

### Scripts

- **dev**: Start the development server
- **build**: Build the production bundle
- **start**: Start the production server (after build)

### Notes

- **Secrets**: `.env.local` is gitignored by default. Do not commit secrets.
- **Server-only keys**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep service keys server-only.

### Learn more

- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- TailwindCSS docs: https://tailwindcss.com/docs
