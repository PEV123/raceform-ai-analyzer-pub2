import { Card } from "@/components/ui/card";

const Analysis = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Race Analysis</h1>
      <Card className="p-6">
        <p className="text-lg text-muted-foreground">
          Select a race to view AI analysis and chat history
        </p>
      </Card>
    </div>
  );
};

export default Analysis;