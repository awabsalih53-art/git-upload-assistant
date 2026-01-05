import { supabase } from "@/integrations/supabase/client";

export interface VintedItem {
  id: number;
  title: string;
  price: string;
  currency: string;
  brand_title: string;
  size_title: string;
  photo: {
    url: string;
    dominant_color: string;
    dominant_color_opaque: string;
    thumbnails: Array<{
      type: string;
      url: string;
      width: number;
      height: number;
    }>;
  };
  url: string;
  is_favourite: boolean;
  favourite_count: number;
  is_visible: boolean;
  user: {
    id: number;
    login: string;
    photo?: {
      url: string;
    };
  };
  status: string;
}

export interface VintedSearchResponse {
  items: VintedItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_entries: number;
    per_page: number;
  };
}

export interface VintedItemDetails {
  item: {
    id: number;
    title: string;
    description: string;
    brand_title: string;
    size_title: string;
    price: string;
    currency: string;
    status: string;
    url: string;
    created_at_ts: number;
    updated_at_ts: number;
    photos: Array<{
      url: string;
      full_size_url: string;
    }>;
    user: {
      id: number;
      login: string;
      feedback_reputation: number;
    };
  };
}

export interface VintedSearchParams {
  url?: string;
  domain?: string;
  query?: string;
  per_page?: number;
  page?: number;
  order?: 'newest_first' | 'price_low_to_high' | 'price_high_to_low' | 'relevance';
  price_from?: number;
  price_to?: number;
  brand_ids?: string;
  catalog_ids?: string;
  size_ids?: string;
  status_ids?: string;
  color_ids?: string;
}

const VINTED_FUNCTION_URL = `https://edjxrgxijxnkutrpqrrb.supabase.co/functions/v1/vinted-api`;

/**
 * Search for items on Vinted
 */
export async function searchVintedItems(params: VintedSearchParams): Promise<VintedSearchResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('vinted-api', {
      body: {
        ...params,
      },
    });

    if (error) {
      console.error('Vinted search error:', error);
      throw error;
    }

    return data as VintedSearchResponse;
  } catch (error) {
    console.error('Failed to search Vinted:', error);
    return null;
  }
}

/**
 * Get details of a specific Vinted item
 */
export async function getVintedItemDetails(params: { url?: string; item_id?: string; domain?: string }): Promise<VintedItemDetails | null> {
  try {
    const { data, error } = await supabase.functions.invoke('vinted-api', {
      body: {
        ...params,
        action: 'details',
      },
    });

    if (error) {
      console.error('Vinted item details error:', error);
      throw error;
    }

    return data as VintedItemDetails;
  } catch (error) {
    console.error('Failed to get Vinted item details:', error);
    return null;
  }
}

/**
 * Check the health of the Vinted API connection
 */
export async function checkVintedApiHealth(): Promise<{ status: string; cached_domains: string[]; timestamp: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('vinted-api', {
      body: { action: 'health' },
    });

    if (error) {
      console.error('Vinted health check error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to check Vinted API health:', error);
    return null;
  }
}

/**
 * Parse a Vinted URL to extract item information
 */
export function parseVintedUrl(url: string): { valid: boolean; domain?: string; itemId?: string } {
  try {
    const domainMatch = url.match(/vinted\.([a-z]+)/);
    const itemMatch = url.match(/items\/(\d+)/);
    
    if (!domainMatch) {
      return { valid: false };
    }

    return {
      valid: true,
      domain: domainMatch[1],
      itemId: itemMatch?.[1],
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Get Vinted domains list
 */
export const VINTED_DOMAINS = [
  { code: 'fr', name: 'France', currency: 'EUR' },
  { code: 'de', name: 'Germany', currency: 'EUR' },
  { code: 'nl', name: 'Netherlands', currency: 'EUR' },
  { code: 'be', name: 'Belgium', currency: 'EUR' },
  { code: 'es', name: 'Spain', currency: 'EUR' },
  { code: 'it', name: 'Italy', currency: 'EUR' },
  { code: 'pt', name: 'Portugal', currency: 'EUR' },
  { code: 'pl', name: 'Poland', currency: 'PLN' },
  { code: 'cz', name: 'Czech Republic', currency: 'CZK' },
  { code: 'at', name: 'Austria', currency: 'EUR' },
  { code: 'lt', name: 'Lithuania', currency: 'EUR' },
  { code: 'uk', name: 'United Kingdom', currency: 'GBP' },
  { code: 'com', name: 'USA', currency: 'USD' },
];
