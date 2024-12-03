import { supabase } from "@/integrations/supabase/client";

export const saveOddsHistory = async (runnerId: string, odds: any[]) => {
  const { error } = await supabase
    .from("odds_history")
    .insert({
      runner_id: runnerId,
      odds: odds
    });

  if (error) {
    console.error("Error saving odds history:", error);
    throw error;
  }
};

export const processOddsUpdate = async (
  existingRunner: any, 
  newOdds: any[]
): Promise<boolean> => {
  const hasOddsChanged = JSON.stringify(existingRunner.odds) !== JSON.stringify(newOdds);
  
  if (hasOddsChanged) {
    await saveOddsHistory(existingRunner.id, newOdds);
  }
  
  return hasOddsChanged;
};