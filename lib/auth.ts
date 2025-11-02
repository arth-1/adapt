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

  // If we have a valid Supabase token, verify and return the real user
  if (token && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        const { user } = data;
        return { id: user.id, email: user.email ?? undefined };
      }
    } catch {
      // fall through to dummy auth if enabled
    }
  }

  // Dummy auth bypass (for demos/production preview) when enabled
  if (process.env.DUMMY_AUTH_ENABLED === 'true') {
    const email = process.env.DUMMY_AUTH_EMAIL || 'tech4earthh@adapt.demo';
    // Stable demo id so data remains consistent across requests
    const id = process.env.DUMMY_AUTH_USER_ID || 'demo-user-0001';
    return { id, email };
  }

  return null;
}


