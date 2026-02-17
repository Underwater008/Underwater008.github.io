-- ============================================================
-- Plan A: Fu (福) Red Envelope — Schema
-- Tables for NFC-linked physical pieces with wish seal/unseal
-- ============================================================

-- 18 physical pieces
CREATE TABLE pieces (
  id              TEXT PRIMARY KEY,                    -- '01' to '18'
  uid_hash        TEXT NOT NULL UNIQUE,                -- SHA-256 of NFC UID
  type            TEXT NOT NULL DEFAULT 'regular'      -- 'regular' | 'gold'
                  CHECK (type IN ('regular', 'gold')),
  name            TEXT,                                -- display name / theme
  btc_address     TEXT,                                -- public wallet address
  sealed          BOOLEAN NOT NULL DEFAULT FALSE,
  sealed_wish_hash TEXT,                               -- SHA-256 of sealed wish text
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track NFC scan counter per piece (anti-replay)
CREATE TABLE scans (
  piece_id        TEXT PRIMARY KEY REFERENCES pieces(id),
  last_counter    INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wish history
CREATE TABLE wishes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id        TEXT NOT NULL REFERENCES pieces(id),
  wish_text       TEXT,                                -- NULL while sealed
  sealed          BOOLEAN NOT NULL DEFAULT TRUE,
  display_type    TEXT NOT NULL DEFAULT 'regular'      -- 'regular' | 'gold'
                  CHECK (display_type IN ('regular', 'gold')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 金手指 claim tokens (gold pieces only)
CREATE TABLE golden_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id        TEXT NOT NULL REFERENCES pieces(id),
  token           TEXT NOT NULL UNIQUE,
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed        BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_wishes_piece_id ON wishes(piece_id);
CREATE INDEX idx_wishes_created_at ON wishes(created_at DESC);
CREATE INDEX idx_golden_claims_token ON golden_claims(token);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_claims ENABLE ROW LEVEL SECURITY;

-- Pieces: anyone can read, no direct writes (Edge Functions use service role)
CREATE POLICY "pieces_read" ON pieces FOR SELECT USING (true);

-- Scans: no public access (Edge Functions only)
-- (no policy = denied for anon)

-- Wishes: anyone can read unsealed wishes, sealed wishes show as entry but no text
CREATE POLICY "wishes_read" ON wishes FOR SELECT USING (true);

-- Golden claims: no public read (Edge Functions verify tokens server-side)
-- (no policy = denied for anon)
