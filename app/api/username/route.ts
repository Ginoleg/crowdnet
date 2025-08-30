import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase/server-client';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

function readToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  const cookie = req.headers.get('cookie') || '';
  const part = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('session='));
  return part ? part.split('=')[1] : null;
}

export async function GET(req: Request) {
  const token = readToken(req);
  if (!token) return new Response('unauthorized', { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    userId = String(payload['app.user_id']);
    if (!userId) throw new Error('no user id');
  } catch {
    return new Response('unauthorized', { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('app_user')
    .select('username')
    .eq('id', userId)
    .limit(1);

  if (error) return new Response('db error', { status: 500 });

  return Response.json({
    username: data?.[0]?.username ?? null,
  });
}
