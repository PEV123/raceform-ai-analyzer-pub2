import { AdminSettings } from "@/components/admin/AdminSettings";
import ImportRaces from "@/components/admin/ImportRaces";
import { HorseResults } from "@/components/admin/HorseResults";
import { ApiTesting } from "@/components/admin/api-testing/ApiTesting";
import { UserList } from "@/components/admin/users/UserList";
import { MembershipLevels } from "@/components/admin/membership/MembershipLevels";
import { useAdmin } from "@/hooks/useAdmin";
import { useSession } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { isAdmin, isLoading } = useAdmin();
  const session = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    if (!isLoading && !isAdmin) {
      console.log('User is not an admin, redirecting...');
      navigate('/');
    }
  }, [session, isAdmin, isLoading, navigate]);

  if (!session || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="races">Race Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          <UserList />
        </TabsContent>

        <TabsContent value="membership" className="space-y-6">
          <MembershipLevels />
        </TabsContent>
        
        <TabsContent value="races" className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <ImportRaces />
            <HorseResults />
            <ApiTesting />
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;