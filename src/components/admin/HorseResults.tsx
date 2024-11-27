import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";

export const HorseResults = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (horseName: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const response = await fetch(
        "https://api.theracingapi.com/v1/horses/search",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${process.env.RACING_API_USERNAME}:${process.env.RACING_API_PASSWORD}`)}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search horses");
      }

      const data = await response.json();
      console.log('Search results:', data);
      return data.search_results;
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
    onError: (error) => {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search horses. Please try again.",
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
      <h2 className="text-xl font-semibold mb-4">Horse Search</h2>
      
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead>Dam</TableHead>
              <TableHead>Dam Sire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map((horse) => (
              <TableRow key={horse.id}>
                <TableCell>{horse.name}</TableCell>
                <TableCell>{horse.sire}</TableCell>
                <TableCell>{horse.dam}</TableCell>
                <TableCell>{horse.damsire}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};