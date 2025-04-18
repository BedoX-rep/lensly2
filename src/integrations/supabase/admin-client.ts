
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase admin credentials');
}

export const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function updateSubscription(
  subscriptionId: string,
  data: {
    end_date?: string;
    subscription_type?: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
    status?: 'Active' | 'Suspended' | 'Cancelled';
  },
  notes?: string
) {
  const { data: oldSub } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (!oldSub) {
    throw new Error('Subscription not found');
  }

  const { data: updatedSub, error: updateError } = await adminClient
    .from('subscriptions')
    .update({
      end_date: data.end_date || oldSub.end_date,
      subscription_type: data.subscription_type || oldSub.subscription_type,
      status: data.status || oldSub.status,
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Create audit log
  const { error: auditError } = await adminClient
    .from('subscription_audit_logs')
    .insert({
      subscription_id: subscriptionId,
      modified_by: (await adminClient.auth.getUser()).data.user?.id,
      previous_status: oldSub.status,
      new_status: updatedSub.status,
      previous_end_date: oldSub.end_date,
      new_end_date: updatedSub.end_date,
      previous_type: oldSub.subscription_type,
      new_type: updatedSub.subscription_type,
      notes
    });

  if (auditError) throw auditError;

  return updatedSub;
}

export async function getSubscriptions(query = '') {
  const { data, error } = await adminClient
    .from('subscriptions')
    .select(`
      *,
      users:user_id (
        email,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAuditLogs(subscriptionId?: string) {
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
