
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.user) {
      // Check if user has any subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (subError?.code === 'PGRST116' || !subscription) {
        // Create trial subscription if none exists
        const newSubscription = await createTrialSubscription(data.user.id);
        if (!newSubscription) {
          console.error('Failed to create trial subscription');
        }
      }
    }
    
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

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
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
