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

  const bet365Odds = typedOdds.find(odd => odd.bookmaker === 'Bet365');
  const lastUpdated = bet365Odds?.updated || typedOdds[0].updated;

  return (
    <div className="mt-4 space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm divide-y divide-gray-200">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-2 py-1 text-left font-medium w-24 border-r">
                  Bookmaker
                </th>
                {typedOdds.map((odd) => (
                  <th 
                    key={odd.bookmaker} 
                    className="px-2 py-1 text-left font-medium border-r last:border-r-0"
                    style={{ width: '40px', minWidth: '40px' }}
                  >
                    <div className="h-[120px] relative">
                      <span 
                        className="absolute origin-bottom-left -rotate-90 whitespace-nowrap"
                        style={{ 
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(-90deg)',
                          transformOrigin: 'bottom left',
                          marginBottom: '10px'
                        }}
                      >
                        {odd.bookmaker}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 font-medium border-r">
                  Odds
                </td>
                {typedOdds.map((odd) => (
                  <td key={`${odd.bookmaker}-decimal`} className="px-2 py-1.5 text-center border-r last:border-r-0">
                    {odd.decimal}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 font-medium border-r">
                  E/W Odds
                </td>
                {typedOdds.map((odd) => (
                  <td key={`${odd.bookmaker}-ew`} className="px-2 py-1.5 text-center text-muted-foreground border-r last:border-r-0">
                    1/{odd.ew_denom}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 font-medium border-r">
                  E/W Places
                </td>
                {typedOdds.map((odd) => (
                  <td key={`${odd.bookmaker}-places`} className="px-2 py-1.5 text-center text-muted-foreground border-r last:border-r-0">
                    {odd.ew_places}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Odds Subject to Change. Last updated: {formatInTimeZone(new Date(lastUpdated), 'Europe/London', 'PPpp')}
      </p>
    </div>
  );
};