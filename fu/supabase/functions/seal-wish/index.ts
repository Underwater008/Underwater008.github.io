import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifySessionToken } from '../_shared/session.ts';
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
    const { pieceId, wishText, sessionToken } = await req.json();
    if (!pieceId || !wishText || !sessionToken) {
      return jsonResp({ success: false, error: 'Missing params' }, 400);
    }

    if (!(await verifySessionToken(sessionToken, pieceId))) {
      return jsonResp({ success: false, error: 'Invalid session' }, 403);
    }

    const db = createServiceClient();

    // Check piece exists and is not already sealed
    const { data: piece } = await db
      .from('pieces')
      .select('id, type, sealed')
      .eq('id', pieceId)
      .single();

    if (!piece) {
      return jsonResp({ success: false, error: 'Piece not found' }, 404);
    }

    if (piece.sealed) {
      return jsonResp({ success: false, error: 'Already sealed' }, 409);
    }

    // Hash wish text
    const wishHash = await sha256Hex(wishText);

    // Atomically seal the piece — WHERE sealed=false prevents race condition
    const { data: updated } = await db
      .from('pieces')
      .update({ sealed: true, sealed_wish_hash: wishHash })
      .eq('id', pieceId)
      .eq('sealed', false)
      .select('id');

    if (!updated || updated.length === 0) {
      return jsonResp({ success: false, error: 'Already sealed' }, 409);
    }

    // Insert wish row — text stays NULL while sealed (hash is the proof)
    await db.from('wishes').insert({
      piece_id: pieceId,
      wish_text: null,
      sealed: true,
      display_type: piece.type,
    });

    return jsonResp({ success: true });
  } catch (_err) {
    return jsonResp({ success: false, error: 'Internal error' }, 500);
  }
});
