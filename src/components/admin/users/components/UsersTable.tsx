import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTableRow } from "./UserTableRow";
import type { ProfileData } from "../profile/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UsersTableProps {
  users: ProfileData[];
  onViewProfile: (userId: string) => void;
}

export const UsersTable = ({ users, onViewProfile }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found matching your search criteria
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              onViewProfile={onViewProfile}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};