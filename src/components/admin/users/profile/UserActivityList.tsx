import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { UserActivity } from "../hooks/useUserActivity";

interface UserActivityListProps {
  activities: UserActivity[];
}

export const UserActivityList = ({ activities }: UserActivityListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <ScrollArea className="h-[300px] rounded-md border p-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No activity recorded yet</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <span className="font-medium capitalize">
                    {activity.activity_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(activity.created_at), "PPp")}
                  </span>
                </div>
                {activity.page_path && (
                  <span className="text-sm text-muted-foreground">
                    Page: {activity.page_path}
                  </span>
                )}
                {activity.details && Object.keys(activity.details).length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(activity.details).map(([key, value]) => (
                      <div key={key}>
                        {key}: {JSON.stringify(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};