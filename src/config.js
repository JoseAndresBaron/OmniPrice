import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  rapidApiKey: process.env.RAPIDAPI_KEY || '',
  rapidApiHost: process.env.RAPIDAPI_HOST || 'real-time-product-search.p.rapidapi.com',
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '3600000', 10), // 1 hour
  cacheMaxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
};

// Trustworthy retailer list and domain patterns
export const TRUSTED_RETAILERS = [
  { name: 'Amazon', patterns: ['amazon'] },
  { name: 'Walmart', patterns: ['walmart'] },
  { name: 'Best Buy', patterns: ['best buy', 'bestbuy'] },
  { name: 'Target', patterns: ['target'] },
  { name: 'Apple', patterns: ['apple', 'apple store', 'apple education store'] },
  { name: 'B&H Photo', patterns: ['b&h', 'bhphotovideo'] },
  { name: 'Newegg', patterns: ['newegg'] },
  { name: 'Home Depot', patterns: ['home depot', 'homedepot'] },
  { name: 'Costco', patterns: ['costco'] },
  { name: 'Macy\'s', patterns: ['macys', 'macy\'s'] },
  { name: 'Nordstrom', patterns: ['nordstrom'] },
  { name: 'eBay (Top Rated)', patterns: ['ebay'] },
  { name: 'Micro Center', patterns: ['micro center', 'microcenter'] },
  { name: 'Dell', patterns: ['dell'] },
  { name: 'Lenovo', patterns: ['lenovo'] },
  { name: 'Samsung', patterns: ['samsung'] },
  { name: 'Adorama', patterns: ['adorama'] }
];

export function identifyTrustworthyStore(storeName) {
  if (!storeName || typeof storeName !== 'string') {
    return { isTrusted: false, canonicalName: storeName || 'Unknown Store' };
  }

  const normalized = storeName.toLowerCase().trim();
  for (const retailer of TRUSTED_RETAILERS) {
    for (const pattern of retailer.patterns) {
      if (normalized.includes(pattern)) {
        return { isTrusted: true, canonicalName: retailer.name };
      }
    }
  }

  return { isTrusted: false, canonicalName: storeName };
}
