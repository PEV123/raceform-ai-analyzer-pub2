import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export const useClearRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log("Clearing all races...");
      
      // First, delete all race chats
      const { error: chatsError } = await supabase
        .from("race_chats")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (chatsError) {
        console.error("Error clearing race chats:", chatsError);
        throw chatsError;
      }
      console.log("Successfully cleared all race chats");

      // Then, delete all race documents
      const { error: docsError } = await supabase
        .from("race_documents")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (docsError) {
        console.error("Error clearing race documents:", docsError);
        throw docsError;
      }
      console.log("Successfully cleared all race documents");

      // Then, delete all runners
      const { error: runnersError } = await supabase
        .from("runners")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (runnersError) {
        console.error("Error clearing runners:", runnersError);
        throw runnersError;
      }
      console.log("Successfully cleared all runners");

      // Finally, delete all races
      const { error: racesError } = await supabase
        .from("races")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (racesError) {
        console.error("Error clearing races:", racesError);
        throw racesError;
      }
      console.log("Successfully cleared all races");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All races have been cleared",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error("Error clearing races:", error);
      toast({
        title: "Error",
        description: "Failed to clear races. Please try again.",
        variant: "destructive",
      });
    },
  });
};