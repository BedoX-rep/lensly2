
import { useEffect, useState } from 'react';
import { getAllSubscriptions, updateSubscriptionStatus } from '@/integrations/supabase/queries';
import { Subscription } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/lib/auth-config';

export default function Admin() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const data = await getAllSubscriptions();
    setSubscriptions(data);
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    if (!user?.id) return;
    await updateSubscriptionStatus(subscriptionId, newStatus as any, user.id);
    await loadSubscriptions();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{(subscription as any).users?.email}</TableCell>
                  <TableCell>{new Date(subscription.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(subscription.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{subscription.subscription_type}</TableCell>
                  <TableCell>{subscription.subscription_status}</TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => handleStatusChange(subscription.id, value)}
                      defaultValue={subscription.subscription_status}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
