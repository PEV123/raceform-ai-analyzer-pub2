import { Tables } from "@/integrations/supabase/types";
import { RaceDocumentThumbnail } from "./RaceDocumentThumbnail";
import { Button } from "@/components/ui/button";

export interface RaceDocumentsCellProps {
  documents: Tables<"race_documents">[];
  onUploadDocs: () => void;
  onDeleteDocument: (doc: Tables<"race_documents">) => void;
}

export const RaceDocumentsCell = ({
  documents = [], // Provide default empty array
  onUploadDocs,
  onDeleteDocument,
}: RaceDocumentsCellProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={onUploadDocs}>
          Upload Document
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {documents?.map((doc) => (
          <RaceDocumentThumbnail
            key={doc.id}
            doc={doc}
            onDelete={() => onDeleteDocument(doc)}
          />
        ))}
      </div>
    </div>
  );
};