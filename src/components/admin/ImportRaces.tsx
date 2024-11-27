import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
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

const ImportRaces = () => {
  const clearMutation = useClearRacesMutation();
  const importMutation = useImportRacesMutation();

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Import Races</h2>
      <p className="text-muted-foreground mb-4">
        Import today's races from the Racing API
      </p>
      <div className="flex gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={clearMutation.isPending || importMutation.isPending}
            >
              {clearMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Races
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all races,
                runners, and associated documents from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => clearMutation.mutate()}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={() => importMutation.mutate()}
          disabled={clearMutation.isPending || importMutation.isPending}
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import Today's Races"
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ImportRaces;