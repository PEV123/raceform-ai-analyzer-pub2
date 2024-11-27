import { AdminSettings } from "@/components/admin/AdminSettings";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";

const Admin = () => {
  const { data: races, isLoading } = useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*)
        `)
        .order('off_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <AdminSettings />
        </div>
        
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Race Documents</h2>
            {isLoading ? (
              <p>Loading races...</p>
            ) : !races?.length ? (
              <p>No races found.</p>
            ) : (
              <RaceList races={races} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;