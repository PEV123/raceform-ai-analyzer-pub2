import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { formatInTimeZone } from 'date-fns-tz';
import { OddsDisplay } from "./OddsDisplay";

interface RaceCardProps {
  race: Tables<"races"> & {
    runners: Tables<"runners">[];
  };
  timezone: string;
}

export const RaceCard = ({ race, timezone }: RaceCardProps) => {
  const lbsToStone = (lbs: number) => {
    const stone = Math.floor(lbs / 14);
    const remainder = lbs % 14;
    return `${stone}-${remainder}`;
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {formatInTimeZone(new Date(race.off_time), timezone, 'HH:mm')} {race.course}
          </h2>
          <h3 className="text-xl">{race.race_name}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm">
            {race.region} | {race.race_class} | {race.age_band} | {race.rating_band}
          </p>
          <p className="text-sm">
            Prize {race.prize} - {race.field_size} run
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {race.runners?.map((runner) => (
          <div
            key={runner.horse_id}
            className="flex items-center gap-4 p-4 bg-muted rounded-lg"
          >
            <div className="w-8 text-center">
              <div className="font-bold">{runner.number}</div>
              <div className="text-sm">({runner.draw})</div>
            </div>
            {runner.silk_url && (
              <img src={runner.silk_url} alt="Silk" className="w-12 h-12" />
            )}
            <div className="flex-1">
              <h4 className="font-bold">{runner.horse}</h4>
              <p className="text-sm">
                {runner.sire} ({runner.sire_region}) | {runner.dam} ({runner.dam_region})
              </p>
              <p className="text-sm">Form: {runner.form || 'N/A'}</p>
            </div>
            <div className="text-sm">
              <p>wgt: {lbsToStone(runner.lbs)}</p>
              <p>hg: {runner.headgear || 'None'}</p>
            </div>
            <div className="text-sm">
              <p>ofr: {runner.ofr || 'N/A'}</p>
              <p>ts: {runner.ts || 'N/A'}</p>
            </div>
            <div className="text-sm">
              <p>J: {runner.jockey}</p>
              <p>T: {runner.trainer}</p>
            </div>
            <OddsDisplay odds={runner.odds} />
          </div>
        ))}
      </div>
    </Card>
  );
};