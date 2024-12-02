import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { RaceAnalysis } from "@/components/analysis/RaceAnalysis";
import { RaceList } from "@/pages/Analysis/components/RaceList";
import { PageHeader } from "@/pages/Analysis/components/PageHeader";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DocumentUploadDialog } from "@/components/admin/DocumentUploadDialog";
import { RaceDocumentsCell } from "@/components/admin/RaceDocumentsCell";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useRaceDocuments } from "@/components/admin/hooks/useRaceDocuments";

const Analysis = () => {
  const { raceId } = useParams();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { handleDeleteDocument } = useRaceDocuments();

  const { data: race } = useQuery({
    queryKey: ["race", raceId],
    enabled: !!raceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*)
        `)
        .eq("id", raceId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (!raceId) {
    return (
      <div>
        <PageHeader isAdmin />
        <RaceList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin AI Analysis</h1>
      </div>

      {race?.race_documents?.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Race Documents</h2>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>
          <RaceDocumentsCell
            documents={race.race_documents}
            onDeleteDocument={handleDeleteDocument}
          />
        </Card>
      )}

      {!race?.race_documents?.length && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Race Documents</h2>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">No documents uploaded yet.</p>
        </Card>
      )}

      <RaceAnalysis raceId={raceId} />

      <DocumentUploadDialog
        race={race}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </div>
  );
};

export default Analysis;