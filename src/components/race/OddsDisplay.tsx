import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface OddsDisplayProps {
  odds: Tables<"runners">["odds"];
  className?: string;
}

export const OddsDisplay = ({ odds, className }: OddsDisplayProps) => {
  if (!odds || !Array.isArray(odds) || odds.length === 0) {
    return <span className={cn("text-muted-foreground", className)}>No odds available</span>;
  }

  // Get best price (highest decimal odds)
  const bestPrice = odds.reduce((best, current) => {
    const decimal = parseFloat(current.decimal);
    return decimal > best ? decimal : best;
  }, 0);

  // Get most common price (mode)
  const priceFrequency = odds.reduce((acc, curr) => {
    const decimal = parseFloat(curr.decimal);
    acc[decimal] = (acc[decimal] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostCommonPrice = Object.entries(priceFrequency).reduce((a, b) => 
    priceFrequency[parseFloat(a[0])] > priceFrequency[parseFloat(b[0])] ? a : b
  )[0];

  return (
    <div className={cn("text-sm", className)}>
      <div className="flex gap-2">
        <span className="font-medium">Best: {bestPrice}</span>
        <span className="text-muted-foreground">|</span>
        <span>Gen: {mostCommonPrice}</span>
      </div>
    </div>
  );
};