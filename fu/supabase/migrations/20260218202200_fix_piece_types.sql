-- Fix piece types: ensure gold pieces are marked as gold
UPDATE pieces SET type = 'gold' WHERE id IN ('01', '02', '03', '04');
