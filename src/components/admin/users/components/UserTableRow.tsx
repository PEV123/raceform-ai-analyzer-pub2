import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProfileData } from "../profile/types";
import { format } from "date-fns";

interface UserTableRowProps {
  user: ProfileData;
  onViewProfile: (userId: string) => void;
}

export const UserTableRow = ({ user, onViewProfile }: UserTableRowProps) => {
  console.log("User data:", user); // Debug log to see the user data
  
  const formatLastLogin = (date: string | null) => {
    if (!date) {
      console.log("No last_login date provided");
      return "Never";
    }
    
    try {
      // For timestamps that come in ISO 8601 format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.error("Invalid date value:", date);
        return "Invalid date";
      }
      return format(dateObj, "PPp");
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