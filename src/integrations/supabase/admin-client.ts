import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase admin credentials');
}

export const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Admin-specific functions
export async function updateSubscriptionAsAdmin(subscriptionId: string, data: any) {
  const { data: subscription, error } = await adminClient
    .from('subscriptions')
    .update(data)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return subscription;
}

export async function getSubscriptionsAsAdmin() {
  const { data, error } = await adminClient
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAuditLogsAsAdmin(subscriptionId?: string) {
  let query = adminClient
    .from('subscription_audit_logs')
    .select(`
      *,
      modified_by_user:modified_by (
        email
      )
    `)
    .order('action_timestamp', { ascending: false });

  if (subscriptionId) {
    query = query.eq('subscription_id', subscriptionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}