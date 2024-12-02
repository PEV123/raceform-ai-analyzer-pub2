import { NonRunnerBadge } from "./NonRunnerBadge";

interface RunnerHeaderProps {
  runner: any;
  number: number;
  silkUrl?: string;
}

export const RunnerHeader = ({ runner, number, silkUrl }: RunnerHeaderProps) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
          {number}
        </div>
        {silkUrl && (
          <img src={silkUrl} alt="Racing silks" className="w-8 h-8 object-contain" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className={runner.is_non_runner ? 'line-through' : ''}>
            {runner.horse}
          </span>
          {runner.is_non_runner && <NonRunnerBadge />}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {runner.is_non_runner ? "NON-RUNNER" : runner.jockey} - {runner.trainer}
        </p>
      </div>
    </div>
  );
};