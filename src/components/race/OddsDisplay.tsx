import { Json } from "@/integrations/supabase/types";

interface Odd {
  is_best: boolean;
  decimal: number;
}

interface OddsDisplayProps {
  odds?: Json;
  type?: 'best' | 'general';
}

export const OddsDisplay = ({ odds, type = 'best' }: OddsDisplayProps) => {
  if (!odds || !Array.isArray(odds) || !odds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Type guard to ensure odds array contains valid Odd objects
  const isValidOdd = (odd: unknown): odd is Odd => {
    if (!odd || typeof odd !== 'object') return false;
    
    const candidate = odd as Record<string, unknown>;
    return (
      'is_best' in candidate &&
      'decimal' in candidate &&
      typeof candidate.is_best === 'boolean' &&
      typeof candidate.decimal === 'number'
    );
  };

  // Filter and sort odds based on type, ensuring type safety
  const validOdds = odds.filter(isValidOdd);
  if (!validOdds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  const relevantOdds = validOdds
    .filter(odd => type === 'best' ? odd.is_best : !odd.is_best)
    .sort((a, b) => a.decimal - b.decimal);

  if (!relevantOdds.length) {
    return <span className="text-muted-foreground">-</span>;
  }

  const bestOdd = relevantOdds[0];
  return <span className="font-medium">{bestOdd.decimal}</span>;
};