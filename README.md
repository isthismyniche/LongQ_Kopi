# LongQ Kopi ☕

**A Singapore hawker stall drink game.** Take orders, make kopi, beat the queue.

🎮 [Play now](https://longqkopi.vercel.app)

---

## What Is This?

Singapore's kopi culture has its own rich vocabulary — *kopi-o*, *kopi-c gau*, *teh siu dai peng*... There are 44 distinct drink combinations and most people only know a handful. LongQ Kopi teaches you all of them under pressure.

You're the person behind the counter at a hawker stall. Customers queue up, call out their orders in Singlish, and you have seconds to get it right. Mess up or run out of time and you lose a life. Get it right and you score points and move up levels.

---

## Gameplay

### The Drink System

Every drink is built from four dimensions:

| Dimension | Options |
|---|---|
| **Base** | Kopi (coffee) or Teh (tea) |
| **Strength** | Standard / Po (light) / Gau (strong) / Di Lo (triple) |
| **Milk** | Condensed / Evaporated (C) / None (O) |
| **Sugar** | Full / Siu Dai (half) / Kosong (none) |
| **Temperature** | Hot / Peng (iced) |

44 possible combinations. You build each drink using counter buttons — add the base, choose milk, set sugar, add hot water, ice if needed — then serve.

### 5 Levels of Increasing Pressure

| Level | Name | Timer | Target | Queue | Notes |
|---|---|---|---|---|---|
| 1 | Morning Shift | 15s | 6 drinks | 2 | Basic drinks only — warm up |
| 2 | Breakfast Rush | 15s | 13 drinks | 3 | Adds Po, Siu Dai, Peng |
| 3 | Lunch Hour | 12s | 10 drinks | 4 | Full 44-drink pool unlocked |
| 4 | Tea Time | 8s | 10 drinks | 5 | Memory test begins |
| 5 | Supper Crowd | 6s | Endless | 6 | Survival mode, 2.5× multiplier |

**Scoring:** `(5 + seconds remaining) × level multiplier`. Faster = more points.

### The Regulars System

Three named regulars — Mr Rajan, Makcik Siti, Uncle Lim — appear throughout the game. In Levels 2–3 they visit for the first time and place a regular order. In Levels 4–5 they return and say *"the usual, please"* — with no drink specified. You have to remember what they had.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript, built with Vite
- Framer Motion for animations (page transitions, steam effects, modal springs)
- Tailwind CSS v4
- React Router v7

**Backend**
- Vercel serverless functions (API routes)
- Supabase (PostgreSQL) — leaderboard persistence, falls back to localStorage if unavailable
- Stripe — donation checkout in SGD via `/api/create-checkout-session`

**In-browser**
- `html2canvas` — generates the shareable score card image client-side
- Web Share API (with multi-step fallback: native share → text-only → clipboard copy)
- Web Crypto API — HMAC-SHA256 signing for score share links
- Howler.js — sound effects

**Deployment**
- Vercel, with SPA catch-all rewrite that excludes `/api/*` paths
- `.npmrc` with `legacy-peer-deps=true` for React 19 compatibility

---

## Architecture

```
src/
├── data/           # Game config: levels, drinks, regulars, reactions
│   ├── drinkMatrix.ts      # 22 base drinks, difficulty pools per level
│   ├── gameConfig.ts       # Level definitions, scoring constants
│   ├── regulars.ts         # 3 regular customers with personalities
│   └── reactions.ts        # 100 Singlish reactions, shuffled to avoid repeats
│
├── hooks/
│   ├── useGameState.ts     # Core game logic (~420 lines): timer, scoring,
│   │                       #   cup state, order validation, level progression
│   └── useTimer.ts         # Precise interval timer using Date.now()
│
├── pages/          # Route-level components
│   ├── Landing.tsx         # Main menu + About/Support modals
│   ├── Game.tsx            # Game loop orchestration + keyboard shortcuts
│   ├── Leaderboard.tsx     # Top 10 scores from Supabase
│   ├── HowToPlay.tsx       # Drink reference + Singlish guide
│   └── Settings.tsx        # Sound and keyboard toggles
│
├── components/game/
│   ├── Counter.tsx         # Drink preparation buttons
│   ├── CustomerQueue.tsx   # Active customer + queue preview
│   ├── HUD.tsx             # Score / lives / timer bar
│   ├── GameOverModal.tsx   # End screen: score, share, leaderboard save
│   └── ErrorExplanation.tsx # Shows exactly what was wrong in a failed order
│
└── utils/
    ├── orderValidation.ts  # Validates cup contents against order
    ├── scoreSignature.ts   # HMAC-SHA256 score URL signing
    ├── shareScore.ts       # Share flow with Web Share API fallbacks
    └── leaderboard.ts      # Supabase read/write + localStorage fallback

api/
└── create-checkout-session.ts  # Vercel function: Stripe SGD checkout
```

---

## How It Was Built

Product design, game concept, and requirements: me.
Code: [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant.

---

## Running Locally

```bash
npm install
cp .env.example .env   # fill in Supabase + Stripe keys (optional)
npm run dev
```

The game runs fully without any environment variables — Supabase and Stripe integrations are optional.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel / `.env` | Leaderboard database |
| `VITE_SUPABASE_ANON_KEY` | Vercel / `.env` | Supabase auth |
| `VITE_SCORE_SECRET` | Vercel / `.env` | HMAC key for score URL signing |
| `STRIPE_SECRET_KEY` | Vercel only | Donation checkout (server-side) |

---

*Free to play. Open source. Built with love for Singapore's kopi culture.*
