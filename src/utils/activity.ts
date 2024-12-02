import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | 'page_view'
  | 'ai_chat'
  | 'profile_update'
  | 'race_analysis'
  | 'document_view';

export const trackActivity = async (
  activityType: ActivityType,
  pagePath?: string,
  details?: Record<string, any>
) => {
  try {
    console.log('Tracking activity:', { activityType, pagePath, details });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('No user session found, skipping activity tracking');
      return;
    }

    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: session.user.id,
        activity_type: activityType,
        page_path: pagePath,
        details: details || {}
      });

    if (error) {
      console.error('Error tracking activity:', error);
    }
  } catch (error) {
    console.error('Error in trackActivity:', error);
  }
};