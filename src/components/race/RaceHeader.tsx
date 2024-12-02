import { formatInTimeZone } from 'date-fns-tz';

interface RaceHeaderProps {
  race: any;
  raceTime: string;
}

export const RaceHeader = ({ race, raceTime }: RaceHeaderProps) => {
  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold">{race.race_name}</h3>
          <p className="text-lg">{race.course}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{raceTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
        <div>
          <p><span className="font-medium">Class:</span> {race.race_class}</p>
          <p><span className="font-medium">Age:</span> {race.age_band}</p>
        </div>
        <div>
          <p><span className="font-medium">Rating Band:</span> {race.rating_band}</p>
          <p><span className="font-medium">Prizemoney:</span> {race.prize}</p>
        </div>
        <div>
          <p><span className="font-medium">Going:</span> {race.going}</p>
          <p><span className="font-medium">Surface:</span> {race.surface}</p>
        </div>
        <div>
          <p><span className="font-medium">Type:</span> {race.type}</p>
          <p><span className="font-medium">Distance:</span> {race.distance}</p>
        </div>
      </div>
    </div>
  );
};