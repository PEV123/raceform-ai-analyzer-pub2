interface RunnerHeaderProps {
  runner: any;
  silkUrl?: string;
}

export const RunnerHeader = ({ runner, silkUrl }: RunnerHeaderProps) => {
  return (
    <div className="flex gap-4">
      {silkUrl && (
        <img
          src={silkUrl}
          alt={`${runner.jockey}'s silks`}
          className="w-12 h-12 object-contain"
        />
      )}
      <div>
        <h4 className="text-lg font-semibold">{runner.horse}</h4>
        <p className="text-sm text-muted-foreground mb-2">
          {runner.jockey} - {runner.trainer}
        </p>
      </div>
    </div>
  );
};