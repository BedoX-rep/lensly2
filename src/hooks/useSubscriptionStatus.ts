
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Hook for individual user subscription status
export function useSubscriptionStatus(userId: string | undefined) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const checkSubscription = async () => {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('end_date, subscription_type')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (subscription) {
        setSubscription(subscription);
        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        
        if (diffTime <= 0) {
          toast.error('Your subscription has expired');
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        setDaysRemaining(diffDays);
        setHoursRemaining(diffHours);

        if (diffDays <= 2) {
          toast.warning(`Subscription expires in ${diffDays} days and ${diffHours} hours`);
        }
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [userId, navigate]);

  return { daysRemaining, hoursRemaining, subscription };
}

// Global subscription checker
export function useGlobalSubscriptionChecker() {
  useEffect(() => {
    const checkAllSubscriptions = async () => {
      const { data: expiredSubscriptions, error } = await supabase
        .from('subscriptions')
        .select('user_id, end_date')
        .lt('end_date', new Date().toISOString());

      if (error) {
        console.error('Error checking subscriptions:', error);
        return;
      }

      if (expiredSubscriptions) {
        for (const subscription of expiredSubscriptions) {
          try {
            // Force sign out and clear all session data
            await supabase.auth.signOut();
            // Clear any cached auth state
            window.localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token');
            // Force page reload to clear any remaining state
            window.location.reload();
          } catch (error) {
            console.error('Error signing out user:', error);
          }
        }
      }
    };

    checkAllSubscriptions();
    const interval = setInterval(checkAllSubscriptions, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, []);
}
