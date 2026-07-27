import crypto from 'crypto';
import { supabase } from './supabase.js';

/**
 * Calculates today's deterministic daily passkey locally using pure MD5.
 */
export function calculateTodayPasskey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const hash = crypto.createHash('md5').update(`${dateStr}CODEVAULT_DAILY_LAB_KEY`).digest('hex').toUpperCase();
  return `CV-${hash.substring(0, 6)}`;
}

/**
 * Fetches today's passkey from Supabase if available, or falls back to local calculation.
 */
export async function getTodayPasskey() {
  try {
    const { data, error } = await supabase.rpc('get_today_passkey');
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Fallback if RPC not applied locally
  }
  return calculateTodayPasskey();
}
