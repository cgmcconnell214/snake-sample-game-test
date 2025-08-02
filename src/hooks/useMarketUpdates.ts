import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMarketUpdates() {
  useEffect(() => {
    // Set up periodic market data updates
    const updateMarketData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data-scheduler');
        if (error) {
          console.error('Market update error:', error);
        } else {
          console.log('Market data updated:', data);
        }
      } catch (error) {
        console.error('Failed to update market data:', error);
      }
    };

    // Update immediately on mount
    updateMarketData();

    // Set up interval for updates every 30 seconds
    const interval = setInterval(updateMarketData, 30000);

    return () => clearInterval(interval);
  }, []);
}