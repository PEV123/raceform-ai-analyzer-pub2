import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RawDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  race: any;
}

export const RawDataDialog = ({ open, onOpenChange, race }: RawDataDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Raw Race Data</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <pre className="p-4 bg-muted rounded-lg text-sm">
            {JSON.stringify(race, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};