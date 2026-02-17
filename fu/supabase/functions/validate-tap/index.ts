import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { createSessionToken } from '../_shared/session.ts';
import { sha256Hex } from '../_shared/hash.ts';

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { pieceId, uid, ctr } = await req.json();
    if (!pieceId || !uid || ctr === undefined) {
      return jsonResp({ valid: false, error: 'Missing params' }, 400);
    }

    const uidHash = await sha256Hex(uid);
    const db = createServiceClient();

    // Look up piece
    const { data: piece, error: pieceErr } = await db
      .from('pieces')
      .select('id, uid_hash, type, sealed, btc_address')
      .eq('id', pieceId)
      .single();

    if (pieceErr || !piece) {
      return jsonResp({ valid: false, error: 'Piece not found' }, 404);
    }

    // Compare UID hash
    if (piece.uid_hash !== uidHash) {
      return jsonResp({ valid: false, error: 'UID mismatch' }, 403);
    }

    // Check counter (anti-replay) — NFC counter is hex in URL
    const counter = parseInt(ctr, 16);
    const { data: scan } = await db
      .from('scans')
      .select('last_counter')
      .eq('piece_id', pieceId)
      .single();

    if (scan && counter <= scan.last_counter) {
      return jsonResp({ valid: false, error: 'Replay detected' }, 403);
    }

    // Update scan counter
    await db.from('scans').upsert({
      piece_id: pieceId,
      last_counter: counter,
      last_scanned_at: new Date().toISOString(),
    });

    // Generate session token
    const session_token = await createSessionToken(pieceId);

    return jsonResp({
      valid: true,
      piece_type: piece.type,
      sealed: piece.sealed,
      btc_address: piece.btc_address,
      session_token,
    });
  } catch (_err) {
    return jsonResp({ valid: false, error: 'Internal error' }, 500);
  }
});
