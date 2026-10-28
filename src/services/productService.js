import { LRUCache } from 'lru-cache';
import { config, identifyTrustworthyStore } from '../config.js';

// High-speed In-Memory LRU Cache
const searchCache = new LRUCache({
  max: config.cacheMaxItems,
  ttl: config.cacheTtlMs,
});

// Metrics tracker
const metrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  upstreamErrors: 0,
  startedAt: new Date().toISOString(),
};

function parsePrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return null;
  // Match the first numeric occurrence like 1,299.99 or 49.95
  const match = priceStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export async function searchProducts({
  query,
  country = 'us',
  language = 'en',
  limit = 20,
  onlyTrusted = true,
  sortBy = 'price_asc',
}) {
  metrics.totalRequests += 1;
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `${normalizedQuery}|${country}|${language}|${limit}`;

  const startTime = performance.now();
  let rawData = null;
  let fromCache = false;

  // 1. Check in-memory cache
  if (searchCache.has(cacheKey)) {
    rawData = searchCache.get(cacheKey);
    fromCache = true;
    metrics.cacheHits += 1;
  } else {
    // 2. Fetch from OpenWeb Ninja via RapidAPI
    metrics.cacheMisses += 1;
    const url = new URL(`https://${config.rapidApiHost}/search`);
    url.searchParams.set('q', query.trim());
    url.searchParams.set('country', country);
    url.searchParams.set('language', language);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': config.rapidApiKey,
        'x-rapidapi-host': config.rapidApiHost,
      },
    });

    if (!response.ok) {
      metrics.upstreamErrors += 1;
      const errorText = await response.text();
      throw new Error(`OpenWeb Ninja API returned ${response.status}: ${errorText || response.statusText}`);
    }

    const json = await response.json();
    rawData = json.data?.products || [];

    // Cache the raw products array
    searchCache.set(cacheKey, rawData);
  }

  // 3. Transform and normalize product list
  let products = rawData.map((item, index) => {
    const rawStore = item.store_name || item.offer?.store_name || 'Direct / Unknown';
    const { isTrusted, canonicalName } = identifyTrustworthyStore(rawStore);
    const numericPrice = parsePrice(item.price);
    const numericOriginalPrice = parsePrice(item.original_price);
    const hasDiscount = Boolean(item.on_sale || (numericOriginalPrice && numericPrice && numericOriginalPrice > numericPrice));

    let discountPercentage = 0;
    if (numericOriginalPrice && numericPrice && numericOriginalPrice > numericPrice) {
      discountPercentage = Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100);
    }

    return {
      id: item.product_id || `prod-${index}`,
      title: item.product_title || 'Untitled Product',
      price: item.price || (numericPrice ? `$${numericPrice.toFixed(2)}` : 'Check Site'),
      numericPrice: numericPrice,
      originalPrice: item.original_price || null,
      numericOriginalPrice: numericOriginalPrice,
      hasDiscount,
      discountPercentage,
      store: canonicalName,
      rawStore: rawStore,
      isTrusted,
      rating: typeof item.product_rating === 'number' ? item.product_rating : null,
      reviewsCount: typeof item.product_num_reviews === 'number' ? item.product_num_reviews : 0,
      shipping: item.shipping || null,
      imageUrl: item.product_photos?.[0] || null,
      url: item.product_page_url || '#',
    };
  });

  // 4. Filter by trustworthy stores if requested
  if (onlyTrusted) {
    products = products.filter((p) => p.isTrusted);
  }

  // 5. Apply sorting
  switch (sortBy) {
    case 'price_asc':
      products.sort((a, b) => {
        if (a.numericPrice === null) return 1;
        if (b.numericPrice === null) return -1;
        return a.numericPrice - b.numericPrice;
      });
      break;
    case 'price_desc':
      products.sort((a, b) => {
        if (a.numericPrice === null) return 1;
        if (b.numericPrice === null) return -1;
        return b.numericPrice - a.numericPrice;
      });
      break;
    case 'rating_desc':
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'discount_desc':
      products.sort((a, b) => b.discountPercentage - a.discountPercentage);
      break;
    default:
      break;
  }

  // 6. Calculate Comparison Metrics
  const validPricedProducts = products.filter((p) => p.numericPrice !== null && p.numericPrice > 0);
  let comparisonSummary = null;

  if (validPricedProducts.length > 0) {
    const prices = validPricedProducts.map((p) => p.numericPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((acc, p) => acc + p, 0) / prices.length;
    const bestDealItem = validPricedProducts.find((p) => p.numericPrice === minPrice);

    comparisonSummary = {
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      averagePrice: Math.round(avgPrice * 100) / 100,
      potentialSavings: Math.round((maxPrice - minPrice) * 100) / 100,
      savingsPercentage: maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0,
      bestDealStore: bestDealItem ? bestDealItem.store : null,
      bestDealUrl: bestDealItem ? bestDealItem.url : null,
      storesRepresented: Array.from(new Set(products.map((p) => p.store))),
    };
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    meta: {
      query,
      fromCache,
      responseDurationMs: durationMs,
      totalFound: products.length,
      onlyTrusted,
      sortBy,
    },
    comparison: comparisonSummary,
    products,
  };
}

export function getMetrics() {
  const hitRatio = metrics.totalRequests > 0
    ? ((metrics.cacheHits / metrics.totalRequests) * 100).toFixed(1) + '%'
    : '0%';

  return {
    ...metrics,
    cachedKeysCount: searchCache.size,
    cacheHitRatio: hitRatio,
  };
}
