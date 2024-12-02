import { supabase } from "@/integrations/supabase/client";

export const saveOddsHistory = async (runnerId: string, odds: any) => {
  console.log('Saving odds history for runner:', runnerId, odds);
  
  try {
    const { error } = await supabase
      .from('odds_history')
      .insert({
        runner_id: runnerId,
        odds: odds
      });

    if (error) {
      console.error('Error saving odds history:', error);
      throw error;
    }

    console.log('Successfully saved odds history');
  } catch (error) {
    console.error('Error in saveOddsHistory:', error);
    throw error;
  }
};

export const getOddsHistory = async (runnerId: string) => {
  console.log('Fetching odds history for runner:', runnerId);
  
  try {
    const { data, error } = await supabase
      .from('odds_history')
      .select('*')
      .eq('runner_id', runnerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching odds history:', error);
      throw error;
    }

    console.log('Fetched odds history:', data);
    return data;
  } catch (error) {
    console.error('Error in getOddsHistory:', error);
    throw error;
  }
};