import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useRaceDocuments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteDocument = async (doc: Tables<"race_documents">) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('race_documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('race_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      // Refresh the races data
      queryClient.invalidateQueries({ queryKey: ["races"] });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  return {
    handleDeleteDocument,
  };
};