import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTableRow } from "./UserTableRow";
import type { ProfileData } from "../profile/types";

interface UsersTableProps {
  users: ProfileData[];
  onViewProfile: (userId: string) => void;
}

export const UsersTable = ({ users, onViewProfile }: UsersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Membership</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
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
  );
};