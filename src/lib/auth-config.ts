
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error('Auth error:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

async function checkSubscriptionStatus(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  if (!data) return false;

  const now = new Date();
  const endDate = new Date(data.end_date);
  const isActive = endDate > now && data.is_active;

  if (!isActive && data.is_active) {
    // Update subscription status to inactive
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);
  }

  return isActive;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        const subscriptionStatus = await checkSubscriptionStatus();
        setHasActiveSubscription(!!subscriptionStatus);
      } else {
        setHasActiveSubscription(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    logout: signOut
  };
}
