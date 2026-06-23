import { supabase } from './supabase';

/**
 * Fetches market quotes using pagination to bypass the 1000 max-rows limit.
 * Guarantees all data within the range is returned.
 *
 * @param indicator Indicator name (e.g., 'boi_gordo_cepea')
 * @param startDate Optional start date (YYYY-MM-DD)
 * @param endDate Optional end date (YYYY-MM-DD)
 * @param ascending Sort direction (default: true)
 * @returns Array of market quotes
 */
export const fetchHistoricalQuotes = async (
  indicator: string,
  startDate?: string,
  endDate?: string,
  ascending = true
) => {
  let allData: any[] = [];
  let hasMore = true;
  let start = 0;
  const step = 1000;

  while (hasMore) {
    let query = supabase
      .from('market_quotes')
      .select('date, value')
      .eq('indicator', indicator)
      .order('date', { ascending })
      .range(start, start + step - 1);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      start += step;
      if (data.length < step) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
};
