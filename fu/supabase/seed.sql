-- ============================================================
-- Seed data for local development
-- uid_hash values are SHA-256 of simple test strings:
--   piece 01: SHA-256("piece01") = actual hash below
--   piece 02: SHA-256("piece02") etc.
-- To test validate-tap, POST uid="piece01" for piece 01, etc.
-- ============================================================

-- Clear existing data
TRUNCATE golden_claims, wishes, scans, pieces CASCADE;

-- 18 pieces: 4 gold (01-04) + 14 regular (05-18)
INSERT INTO pieces (id, uid_hash, type, name, btc_address) VALUES
  ('01', 'e4a7e4190dda498898de88b3f8ea7e01a69a72798a62e02e11b3a75e8d580263', 'gold',    '青龙',       'bc1qdragon01placeholder'),
  ('02', '31fb0fc0730ea20f1a52a3bbe8e0891eb6dd58b89f64cd32acbe7aab4c763534', 'gold',    '白虎',       'bc1qphoenix02placeholder'),
  ('03', '94f41e75fc5e3e6e48ad4e0a61a06f64f43b4e1ebc0c92d24fac5e45e73ee8b5', 'gold',    '朱雀',       'bc1qqilin03placeholder'),
  ('04', 'f49c60a5c33e24ab3f2fbb34a9e6b7ae04a64a33f6e58fc5dc3a22cb7aa9b5a0', 'gold',    '玄武',       'bc1qcrane04placeholder'),
  ('05', '1f85d4a56a39db59e12e53f3a38c89b5c507fd3a22b71b04b20c9e8b35d5a6c8', 'regular', 'Peace',      'bc1qpeace05placeholder'),
  ('06', 'a8bdc3f2e5d94a7b60c1f83e29d5b6a4170e8f9c2d3b5a6478c1e0f9d2b3a4e5', 'regular', 'Fortune',    'bc1qfortune06placeholder'),
  ('07', 'b9ced4a3f6e05b8c71d2a94f30e6c7b5281f9a0d3e4c6b7589d2f1a0e3c4b5f6', 'regular', 'Harmony',    'bc1qharmony07placeholder'),
  ('08', 'c0dfe5b4a7f16c9d82e3b05a41f7d8c6392a0b1e4f5d7c8690e3a2b1f4d5c6a7', 'regular', 'Wisdom',     'bc1qwisdom08placeholder'),
  ('09', 'd1eaf6c5b8a27d0e93f4c16b52a8e9d74a3b1c2f5a6e8d97a1f4b3c2a5e6d7b8', 'regular', 'Spring',     'bc1qspring09placeholder'),
  ('10', 'e2fba7d6c9b38e1fa4a5d27c63b9f0e85b4c2d3a6b7f9e08b2a5c4d3b6f7e8c9', 'regular', 'Joy',        'bc1qjoy00010placeholder'),
  ('11', 'f3acb8e7d0c49f2ab5b6e38d74c0a1f96c5d3e4b7c8a0f19c3b6d5e4c7a8f9d0', 'regular', 'Blessing',   'bc1qblessing11placeholder'),
  ('12', 'a4bdc9f8e1d50a3bc6c7f49e85d1b2a07d6e4f5c8d9b1a20d4c7e6f5d8b9a0e1', 'regular', 'Virtue',     'bc1qvirtue12placeholder'),
  ('13', 'b5ced0a9f2e61b4cd7d8a50f96e2c3b18e7f5a6d9e0c2b31e5d8f7a6e9c0b1f2', 'regular', 'Prosperity', 'bc1qprosperity13placeholder'),
  ('14', 'c6dfe1b0a3f72c5de8e9b61a07f3d4c29f8a6b7e0f1d3c42f6e9a8b7f0d1c2a3', 'regular', 'Wealth',     'bc1qwealth14placeholder'),
  ('15', 'd7eaf2c1b4a83d6ef9f0c72b18a4e5d30a9b7c8f1a2e4d53a7f0b9c8a1e2d3b4', 'regular', 'Health',     'bc1qhealth15placeholder'),
  ('16', 'e8fba3d2c5b94e7fa0a1d83c29b5f6e41b0c8d9a2b3f5e64b8a1c0d9b2f3e4c5', 'regular', 'Love',       'bc1qlove0016placeholder'),
  ('17', 'f9acb4e3d6c05f8ab1b2e94d30c6a7f52c1d9e0b3c4a6f75c9b2d1e0c3a4f5d6', 'regular', 'Hope',       'bc1qhope0017placeholder'),
  ('18', 'a0bdc5f4e7d16a9bc2c3f05e41d7b8a63d2e0f1c4d5b7a86d0c3e2f1d4b5a6e7', 'regular', 'Grace',      'bc1qgrace018placeholder');

-- Initialize scan counters
INSERT INTO scans (piece_id, last_counter) VALUES
  ('01', 0), ('02', 0), ('03', 0), ('04', 0), ('05', 0), ('06', 0),
  ('07', 0), ('08', 0), ('09', 0), ('10', 0), ('11', 0), ('12', 0),
  ('13', 0), ('14', 0), ('15', 0), ('16', 0), ('17', 0), ('18', 0);

-- Sample wishes for testing
INSERT INTO wishes (piece_id, wish_text, sealed, display_type, created_at) VALUES
  ('01', 'Health and happiness for my family',  false, 'gold',    '2026-01-15T10:00:00Z'),
  ('05', 'Success in all my studies this year',  false, 'regular', '2026-01-20T08:00:00Z'),
  ('07', 'World peace and kindness for all',     false, 'regular', '2026-01-28T14:30:00Z'),
  ('02', null,                                   true,  'gold',    '2026-02-10T09:15:00Z');

-- Mark piece 02 as sealed (matches the sealed wish above)
UPDATE pieces SET sealed = true, sealed_wish_hash = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
WHERE id = '02';
-- ^ sealed_wish_hash is SHA-256("hello") — to test unseal, POST wishText="hello" for piece 02
