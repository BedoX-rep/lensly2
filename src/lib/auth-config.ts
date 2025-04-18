
import { supabase } from '@/integrations/supabase/client';
import { createTrialSubscription } from '@/integrations/supabase/queries';
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.user) {
      try {
        // Check if user has any subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (subError?.code === 'PGRST116' || !subscription) {
          // No subscription found, create trial
          await createTrialSubscription(data.user.id);
        } else {
          // Check if subscription is expired
          const currentDate = new Date();
          const endDate = new Date(subscription.end_date);
          
          if (currentDate > endDate) {
            // Subscription expired
            const subscriptionError = { message: 'Your subscription has expired. Please renew to continue.' };
            await supabase.auth.signOut();
            return { data: null, error: subscriptionError };
          }
        }
      } catch (error) {
        console.error('Subscription check error:', error);
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

  const checkSubscription = async (userId: string) => {
    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError?.code === 'PGRST116' || !subscription) {
        await createTrialSubscription(userId);
        return true;
      }

      const currentDate = new Date();
      const endDate = new Date(subscription.end_date);
      
      if (currentDate > endDate) {
        await supabase.auth.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Subscription check error:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkSessionAndSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const isSubscriptionValid = await checkSubscription(session.user.id);
        setIsAuthenticated(isSubscriptionValid);
        setUser(isSubscriptionValid ? session.user : null);
        setSession(isSubscriptionValid ? session : null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
      }
      
      setIsLoading(false);
    };

    checkSessionAndSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isSubscriptionValid = await checkSubscription(session.user.id);
        setIsAuthenticated(isSubscriptionValid);
        setUser(isSubscriptionValid ? session.user : null);
        setSession(isSubscriptionValid ? session : null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
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
