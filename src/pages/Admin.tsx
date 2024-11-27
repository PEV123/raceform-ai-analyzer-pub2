import { Card } from "@/components/ui/card";

const Admin = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <Card className="p-6">
        <p className="text-lg text-muted-foreground">
          Manage races, upload documents, and view AI analysis results
        </p>
      </Card>
    </div>
  );
};

export default Admin;