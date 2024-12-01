import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { DateSelector } from "./DateSelector";

interface ClearRacesDialogProps {
  clearDate: Date | undefined;
  setClearDate: (date: Date | undefined) => void;
  onClear: (date: Date) => void;
  isPending: boolean;
}

export const ClearRacesDialog = ({
  clearDate,
  setClearDate,
  onClear,
  isPending,
}: ClearRacesDialogProps) => {
  const formattedClearDate = clearDate
    ? formatInTimeZone(clearDate, 'Europe/London', "MMMM do, yyyy")
    : "Select date";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Races by Date
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select date to clear</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="flex items-center gap-2">
              <DateSelector
                date={clearDate || new Date()}
                onSelect={setClearDate}
                label="Clear races from"
              />
            </div>
            {clearDate && (
              <p className="text-red-500">
                Are you absolutely sure you want to clear all races from {formattedClearDate}? 
                This action cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setClearDate(undefined)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (clearDate) {
                onClear(clearDate);
                setClearDate(undefined);
              }
            }}
            disabled={!clearDate}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};