import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  isAdmin?: boolean;
}

export const PageHeader = ({ isAdmin }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-3xl font-bold">
        {isAdmin ? "Admin AI Analysis" : "AI Race Analysis"}
      </h1>
    </div>
  );
};