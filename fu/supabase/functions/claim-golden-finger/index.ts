import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifySessionToken } from '../_shared/session.ts';

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
    const { pieceId, sessionToken } = await req.json();
    if (!pieceId || !sessionToken) {
      return jsonResp({ error: 'Missing params' }, 400);
    }

    if (!(await verifySessionToken(sessionToken, pieceId))) {
      return jsonResp({ error: 'Invalid session' }, 403);
    }

    const db = createServiceClient();

    // Verify piece is gold type
    const { data: piece } = await db
      .from('pieces')
      .select('id, type')
      .eq('id', pieceId)
      .single();

    if (!piece || piece.type !== 'gold') {
      return jsonResp({ error: 'Not a gold piece' }, 403);
    }

    // Generate signed claim token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const claimId = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const secret = Deno.env.get('SESSION_SECRET')!;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`golden:${pieceId}:${claimId}`),
    );
    const sigHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `${claimId}.${sigHex}`;

    // Store in golden_claims
    await db.from('golden_claims').insert({
      piece_id: pieceId,
      token,
    });

    return jsonResp({
      token,
      redirect_url: 'https://fu-mocha.vercel.app',
    });
  } catch (_err) {
    return jsonResp({ error: 'Internal error' }, 500);
  }
});
