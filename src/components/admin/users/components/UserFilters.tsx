import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  membershipFilter: string;
  onMembershipFilterChange: (value: string) => void;
}

export const UserFilters = ({
  searchTerm,
  onSearchChange,
  membershipFilter,
  onMembershipFilterChange,
}: UserFiltersProps) => {
  return (
    <div className="flex gap-4 items-center">
      <Input
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select
        value={membershipFilter}
        onValueChange={onMembershipFilterChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by membership" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};