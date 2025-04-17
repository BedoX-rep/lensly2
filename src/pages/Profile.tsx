
import { useAuth } from "@/lib/auth-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Email</label>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="font-medium">ID</label>
              <p className="text-muted-foreground">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
