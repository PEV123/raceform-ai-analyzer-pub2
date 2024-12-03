import { supabase } from "@/integrations/supabase/client";
import { saveOddsHistory } from "@/services/oddsHistory";

export const updateExistingRunner = async (existingRunner: any, runner: any) => {
  console.log(`Updating existing runner: ${runner.horse_id}`);
  
  const nonRunnerUpdate = existingRunner.is_non_runner !== runner.is_non_runner;
  let oddsUpdate = false;

  // Check if odds have changed
  if (JSON.stringify(existingRunner.odds) !== JSON.stringify(runner.odds)) {
    await saveOddsHistory(existingRunner.id, runner.odds);
    oddsUpdate = true;
  }

  const { error: updateError } = await supabase
    .from("runners")
    .update({
      is_non_runner: runner.is_non_runner,
      odds: runner.odds
    })
    .eq("id", existingRunner.id);

  if (updateError) {
    console.error("Error updating runner:", updateError);
    throw updateError;
  }

  return { nonRunnerUpdate, oddsUpdate };
};

export const insertNewRunner = async (runnerData: any) => {
  console.log(`Inserting new runner:`, runnerData);
  
  const { error: insertError } = await supabase
    .from("runners")
    .insert(runnerData);

  if (insertError) {
    console.error(`Error inserting new runner ${runnerData.horse_id}:`, insertError);
    throw insertError;
  }

  console.log(`Successfully inserted new runner: ${runnerData.horse}`);
};