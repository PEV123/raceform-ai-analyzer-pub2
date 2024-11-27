import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRaceContext } from "@/lib/formatRaceContext";

interface RawDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  race: any;
}

export const RawDataDialog = ({ open, onOpenChange, race }: RawDataDialogProps) => {
  const formattedContext = formatRaceContext(race);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Raw Race Data</DialogTitle>
          <DialogDescription>
            This is the formatted context data that is sent to the AI for analysis
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Formatted Context</h3>
              <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                {formattedContext}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Raw Race Data</h3>
              <pre className="p-4 bg-muted rounded-lg text-sm">
                {race ? JSON.stringify(race, null, 2) : 'No race data available'}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};