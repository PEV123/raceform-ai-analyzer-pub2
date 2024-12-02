import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProfileData } from "../profile/types";

interface UserTableRowProps {
  user: ProfileData;
  onViewProfile: (userId: string) => void;
}

export const UserTableRow = ({ user, onViewProfile }: UserTableRowProps) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => onViewProfile(user.id)}
    >
      <TableCell>{user.email || "No email"}</TableCell>
      <TableCell className="capitalize">{user.membership_level || "free"}</TableCell>
      <TableCell className="capitalize">{user.subscription_status || "active"}</TableCell>
      <TableCell>
        {user.last_login 
          ? new Date(user.last_login).toLocaleDateString()
          : "Never"}
      </TableCell>
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