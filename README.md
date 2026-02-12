# 👁️ Wallet Watcher

A real-time cryptocurrency wallet monitoring app built with React and Supabase.

![Etherscan-inspired UI](https://img.shields.io/badge/Design-Etherscan%20Inspired-21325b) ![React](https://img.shields.io/badge/React-18-61dafb) ![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e) ![Vite](https://img.shields.io/badge/Build-Vite-646cff)

## Features

- **Wallet Watchlist** — Monitor multiple Ethereum wallet addresses with live-updating balances
- **Auto-Refresh** — Configurable refresh intervals (2s, 5s, 7s, 10s, 12s, 15s)
- **Balance Tracking** — Green ▲ / Red ▼ indicators show real-time balance direction
- **Wallet Detail View** — Transaction history, token holdings, and overview stats
- **Add / Edit / Delete** — Full CRUD operations with address validation
- **Address Privacy** — Blurred address masking with reveal toggle
- **Sort & Order** — Toggle watchlist ordering by balance (High→Low / Low→High)
- **Alerts** — Configurable alert notifications for balance changes
- **Historical Snapshots** — Portfolio value recorded over time for future dashboard
- **Dual Storage** — Supabase (production) with local storage fallback

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/wallet-watcher.git
cd wallet-watcher

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000` with local storage by default.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the **SQL Editor**
3. Copy your Project URL and anon key from **Settings → API**
4. Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Restart the dev server — you'll see 🟢 **DB Connected** in the top bar

## Database Schema

| Table | Purpose |
|---|---|
| `wallets` | Current watchlist (address, label, chain, balances) |
| `tokens` | Token holdings per wallet |
| `snapshots` | Portfolio-level time series |
| `wallet_snapshots` | Per-wallet value at each snapshot |
| `token_snapshots` | Per-token price/value at each snapshot |

## Deploy

### Vercel
```bash
npm run build
# Deploy the `dist/` folder
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables
```

### Netlify
```bash
npm run build
# Deploy `dist/` folder, set env vars in site settings
```

## Project Structure

```
wallet-watcher/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── supabase/
│   └── schema.sql          # Database schema (run in Supabase SQL Editor)
└── src/
    ├── main.jsx            # React entry point
    └── WalletWatcher.jsx   # Main app component (~1100 lines)
```

## Tech Stack

- **Frontend:** React 18, Vite, inline CSS (Etherscan.io design)
- **Database:** Supabase (PostgreSQL) with REST API
- **Fonts:** Roboto, Roboto Mono (Google Fonts)
- **Storage:** Dual-mode (Supabase + local storage fallback)

## License

MIT
