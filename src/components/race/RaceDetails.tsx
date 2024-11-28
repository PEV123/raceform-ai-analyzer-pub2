import { Card } from "@/components/ui/card";
import { formatInTimeZone } from 'date-fns-tz';
import { ResultsTable } from "@/components/admin/horse-results/ResultsTable";
import { Tables } from "@/integrations/supabase/types";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

interface RaceDetailsProps {
  race: Race;
  timezone: string;
  historicalResults: any[];
}

export const RaceDetails = ({ race, timezone, historicalResults }: RaceDetailsProps) => {
  const formatDateTime = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      timezone,
      'PPpp'
    );
  };

  const getHorseResults = (horseId: string) => {
    return historicalResults?.filter(result => result.horse_id === horseId) || [];
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">{race.race_name}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Class:</span> {race.race_class}</p>
              <p><span className="font-medium">Distance:</span> {race.distance}</p>
              <p><span className="font-medium">Going:</span> {race.going}</p>
            </div>
            <div>
              <p><span className="font-medium">Prize:</span> {race.prize}</p>
              <p><span className="font-medium">Age Band:</span> {race.age_band}</p>
              <p><span className="font-medium">Rating Band:</span> {race.rating_band}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {race.runners?.map((runner) => (
            <Card key={runner.id} className="p-4">
              <div className="flex items-start gap-4">
                {runner.silk_url && (
                  <img
                    src={runner.silk_url}
                    alt={`${runner.jockey}'s silks`}
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-bold">{runner.horse}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({runner.age}yo {runner.sex})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {runner.jockey} • {runner.trainer}
                  </p>
                  <div className="text-sm">
                    <p><span className="font-medium">Weight:</span> {runner.lbs}lbs</p>
                    <p><span className="font-medium">Draw:</span> {runner.draw}</p>
                    {runner.ofr && (
                      <p><span className="font-medium">Official Rating:</span> {runner.ofr}</p>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Recent Form</h4>
                    <ResultsTable results={getHorseResults(runner.horse_id)} />
                  </div>

                  {runner.comment && (
                    <p className="mt-4 text-sm italic">{runner.comment}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};