import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * No-op proxy that silently returns empty results when Supabase is not configured.
 * Prevents blank page crashes while making the misconfiguration visible in console.
 */
function createNoopClient(): SupabaseClient {
  const noop = () => {
    console.warn('[Supabase] Client not configured — query skipped.');
    const chain: any = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      upsert: () => chain,
      delete: () => chain,
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      like: () => chain,
      ilike: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    };
    return chain;
  };

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'from') return noop;
      if (prop === 'auth') return {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      };
      if (prop === 'channel') return () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
      });
      return () => {};
    },
  });
}

let supabaseInstance: SupabaseClient;

if (supabaseUrl && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey || '', {
      global: {
        fetch: async (url, options: any = {}) => {
          const token = localStorage.getItem('supabase_token');
          if (token && token !== 'undefined' && token !== 'null' && token.startsWith('eyJ')) {
            const headers: Record<string, string> = {};

            if (options.headers) {
              if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                  headers[key.toLowerCase()] = value;
                });
              } else if (typeof options.headers.forEach === 'function') {
                options.headers.forEach((value: string, key: string) => {
                  headers[key.toLowerCase()] = value;
                });
              } else if (typeof options.headers === 'object') {
                for (const [key, value] of Object.entries(options.headers)) {
                  if (value !== undefined && value !== null) {
                    headers[key.toLowerCase()] = String(value);
                  }
                }
              }
            }

            headers['authorization'] = `Bearer ${token}`;
            options.headers = headers;
          }
          return fetch(url, options);
        },
      },
    });
  } catch (e) {
    console.error('[Supabase] Failed to initialize client:', e);
    supabaseInstance = createNoopClient();
  }
} else {
  console.warn('[Supabase] VITE_SUPABASE_URL not configured. Database features are disabled.');
  supabaseInstance = createNoopClient();
}

export const supabase = supabaseInstance;

export function isUserAdmin(): boolean {
  try {
    const token = localStorage.getItem('supabase_token');
    if (!token || token === 'undefined' || token === 'null' || !token.startsWith('eyJ')) {
      return false;
    }
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return !!payload.admin;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return false;
  }
}
