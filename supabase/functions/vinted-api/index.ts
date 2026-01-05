import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid Vinted domains
const VALID_DOMAINS = ['fr', 'de', 'nl', 'be', 'es', 'it', 'pt', 'pl', 'cz', 'at', 'lt', 'uk', 'com'];

// User agents list for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Cookie storage per domain with more aggressive refresh
const cookieStore: Map<string, { cookie: string; timestamp: number }> = new Map();
const COOKIE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch session cookie from Vinted homepage
 */
async function fetchSessionCookie(domain: string): Promise<string | null> {
  console.log(`[Vinted API] Attempting to fetch cookie for domain: ${domain}`);
  
  const urls = [
    `https://www.vinted.${domain}`,
    `https://www.vinted.${domain}/catalog`,
  ];
  
  for (const url of urls) {
    try {
      console.log(`[Vinted API] Trying URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      });

      console.log(`[Vinted API] Response status: ${response.status}`);
      
      // Get all set-cookie headers
      const setCookieHeaders = response.headers.get('set-cookie');
      console.log(`[Vinted API] Raw set-cookie: ${setCookieHeaders?.substring(0, 200)}...`);
      
      if (setCookieHeaders) {
        // Try multiple patterns to extract the session cookie
        const patterns = [
          new RegExp(`_vinted_${domain}_session=([^;\\s,]+)`),
          /_vinted_fr_session=([^;\s,]+)/,
          /_vinted_\w+_session=([^;\s,]+)/,
          /(?:secure,\s*)?_vinted_\w+_session=([^;\s,]+)/i,
        ];
        
        for (const pattern of patterns) {
          const match = setCookieHeaders.match(pattern);
          if (match && match[1]) {
            console.log(`[Vinted API] Cookie extracted with pattern: ${pattern}`);
            return match[1];
          }
        }
        
        // Try parsing all cookies
        const allCookies = setCookieHeaders.split(/,(?=[^;]*=)/);
        for (const cookieStr of allCookies) {
          if (cookieStr.includes('_session=')) {
            const sessionMatch = cookieStr.match(/=([^;]+)/);
            if (sessionMatch && sessionMatch[1]) {
              console.log(`[Vinted API] Cookie extracted from split: ${sessionMatch[1].substring(0, 50)}...`);
              return sessionMatch[1];
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Vinted API] Error fetching from ${url}:`, error);
    }
  }
  
  console.log('[Vinted API] Could not extract session cookie from any URL');
  return null;
}

/**
 * Get a valid session cookie, using cache if available
 */
async function getSessionCookie(domain: string): Promise<string | null> {
  const cached = cookieStore.get(domain);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < COOKIE_TTL) {
    console.log(`[Vinted API] Using cached cookie for ${domain}`);
    return cached.cookie;
  }
  
  const newCookie = await fetchSessionCookie(domain);
  if (newCookie) {
    cookieStore.set(domain, { cookie: newCookie, timestamp: now });
    return newCookie;
  }
  
  // If fetch failed but we have an old cookie, try using it
  if (cached) {
    console.log(`[Vinted API] Using expired cookie as fallback`);
    return cached.cookie;
  }
  
  return null;
}

/**
 * Make an authenticated API request to Vinted
 */
async function vintedApiRequest(domain: string, endpoint: string, cookie: string): Promise<Response> {
  const url = `https://www.vinted.${domain}${endpoint}`;
  console.log(`[Vinted API] Requesting: ${url}`);
  
  return await fetch(url, {
    headers: {
      'Cookie': `_vinted_${domain}_session=${cookie}; _vinted_fr_session=${cookie}`,
      'User-Agent': getRandomUserAgent(),
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Referer': `https://www.vinted.${domain}/`,
      'Origin': `https://www.vinted.${domain}`,
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
}

/**
 * Search for items on Vinted
 */
async function searchItems(params: {
  domain?: string;
  query?: string;
  url?: string;
  per_page?: number;
  page?: number;
  order?: string;
  price_from?: number;
  price_to?: number;
  brand_ids?: string;
  catalog_ids?: string;
}): Promise<any> {
  const domain = params.domain || 'fr';
  
  if (!VALID_DOMAINS.includes(domain)) {
    throw new Error(`Invalid domain: ${domain}. Valid domains: ${VALID_DOMAINS.join(', ')}`);
  }
  
  // Build query string
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set('search_text', params.query);
  if (params.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.order) searchParams.set('order', params.order);
  if (params.price_from) searchParams.set('price_from', params.price_from.toString());
  if (params.price_to) searchParams.set('price_to', params.price_to.toString());
  if (params.brand_ids) searchParams.set('brand_ids', params.brand_ids);
  if (params.catalog_ids) searchParams.set('catalog_ids', params.catalog_ids);
  
  // Add timestamp to avoid caching
  searchParams.set('time', Math.floor(Date.now() / 1000).toString());
  
  const endpoint = `/api/v2/catalog/items?${searchParams.toString()}`;
  
  // Try to get a cookie
  const cookie = await getSessionCookie(domain);
  
  if (!cookie) {
    // Try a direct request without authentication (sometimes works for public data)
    console.log('[Vinted API] No cookie available, trying unauthenticated request');
    
    const directResponse = await fetch(`https://www.vinted.${domain}${endpoint}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });
    
    if (directResponse.ok) {
      return await directResponse.json();
    }
    
    throw new Error('Could not authenticate with Vinted. The API may be rate-limited or blocked.');
  }
  
  // Make the API request
  const response = await vintedApiRequest(domain, endpoint, cookie);
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Vinted API] API error: ${response.status} - ${text.substring(0, 200)}`);
    
    // Clear cookie cache on auth error
    if (response.status === 401 || response.status === 403) {
      cookieStore.delete(domain);
    }
    
    throw new Error(`Vinted API returned ${response.status}. Try again in a few moments.`);
  }
  
  return await response.json();
}

/**
 * Get item details by ID
 */
async function getItemDetails(params: { domain?: string; item_id?: string; url?: string }): Promise<any> {
  let domain = params.domain || 'fr';
  let itemId = params.item_id;
  
  if (params.url) {
    const idMatch = params.url.match(/items\/(\d+)/);
    if (idMatch) itemId = idMatch[1];
    
    const domainMatch = params.url.match(/vinted\.([a-z]+)/);
    if (domainMatch) domain = domainMatch[1];
  }
  
  if (!itemId) {
    throw new Error('item_id or url with item ID is required');
  }
  
  const cookie = await getSessionCookie(domain);
  if (!cookie) {
    throw new Error('Could not authenticate with Vinted');
  }
  
  const response = await vintedApiRequest(domain, `/api/v2/items/${itemId}`, cookie);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch item details: ${response.status}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const url = new URL(req.url);
    const action = body.action || url.searchParams.get('action') || 'search';
    
    // Merge URL params into body
    url.searchParams.forEach((value, key) => {
      if (key !== 'action' && !body[key]) {
        body[key] = value;
      }
    });

    console.log(`[Vinted API] Action: ${action}, Params:`, JSON.stringify(body));

    let result: any;

    switch (action) {
      case 'search':
        result = await searchItems(body);
        break;
      
      case 'item':
      case 'details':
        result = await getItemDetails(body);
        break;
      
      case 'health':
        result = {
          status: 'ok',
          cached_domains: Array.from(cookieStore.keys()),
          timestamp: new Date().toISOString(),
          supported_domains: VALID_DOMAINS,
        };
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Vinted API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimited = errorMessage.includes('rate-limited') || errorMessage.includes('blocked');
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        hint: isRateLimited 
          ? 'Vinted has anti-bot protection. Try again in a few minutes or use a different domain.' 
          : 'Make sure you have the correct parameters.',
      }),
      {
        status: isRateLimited ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
