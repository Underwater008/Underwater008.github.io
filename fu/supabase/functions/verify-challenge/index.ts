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

    const { data: piece } = await db
      .from('pieces')
      .select('id, sealed, sealed_wish_hash')
      .eq('id', pieceId)
      .single();

    if (!piece || !piece.sealed) {
      return jsonResp({ success: false, error: 'Not sealed' }, 400);
    }

    const enteredHash = await sha256Hex(wishText);

    if (enteredHash !== piece.sealed_wish_hash) {
      return jsonResp({ success: false, error: 'Wish mismatch' }, 403);
    }

    // Verify only — no DB mutation
    return jsonResp({ success: true });
  } catch (_err) {
    return jsonResp({ success: false, error: 'Internal error' }, 500);
  }
});
