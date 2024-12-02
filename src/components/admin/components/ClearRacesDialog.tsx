import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClearRacesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClearRacesDialog = ({
  isOpen,
  onOpenChange
}: ClearRacesDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Races</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all races? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};