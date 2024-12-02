import { X } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

interface RaceDocumentThumbnailProps {
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

  const handleImageError = () => {
    console.error('Error loading image:', {
      fileName: doc.file_name,
      filePath: doc.file_path
    });
  };

  return (
    <div className="relative group">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            <img
              src={imageUrl}
              alt={doc.file_name}
              className="w-8 h-8 object-cover rounded"
              onError={handleImageError}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="w-auto p-0">
          <img
            src={imageUrl}
            alt={doc.file_name}
            className="max-w-[300px] max-h-[300px] object-contain rounded"
            onError={handleImageError}
          />
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