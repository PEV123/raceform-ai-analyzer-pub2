import { Ban } from "lucide-react";

export const NonRunnerBadge = () => (
  <div className="flex items-center gap-1 text-red-500">
    <Ban className="h-4 w-4" />
    <span className="text-sm font-normal">Non-Runner</span>
  </div>
);