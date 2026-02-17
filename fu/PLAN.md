# Fu (福) — Project Plan

## What Is This
18 physical resin pieces with handwritten 福 characters, gold powder, and NFC chips sealed inside. Each piece is a passable red envelope that accumulates wishes AND Bitcoin value as it's passed between people.

---

## Core Mechanic: Seal / Unseal

Each piece has two states:

```
UNSEALED ──(NFC tap + write wish)──→ SEALED ──(re-enter wish correctly)──→ UNSEALED
```

- **Unsealed:** The piece can accept a new wish from the next NFC tapper.
- **Sealed:** A wish is locked in. No new wishes can be written until the wish-writer unseals it by re-entering their wish correctly.

The wish text acts as a **password** — only the person who wrote it can unseal the piece.

---

## Access Rules

| Visitor type | Animation | Wish history | Write wish | BTC address | Unseal | 金手指 |
|---|---|---|---|---|---|---|
| URL only (no NFC) | Yes | Yes | **No** | No | No | No |
| NFC tap, piece unsealed | Yes | Yes | **Yes** | After wishing | After wishing | Gold only |
| NFC tap, piece sealed | Yes | Yes | **No** | No | No | No |

---

## Wish History Display

- **Old wishes** (unsealed/revealed): full text visible in timeline
- **Current sealed wish**: text hidden, shows as a special entry (e.g. "✦ A sacred wish has been sealed")
- **Gold piece sealed wish**: extra-special styling (e.g. "★ A golden wish has been sealed")
- Wishes are revealed in history only after the piece is unsealed

---

## NFC Tap Flow (detailed)

```
1. User taps NFC on physical piece
2. Phone opens: underwater008.github.io/fu/?p=01&uid=04A23B7C2F1234&ctr=000042
3. JS reads URL params → POST to Supabase Edge Function (validate-tap)
4. Edge Function: hash UID, check against registered piece, check ctr > last_seen
5. JS cleans URL → history.replaceState → address bar shows ?p=01 only
6. Edge Function returns: { valid, piece_type, sealed, session_token }

IF piece is UNSEALED:
  7a. Show wish input form
  8a. User writes a wish → POST to Edge Function (seal-wish)
  9a. Wish is stored (hidden), piece state → SEALED
  10a. Show:
       - Bitcoin wallet public address (receive-only)
       - "Unseal & Pass On" button
       - 金手指 button (gold pieces only)

  UNSEAL FLOW:
  11a. User taps "Unseal" → re-enter wish text
  12a. POST to Edge Function (unseal) → compare wish hash
  13a. Match → piece state → UNSEALED, wish text revealed in history
  14a. Physical piece can now be passed to next person

IF piece is SEALED:
  7b. Show read-only view (animation + wish history)
  8b. No wish form, no unseal (only the writer can unseal)

IF no NFC (URL only):
  7c. Show read-only view (animation + wish history from all pieces)
  8c. No wish form, no special features
```

---

## Bitcoin Wallets

- **18 separate wallets**, one per piece
- Public address shown to NFC tapper after writing a wish
- Money stays with the piece — passed on, never withdrawable
- Anyone can send more BTC into it (the piece accumulates value over time)
- **Private key sealed inside the resin** (printed slip under NFC chip) — only destroying the piece reveals the key

---

## Two-System Architecture

### Plan A — This Folder (`/fu/`)
- **Hosted:** GitHub Pages at `underwater008.github.io/fu/`
- **Purpose:** NFC landing page → wish timeline → seal/unseal wishes → BTC display
- Single page reads URL params: `?p=XX&uid=...&ctr=...`
- Valid NFC tap on unsealed piece → write wish → seal → show BTC + unseal button
- Valid NFC tap on sealed piece → read-only
- No NFC (URL only) → read-only (animation + wish history)
- 4 gold pieces additionally show 金手指 button after wishing

### Plan B — Gacha Game (separate repo)
- **Repo:** `github.com/Underwater008/fu`
- **Hosted:** Vercel at `fu-mocha.vercel.app`
- **Purpose:** Fortune gacha draw experience
- Receives 金手指 claim tokens from Plan A → grants draw counts

### Backend — Supabase (shared)
- Shared Supabase project for both Plan A and Plan B

#### Tables
```sql
pieces (
  id              TEXT PRIMARY KEY,   -- '01' to '18'
  uid_hash        TEXT NOT NULL,      -- SHA-256 of NFC UID
  type            TEXT NOT NULL,      -- 'regular' | 'gold'
  name            TEXT,               -- display name / theme
  btc_address     TEXT,               -- public wallet address
  sealed          BOOLEAN DEFAULT FALSE,
  sealed_wish_hash TEXT,              -- SHA-256 of sealed wish (for unseal verification)
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

scans (
  piece_id        TEXT REFERENCES pieces(id),
  last_counter    INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ DEFAULT NOW()
)

wishes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id        TEXT REFERENCES pieces(id),
  wish_text       TEXT,               -- NULL while sealed (stored as hash only)
  sealed          BOOLEAN DEFAULT TRUE,
  display_type    TEXT DEFAULT 'regular', -- 'regular' | 'gold'
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

golden_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id        TEXT REFERENCES pieces(id),
  token           TEXT NOT NULL,
  claimed_at      TIMESTAMPTZ DEFAULT NOW(),
  redeemed        BOOLEAN DEFAULT FALSE
)
```

#### Edge Functions
1. **`validate-tap`** — validates NFC UID hash + counter, returns piece state
2. **`seal-wish`** — stores wish hash, sets piece to sealed
3. **`unseal`** — verifies wish text against hash, unseals piece, reveals wish in history
4. **`claim-golden-finger`** — generates signed token for Plan B (gold pieces only)

---

## Physical Hardware
- **Chip:** NXP NTAG213 (144 bytes user memory, 7-byte UID, 24-bit counter)
- **Features enabled:** UID mirror + counter mirror, password lock
- **NFC URL format:** `underwater008.github.io/fu/?p=XX&uid=XXXXXXXXXXXXXX&ctr=XXXXXX`
- **BTC private key:** printed slip sealed inside resin alongside NFC chip
- 18 chips total: 14 regular + 4 gold 横批

## Security Model
1. **NFC UID** — factory-burned, unique per chip, can't be cloned
2. **Counter** — increments on every physical tap, can't be reset; validated as `ctr > last_seen` (gaps OK)
3. **Server-side validation** — Edge Functions check UID hash + counter (invisible even though repo is public)
4. **URL cleaning** — JS strips `uid` and `ctr` from address bar immediately (`history.replaceState`)
5. **Wish-as-password** — wish text hashed server-side, only hash stored while sealed; original text never stored until unsealed
6. **RLS** — anyone can read wish history; only validated NFC taps can write/seal/unseal

---

## What's Already Built
- Full 3D animation pipeline (Canvas 2D + Three.js WebGL)
- State machine: arrival → draw → fortune → fireworks
- Calligraphy 福 with glow, particle burst, 大吉 cluster, font morphing
- Fireworks particle system
- Touch/mouse/keyboard input, tooltips
- Envelope UI panels exist in HTML (panel-start, panel-wish, panel-result) but logic is incomplete

## Build Checklist
- [ ] Read URL params (?p, &uid, &ctr) and call validate-tap Edge Function
- [ ] Clean URL with history.replaceState after reading params
- [ ] Set up Supabase schema (pieces, scans, wishes, golden_claims)
- [ ] Set up RLS policies
- [ ] Build Edge Function: `validate-tap` (UID hash + counter check)
- [ ] Build Edge Function: `seal-wish` (store wish hash, seal piece)
- [ ] Build Edge Function: `unseal` (verify wish, reveal text, unseal piece)
- [ ] Build Edge Function: `claim-golden-finger` (token for Plan B)
- [ ] Build wish timeline UI (show history, hidden sealed wishes with special styling)
- [ ] Build wish input form (only shown to validated NFC tappers on unsealed pieces)
- [ ] Build post-wish screen (BTC address display + Unseal button + 金手指 for gold)
- [ ] Build unseal flow (re-enter wish → verify → unseal)
- [ ] Program 18 NFC chips (UID mirror, counter mirror, password lock)
- [ ] Generate 18 BTC wallets, record public addresses in Supabase
- [ ] Print private keys, seal inside resin with NFC chips
- [ ] Register 18 UID hashes + BTC addresses in Supabase pieces table
- [ ] Test full flow: tap → validate → wish → seal → unseal → pass on
