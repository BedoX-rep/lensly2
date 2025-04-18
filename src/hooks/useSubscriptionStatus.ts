
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useSubscriptionStatus(userId: string | undefined) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const checkSubscription = async () => {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('end_date, user_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (subscription) {
        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        setDaysRemaining(diffDays);
        setHoursRemaining(diffHours);

        if (diffTime <= 0) {
          toast.error('Your subscription has expired');
          await supabase.auth.signOut();
          navigate('/login');
        } else if (diffDays <= 2) {
          toast.warning(`Subscription expires in ${diffDays} days and ${diffHours} hours`);
        }
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [userId, navigate]);

  return { daysRemaining, hoursRemaining };
}
