import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatInTimeZone } from 'date-fns-tz';
import { Loader2 } from "lucide-react";

interface ClearRacesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  date: Date;
  isLoading: boolean;
}

export const ClearRacesDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  date,
  isLoading
}: ClearRacesDialogProps) => {
  const formattedDate = formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Races</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all races for {formattedDate}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              'Clear Races'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};