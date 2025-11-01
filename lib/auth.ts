import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';


export type AuthUser = {
  id: string;
  email?: string;
};

// Extracts the Supabase access token from Authorization header or cookies
export function getAccessToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7);
  }
  const cookie = req.cookies.get('sb-access-token');
  return cookie?.value || null;
}

// Verifies the token with Supabase and returns the authenticated user
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = getAccessToken(req);
  if (!token || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
  const { user } = data;
  return { id: user.id, email: user.email ?? undefined };
  } catch {
    return null;
  }
}


