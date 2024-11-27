import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const HorseResults = () => {
  // Using a valid horse ID from the Racing API
  const [horseId, setHorseId] = useState("64e33c0d-9776-4b8f-8db7-c9f97e08d573");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHorseResults = async () => {
    try {
      setLoading(true);
      console.log("Fetching horse results for ID:", horseId);
      
      const response = await fetch(
        "https://vlcrqrmqghskrdhhsgqt.supabase.co/functions/v1/fetch-horse-results",
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsY3Jxcm1xZ2hza3JkaGhzZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2ODU2NTcsImV4cCI6MjA0ODI2MTY1N30.DDpFswiG9PgZqeQZIA5KSS_k8sIzRKg4A3Wj-n7xkIU`,
          },
          body: JSON.stringify({ horseId })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        // Extract the error message from the response
        const errorMessage = data.error || 'Failed to fetch horse results';
        throw new Error(errorMessage);
      }

      console.log("Horse results data:", data);
      setResults(data);
      toast.success("Horse results fetched successfully");
    } catch (error) {
      console.error("Error fetching horse results:", error);
      // Show the specific error message to the user
      toast.error(error.message || "Failed to fetch horse results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Horse Results Lookup</h2>
      <div className="flex gap-4 mb-4">
        <Input
          value={horseId}
          onChange={(e) => setHorseId(e.target.value)}
          placeholder="Enter Horse ID"
          className="flex-1"
        />
        <Button 
          onClick={fetchHorseResults}
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch Results"}
        </Button>
      </div>
      
      {results && (
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <pre className="text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </ScrollArea>
      )}
    </Card>
  );
};