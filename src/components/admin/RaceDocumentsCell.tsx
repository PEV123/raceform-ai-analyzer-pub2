import { Tables } from "@/integrations/supabase/types";
import { RaceDocumentThumbnail } from "./RaceDocumentThumbnail";

interface RaceDocumentsCellProps {
  documents: Tables<"race_documents">[];
  onDeleteDocument: (doc: Tables<"race_documents">) => void;
}

export const RaceDocumentsCell = ({ documents, onDeleteDocument }: RaceDocumentsCellProps) => {
  console.log('Rendering RaceDocumentsCell with documents:', documents);

  if (!documents?.length) {
    console.log('No documents to display');
    return "No documents";
  }

  return (
    <div className="flex gap-2">
      {documents.map((doc) => {
        console.log('Rendering thumbnail for document:', doc);
        return (
          <RaceDocumentThumbnail
            key={doc.id}
            doc={doc}
            onDelete={(doc) => {
              console.log('Delete triggered for document:', doc);
              onDeleteDocument(doc);
            }}
          />
        );
      })}
    </div>
  );
};