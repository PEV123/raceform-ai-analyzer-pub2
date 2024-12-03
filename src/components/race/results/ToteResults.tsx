interface ToteResultsProps {
  toteEx?: string;
  toteCSF?: string;
  toteTricast?: string;
  toteTrifecta?: string;
}

export const ToteResults = ({
  toteEx,
  toteCSF,
  toteTricast,
  toteTrifecta
}: ToteResultsProps) => {
  if (!toteEx) return null;

  return (
    <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-1 text-sm">
      <p><span className="font-medium">Exacta:</span> {toteEx}</p>
      {toteCSF && <p><span className="font-medium">CSF:</span> {toteCSF}</p>}
      {toteTricast && <p><span className="font-medium">Tricast:</span> {toteTricast}</p>}
      {toteTrifecta && <p><span className="font-medium">Trifecta:</span> {toteTrifecta}</p>}
    </div>
  );
};