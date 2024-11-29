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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium w-24">Bookmaker</th>
              {typedOdds.map((odd) => (
                <th key={odd.bookmaker} className="px-2 py-1 text-left font-medium">
                  <div className="h-24 flex items-end">
                    <span className="-rotate-90 origin-left translate-y-8 whitespace-nowrap">
                      {odd.bookmaker}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 font-medium">Odds</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-decimal`} className="px-2 py-1 font-medium">
                  {odd.decimal}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1 font-medium">E/W Odds</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-ew`} className="px-2 py-1 text-muted-foreground">
                  1/{odd.ew_denom}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1 font-medium">E/W Places</td>
              {typedOdds.map((odd) => (
                <td key={`${odd.bookmaker}-places`} className="px-2 py-1 text-muted-foreground">
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