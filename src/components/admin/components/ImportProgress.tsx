import { Progress } from "@/components/ui/progress";

interface ImportProgressProps {
  progress: number;
  operation: string;
}

export const ImportProgress = ({ progress, operation }: ImportProgressProps) => {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{operation}</p>
    </div>
  );
};