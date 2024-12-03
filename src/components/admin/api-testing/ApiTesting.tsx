import { Card } from "@/components/ui/card";
import { HorseDistanceAnalysis } from "./HorseDistanceAnalysis";
import { RaceProAnalysis } from "./RaceProAnalysis";
import { HorseResultsAnalysis } from "./HorseResultsAnalysis";
import { RacecardsAnalysis } from "./RacecardsAnalysis";

export const ApiTesting = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">API Testing Tools</h2>
      <div className="space-y-6">
        <RacecardsAnalysis />
        <HorseDistanceAnalysis />
        <HorseResultsAnalysis />
        <RaceProAnalysis />
      </div>
    </Card>
  );
};