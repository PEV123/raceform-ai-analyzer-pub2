import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  membershipLevel: string;
}

export const useCreateUser = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUser = async (userData: CreateUserData) => {
    setIsLoading(true);

    try {
      console.log("Creating user with email:", userData.email);
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
      });

      if (error) {
        console.error("Error response:", error);
        throw error;
      }

      console.log("User creation response:", data);

      toast({
        title: "Success",
        description: "User created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { createUser, isLoading };
};