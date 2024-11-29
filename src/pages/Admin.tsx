import { AdminSettings } from "@/components/admin/AdminSettings";
import ImportRaces from "@/components/admin/ImportRaces";
import { HorseResults } from "@/components/admin/HorseResults";
import { ApiTesting } from "@/components/admin/api-testing/ApiTesting";

const Admin = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <ImportRaces />
          <AdminSettings />
          <HorseResults />
          <ApiTesting />
        </div>
      </div>
    </div>
  );
};

export default Admin;