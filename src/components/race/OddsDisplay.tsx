interface Odd {
  is_best: boolean;
  decimal: number;
}

interface OddsDisplayProps {
  odds?: Json;
  type?: 'best' | 'general';
}

export const OddsDisplay = ({ odds, type = 'best' }: OddsDisplayProps) => {
  // If no odds data, return dash
  if (!odds || !Array.isArray(odds) || !odds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Convert odds array to properly typed array
  const typedOdds = odds.reduce<Odd[]>((acc, odd) => {
    // Skip any invalid odds entries
    if (
      typeof odd === 'object' && 
      odd !== null && 
      'is_best' in odd && 
      'decimal' in odd &&
      typeof odd.is_best === 'boolean' &&
      typeof odd.decimal === 'number'
    ) {
      acc.push(odd as Odd);
    }
    return acc;
  }, []);

  if (!typedOdds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Filter odds based on type and sort by decimal value
  const relevantOdds = typedOdds
    .filter(odd => type === 'best' ? odd.is_best : !odd.is_best)
    .sort((a, b) => a.decimal - b.decimal);

  if (!relevantOdds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span className="font-medium">{relevantOdds[0].decimal}</span>;
};