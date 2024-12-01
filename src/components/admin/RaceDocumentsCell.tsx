import { Tables } from "@/integrations/supabase/types";
import { RaceDocumentThumbnail } from "./RaceDocumentThumbnail";

interface RaceDocumentsCellProps {
  documents: Tables<"race_documents">[];
  onDeleteDocument: (doc: Tables<"race_documents">) => void;
}

export const RaceDocumentsCell = ({ documents, onDeleteDocument }: RaceDocumentsCellProps) => {
  if (!documents?.length) {
    return "No documents";
  }

  return (
    <div className="flex gap-2">
      {documents.map((doc) => (
        <RaceDocumentThumbnail
          key={doc.id}
          doc={doc}
          onDelete={onDeleteDocument}
        />
      ))}
    </div>
  );
};