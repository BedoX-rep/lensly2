
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase } from './client';

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  return data?.is_admin || false;
}

export async function updateSubscription(
  subscriptionId: string,
  data: {
    end_date?: string;
    subscription_type?: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
    status?: 'Active' | 'Suspended' | 'Cancelled';
  },
  notes?: string
) {
  if (!await isAdmin()) {
    throw new Error('Unauthorized');
  }

  const { data: oldSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !oldSub) {
    throw new Error('Subscription not found');
  }

  const { data: updatedSub, error: updateError } = await supabase
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
  const { error: auditError } = await supabase
    .from('subscription_audit_logs')
    .insert({
      subscription_id: subscriptionId,
      modified_by: (await supabase.auth.getUser()).data.user?.id,
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

export async function getSubscriptions() {
  if (!await isAdmin()) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user:user_id (
        email,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAuditLogs(subscriptionId?: string) {
  if (!await isAdmin()) {
    throw new Error('Unauthorized');
  }

  let query = supabase
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
