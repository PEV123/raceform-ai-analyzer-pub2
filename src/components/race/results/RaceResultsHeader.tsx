import { Card } from "@/components/ui/card";

interface RaceResultsHeaderProps {
  winningTime: string;
  going: string;
  toteWin: string;
  totePlaces: string;
}

export const RaceResultsHeader = ({ 
  winningTime, 
  going, 
  toteWin, 
  totePlaces 
}: RaceResultsHeaderProps) => {
  return (
    <>
      <h3 className="text-2xl font-bold mb-4 text-primary">Race Result</h3>
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-1">
          <p className="font-medium">Winning Time: <span className="text-secondary">{winningTime}</span></p>
          <p className="font-medium">Going: <span className="text-secondary">{going}</span></p>
        </div>
        <div className="space-y-1 text-right">
          <p className="font-medium">Tote Win: <span className="text-success">{toteWin}</span></p>
          <p className="font-medium">Places: <span className="text-success">{totePlaces}</span></p>
        </div>
      </div>
    </>
  );
};