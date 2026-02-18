-- Register real NFC UID hash for piece 01 (青龙)
-- Chip: NTAG213, Serial: 04:40:82:BA:DA:1B:91
-- SHA-256("044082BADA1B91") = c5bee19e...
UPDATE pieces
SET uid_hash = 'c5bee19e6a9e195a064e84415ad2f6443ebcf612beb884677e246e4d2de8e017'
WHERE id = '01';
