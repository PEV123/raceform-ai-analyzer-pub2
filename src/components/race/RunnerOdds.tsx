import { OddsDisplay } from "./OddsDisplay";

interface RunnerOddsProps {
  odds: any;
}

export const RunnerOdds = ({ odds }: RunnerOddsProps) => {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Best:</span>
        <OddsDisplay odds={odds} type="best" />
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Gen:</span>
        <OddsDisplay odds={odds} type="general" />
      </div>
    </div>
  );
};