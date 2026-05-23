import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options: any = {}) => {
      const token = localStorage.getItem('supabase_token');
      if (token) {
        // Instantiate/ensure options.headers is structured optimally
        const headers: Record<string, string> = {};
        
        if (options.headers) {
          if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (typeof options.headers.forEach === 'function') {
            options.headers.forEach((value: string, key: string) => {
              headers[key] = value;
            });
          } else if (typeof options.headers === 'object') {
            Object.assign(headers, options.headers);
          }
        }
        
        headers['Authorization'] = `Bearer ${token}`;
        options.headers = headers;
      }
      return fetch(url, options);
    },
  },
});
