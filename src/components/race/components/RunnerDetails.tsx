interface RunnerDetailsProps {
  runner: any;
}

export const RunnerDetails = ({ runner }: RunnerDetailsProps) => {
  const formatDate = (date: string) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
      <div>
        <p><span className="font-medium">Age:</span> {runner.age} years old</p>
        <p><span className="font-medium">Sire:</span> {runner.sire} ({runner.sire_region})</p>
        <p><span className="font-medium">Dam:</span> {runner.dam}</p>
        <p><span className="font-medium">Breeder:</span> {runner.breeder || 'Unknown'}</p>
      </div>
      <div>
        <p><span className="font-medium">Sex:</span> {runner.sex || 'Unknown'}</p>
        <p><span className="font-medium">Color:</span> {runner.colour || 'Unknown'}</p>
        {runner.dob && <p><span className="font-medium">Foaled:</span> {formatDate(runner.dob)}</p>}
      </div>
    </div>
  );
};