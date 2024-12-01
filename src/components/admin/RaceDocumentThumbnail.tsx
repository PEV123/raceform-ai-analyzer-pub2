import { X } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

interface RaceDocumentThumbnailProps {
  doc: Tables<"race_documents">;
  onDelete: (doc: Tables<"race_documents">) => void;
}

export const RaceDocumentThumbnail = ({ doc, onDelete }: RaceDocumentThumbnailProps) => {
  const imageUrl = `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`;

  return (
    <div className="relative group">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            <img
              src={imageUrl}
              alt={doc.file_name}
              className="w-8 h-8 object-cover rounded"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="w-auto p-0">
          <img
            src={imageUrl}
            alt={doc.file_name}
            className="max-w-[300px] max-h-[300px] object-contain rounded"
          />
        </HoverCardContent>
      </HoverCard>
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={() => onDelete(doc)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};