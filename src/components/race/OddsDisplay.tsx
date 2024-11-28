interface OddsDisplayProps {
  odds?: any[];
  type?: 'best' | 'general';
}

export const OddsDisplay = ({ odds, type = 'best' }: OddsDisplayProps) => {
  if (!odds || !odds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Filter and sort odds based on type
  const relevantOdds = odds
    .filter(odd => type === 'best' ? odd.is_best : !odd.is_best)
    .sort((a, b) => a.decimal - b.decimal);

  if (!relevantOdds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  const bestOdd = relevantOdds[0];
  return <span className="font-medium">{bestOdd.decimal}</span>;
};