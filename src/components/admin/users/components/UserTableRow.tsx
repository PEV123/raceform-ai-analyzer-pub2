import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProfileData } from "../profile/types";

interface UserTableRowProps {
  user: ProfileData;
  onViewProfile: (userId: string) => void;
}

export const UserTableRow = ({ user, onViewProfile }: UserTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{user.email || "No email"}</TableCell>
      <TableCell className="capitalize">{user.membership_level}</TableCell>
      <TableCell className="capitalize">{user.subscription_status}</TableCell>
      <TableCell>
        {user.last_login
          ? new Date(user.last_login).toLocaleDateString()
          : "Never"}
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProfile(user.id)}
        >
          View Profile
        </Button>
      </TableCell>
    </TableRow>
  );
};