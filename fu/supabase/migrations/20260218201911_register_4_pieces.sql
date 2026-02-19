-- Register 4 real NFC chips (fresh start)
-- Clears all scans/wishes, then sets real UID hashes
--
-- Gold 01 (青龙):  04:40:82:BA:DA:1B:91
-- Gold 02 (白虎):  04:34:82:BA:DA:1B:91
-- Regular 05 (Peace):   04:18:82:BA:DA:1B:91
-- Regular 06 (Fortune): 04:3C:82:BA:DA:1B:91

-- Clear existing state
DELETE FROM golden_claims;
DELETE FROM wishes;
DELETE FROM scans;

-- Update UID hashes for the 4 registered pieces
UPDATE pieces SET uid_hash = 'c5bee19e6a9e195a064e84415ad2f6443ebcf612beb884677e246e4d2de8e017',
                  sealed = false, sealed_wish_hash = NULL
WHERE id = '01';

UPDATE pieces SET uid_hash = '514575e62922cb6a0a3fda46c29b55916e05184e567dd6ed94abb6966ea9fb96',
                  sealed = false, sealed_wish_hash = NULL
WHERE id = '02';

UPDATE pieces SET uid_hash = '936e04effde6b1609ec44f160e90a338c0f298a216f593bdc29e7e259eee872e',
                  sealed = false, sealed_wish_hash = NULL
WHERE id = '05';

UPDATE pieces SET uid_hash = '8a2ed2cbba79096bb580f5795414f966fca9922255a5029c5ed9ec84ec598e20',
                  sealed = false, sealed_wish_hash = NULL
WHERE id = '06';
