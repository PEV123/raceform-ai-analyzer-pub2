import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SearchResultsTable } from "./SearchResultsTable";

interface HorseNameSearchProps {
  onSelectHorse: (horseId: string) => void;
  onRawData: (data: any) => void;
}

export const HorseNameSearch = ({ onSelectHorse, onRawData }: HorseNameSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (horseName: string) => {
      console.log('Starting horse search for:', horseName);
      
      const { data, error } = await supabase.functions.invoke('fetch-horse-results', {
        body: { horseName },
      });

      if (error) throw error;
      console.log('Search results:', data);
      onRawData(data);
      return data.search_results || [];
    },
    onSuccess: (data) => {
      setSearchResults(data);
      if (data.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to search horses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter a horse name",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchTerm);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Search by Horse Name</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="Enter horse name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit"
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {searchResults.length > 0 && (
        <SearchResultsTable 
          results={searchResults}
          onViewResults={onSelectHorse}
        />
      )}
    </Card>
  );
};