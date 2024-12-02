import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Permission {
  id: string;
  name: string;
  description: string;
  resource_path: string;
}

interface MembershipLevel {
  id: string;
  name: string;
  description: string;
}

interface MembershipLevelPermission {
  membership_level_id: string;
  permission_id: string;
}

export const MembershipLevels = () => {
  const { toast } = useToast();

  const { data: membershipLevels, isLoading: levelsLoading } = useQuery({
    queryKey: ["membership-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_levels")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as MembershipLevel[];
    },
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Permission[];
    },
  });

  const { data: levelPermissions, isLoading: levelPermissionsLoading } = useQuery({
    queryKey: ["membership-level-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_level_permissions")
        .select("*");

      if (error) throw error;
      return data as MembershipLevelPermission[];
    },
  });

  const handlePermissionChange = async (
    levelId: string,
    permissionId: string,
    checked: boolean
  ) => {
    try {
      if (checked) {
        const { error } = await supabase
          .from("membership_level_permissions")
          .insert({ membership_level_id: levelId, permission_id: permissionId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("membership_level_permissions")
          .delete()
          .eq("membership_level_id", levelId)
          .eq("permission_id", permissionId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  if (levelsLoading || permissionsLoading || levelPermissionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const isPermissionEnabled = (levelId: string, permissionId: string) => {
    return levelPermissions?.some(
      (lp) =>
        lp.membership_level_id === levelId && lp.permission_id === permissionId
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Membership Levels & Permissions</h2>
        <p className="text-muted-foreground">
          Manage access levels and their permissions
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead>
            {permissions?.map((permission) => (
              <TableHead key={permission.id}>{permission.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {membershipLevels?.map((level) => (
            <TableRow key={level.id}>
              <TableCell className="font-medium capitalize">
                {level.name}
                {level.description && (
                  <span className="block text-sm text-muted-foreground">
                    {level.description}
                  </span>
                )}
              </TableCell>
              {permissions?.map((permission) => (
                <TableCell key={permission.id}>
                  <Checkbox
                    checked={isPermissionEnabled(level.id, permission.id)}
                    disabled={level.name === "admin"}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(level.id, permission.id, checked as boolean)
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};