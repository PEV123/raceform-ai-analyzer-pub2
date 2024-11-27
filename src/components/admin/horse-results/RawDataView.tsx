import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RawDataViewProps {
  data: any;
}

export const RawDataView = ({ data }: RawDataViewProps) => {
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Raw API Response</h2>
      <ScrollArea className="h-[300px]">
        <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </Card>
  );
};