import { X, FileText } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

export interface RaceDocumentThumbnailProps {
  doc: Tables<"race_documents">;
  onDelete: (doc: Tables<"race_documents">) => void;
}

export const RaceDocumentThumbnail = ({ doc, onDelete }: RaceDocumentThumbnailProps) => {
  console.log('Rendering RaceDocumentThumbnail for document:', doc);
  
  const imageUrl = `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`;
  console.log('Image URL:', imageUrl);

  const handleDelete = () => {
    console.log('Delete button clicked for document:', doc);
    onDelete(doc);
  };

  const isPDF = doc.content_type === 'application/pdf';

  return (
    <div className="relative group">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            {isPDF ? (
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={doc.file_name}
                className="w-8 h-8 object-cover rounded"
              />
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="w-auto p-0">
          {isPDF ? (
            <div className="p-4">
              <p className="text-sm font-medium">{doc.file_name}</p>
              <a 
                href={imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                View PDF
              </a>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={doc.file_name}
              className="max-w-[300px] max-h-[300px] object-contain rounded"
            />
          )}
        </HoverCardContent>
      </HoverCard>
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        onClick={handleDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};