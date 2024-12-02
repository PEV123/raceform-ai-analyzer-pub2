import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const PageHeader = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const response = await fetch(
        "https://vlcrqrmqghskrdhhsgqt.supabase.co/functions/v1/cleanup-races",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cleanup races");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Cleaned up ${data.deletedRaces.length} duplicate races`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error("Cleanup error:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup races. Please make sure you're logged in.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Race Analysis</h1>
      <Button 
        onClick={() => cleanupMutation.mutate()}
        disabled={cleanupMutation.isPending}
      >
        {cleanupMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cleaning up...
          </>
        ) : (
          "Clean up duplicates"
        )}
      </Button>
    </div>
  );
};