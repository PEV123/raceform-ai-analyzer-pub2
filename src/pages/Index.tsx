import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Runner {
  horse_id: string;
  number: number;
  draw: number;
  horse: string;
  silk_url: string;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form: string;
  lbs: number;
  headgear: string;
  ofr: string;
  ts: string;
  jockey: string;
  trainer: string;
}

interface Race {
  off_time: string;
  course: string;
  race_name: string;
  region: string;
  race_class: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: number;
  runners: Runner[];
}

const RaceCard = ({ race }: { race: Race }) => {
  const lbsToStone = (lbs: number) => {
    const stone = Math.floor(lbs / 14);
    const remainder = lbs % 14;
    return `${stone}-${remainder}`;
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{race.off_time} {race.course}</h2>
          <h3 className="text-xl">{race.race_name}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm">{race.region} | {race.race_class} | {race.age_band} | {race.rating_band}</p>
          <p className="text-sm">Prize {race.prize} - {race.field_size} run</p>
        </div>
      </div>
      <div className="space-y-4">
        {race.runners.map((runner) => (
          <div key={runner.horse_id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="w-8 text-center">
              <div className="font-bold">{runner.number}</div>
              <div className="text-sm">({runner.draw})</div>
            </div>
            <img src={runner.silk_url} alt="Silk" className="w-12 h-12" />
            <div className="flex-1">
              <h4 className="font-bold">{runner.horse}</h4>
              <p className="text-sm">{runner.sire} ({runner.sire_region}) | {runner.dam} ({runner.dam_region})</p>
              <p className="text-sm">Form: {runner.form}</p>
            </div>
            <div className="text-sm">
              <p>wgt: {lbsToStone(runner.lbs)}</p>
              <p>hg: {runner.headgear}</p>
            </div>
            <div className="text-sm">
              <p>ofr: {runner.ofr}</p>
              <p>ts: {runner.ts}</p>
            </div>
            <div className="text-sm">
              <p>J: {runner.jockey}</p>
              <p>T: {runner.trainer}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const Index = () => {
  const { data: races, isLoading } = useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      // This is where we'll integrate with the Racing API
      // For now, return mock data
      return [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Today's Races</h1>
      {races?.map((race: Race) => (
        <RaceCard key={`${race.course}-${race.off_time}`} race={race} />
      ))}
    </div>
  );
};

export default Index;