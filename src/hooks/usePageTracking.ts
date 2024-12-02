import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackActivity } from '@/utils/activity';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('Page view:', location.pathname);
    trackActivity('page_view', location.pathname);
  }, [location]);
};