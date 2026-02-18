-- Reset scan record for piece 01 so UID-only validation works
-- (previous record had counter=0 which blocked re-taps)
DELETE FROM scans WHERE piece_id = '01';
