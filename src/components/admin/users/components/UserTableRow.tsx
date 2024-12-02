import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProfileData } from "../profile/types";
import { format } from "date-fns";

interface UserTableRowProps {
  user: ProfileData;
  onViewProfile: (userId: string) => void;
}

export const UserTableRow = ({ user, onViewProfile }: UserTableRowProps) => {
  console.log("Rendering user row:", user);
  
  const formatLastLogin = (date: string | null) => {
    if (!date) {
      console.log("No last_login date for user:", user.id);
      return "Never";
    }
    
    try {
      return format(new Date(date), "PPp");
    } catch (error) {
      console.error("Error formatting date:", error, "Date value:", date);
      return "Invalid date";
    }
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onViewProfile(user.id)}>
      <TableCell>{user.email || "No email"}</TableCell>
      <TableCell className="capitalize">
        {user.is_admin ? "Admin" : user.membership_level || "free"}
      </TableCell>
      <TableCell className="capitalize">{user.subscription_status || "active"}</TableCell>
      <TableCell>{formatLastLogin(user.last_login)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(user.id);
          }}
        >
          View Profile
        </Button>
      </TableCell>
    </TableRow>
  );
};