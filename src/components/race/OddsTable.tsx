import { Json } from "@/integrations/supabase/types";
import { formatInTimeZone } from 'date-fns-tz';

interface Odd {
  decimal: string;
  updated: string;
  ew_denom: string;
  bookmaker: string;
  ew_places: string;
  fractional: string;
}

interface OddsTableProps {
  odds?: Json;
}

export const OddsTable = ({ odds }: OddsTableProps) => {
  if (!odds || !Array.isArray(odds) || odds.length === 0) {
    return null;
  }

  // Convert odds array to properly typed array and sort by bookmaker name
  const typedOdds = odds
    .reduce<Odd[]>((acc, odd) => {
      if (
        typeof odd === 'object' &&
        odd !== null &&
        'bookmaker' in odd &&
        'decimal' in odd &&
        'updated' in odd &&
        'ew_denom' in odd &&
        'ew_places' in odd &&
        'fractional' in odd &&
        typeof odd.bookmaker === 'string' &&
        typeof odd.decimal === 'string' &&
        typeof odd.updated === 'string' &&
        typeof odd.ew_denom === 'string' &&
        typeof odd.ew_places === 'string' &&
        typeof odd.fractional === 'string'
      ) {
        acc.push({
          bookmaker: odd.bookmaker,
          decimal: odd.decimal,
          updated: odd.updated,
          ew_denom: odd.ew_denom,
          ew_places: odd.ew_places,
          fractional: odd.fractional
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.bookmaker.localeCompare(b.bookmaker));

  if (typedOdds.length === 0) {
    return null;
  }

  // Find Bet365 odds for last updated time
  const bet365Odds = typedOdds.find(odd => odd.bookmaker === 'Bet365');
  const lastUpdated = bet365Odds?.updated || typedOdds[0].updated;

  return (
    <div className="mt-4 space-y-2">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm divide-y divide-gray-200">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-2 py-1 text-left font-medium w-24 border-r">Bookmaker</th>
              {typedOdds.map((odd) => (
                <th key={odd.bookmaker} className="px-2 py-1 text-left font-medium border-r last:border-r-0">
                  <div className="h-20 flex items-end">
                    <span className="-rotate-270 origin-left translate-y-6 whitespace-nowrap text-xs">
                      {odd.bookmaker}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-2 py-1.5 font-medium border-r">Odds</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-decimal`} className="px-2 py-1.5 text-center border-r last:border-r-0">
                  {odd.decimal}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1.5 font-medium border-r">E/W Odds</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-ew`} className="px-2 py-1.5 text-center text-muted-foreground border-r last:border-r-0">
                  1/{odd.ew_denom}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1.5 font-medium border-r">E/W Places</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-places`} className="px-2 py-1.5 text-center text-muted-foreground border-r last:border-r-0">
                  {odd.ew_places}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Odds Subject to Change. Last updated: {formatInTimeZone(new Date(lastUpdated), 'Europe/London', 'PPpp')}
      </p>
    </div>
  );
};