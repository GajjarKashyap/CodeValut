import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const origVersion = process.version;
try {
  Object.defineProperty(process, 'version', { value: 'v22.0.0', writable: true, configurable: true });
} catch (e) {}

const supabaseUrl = 'https://xuetoabqznzqpkgipbfk.supabase.co';
const supabaseKey = 'sb_publishable_4izfwy39fTMJrSR5cdUfdQ_GO9YZqVh';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    WebSocket: WebSocket
  }
});

try {
  Object.defineProperty(process, 'version', { value: origVersion, writable: true, configurable: true });
} catch (e) {}
