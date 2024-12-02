import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserProfile } from "./UserProfile";
import { UserFilters } from "./components/UserFilters";
import { UsersTable } from "./components/UsersTable";
import { useUsers } from "./hooks/useUsers";

export const UserList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useUsers();

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMembership =
      membershipFilter === "all" || user.membership_level === membershipFilter;
    return matchesSearch && matchesMembership;
  });

  if (selectedUserId) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setSelectedUserId(null)}
          className="mb-4"
        >
          Back to User List
        </Button>
        <UserProfile userId={selectedUserId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        membershipFilter={membershipFilter}
        onMembershipFilterChange={setMembershipFilter}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <UsersTable
          users={filteredUsers || []}
          onViewProfile={setSelectedUserId}
        />
      )}
    </div>
  );
};