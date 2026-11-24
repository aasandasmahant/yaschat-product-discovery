"use strict";

/**
 * Mount this handler in the YAS CHAT Node backend at GET /api/discover/products.
 * A real providerSearch implementation must call approved affiliate/product APIs.
 * No credentials are accepted from the browser or returned in responses.
 */
function safeHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return undefined;
    if (parsed.hostname === "example.com" || parsed.hostname.endsWith(".example.com")) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function boundedText(value, max, fallback = "") {
  return String(value ?? fallback).trim().slice(0, max);
}

function normalizeProduct(input) {
  if (!input || typeof input !== "object") return null;
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) return null;
  const id = boundedText(input.id, 160);
  const title = boundedText(input.title, 180);
  const category = boundedText(input.category, 80);
  const currency = boundedText(input.currency, 3).toUpperCase();
  if (!id || !title || !category || !/^[A-Z]{3}$/.test(currency)) return null;

  const sources = Array.isArray(input.reviewSources) ? input.reviewSources.slice(0, 12).map((source) => {
    const rating = Number(source?.rating);
    const reviewCount = Number(source?.reviewCount);
    return {
      platform: boundedText(source?.platform, 40, "Other"),
      url: safeHttpsUrl(source?.url),
      ...(Number.isFinite(rating) && rating >= 0 && rating <= 5 ? { rating } : {}),
      ...(Number.isFinite(reviewCount) && reviewCount >= 0 ? { reviewCount: Math.floor(reviewCount) } : {}),
      summary: boundedText(source?.summary, 500),
      verified: source?.verified === true && Boolean(safeHttpsUrl(source?.url)),
    };
  }) : [];

  return {
    id, title, category, currency, price,
    brand: boundedText(input.brand, 100) || undefined,
    description: boundedText(input.description, 1200) || undefined,
    imageUrl: safeHttpsUrl(input.imageUrl),
    buyUrl: safeHttpsUrl(input.buyUrl),
    affiliateNetwork: boundedText(input.affiliateNetwork, 40) || undefined,
    originalPrice: Number.isFinite(Number(input.originalPrice)) && Number(input.originalPrice) > price
      ? Number(input.originalPrice) : undefined,
    rating: Number.isFinite(Number(input.rating)) && Number(input.rating) >= 0 && Number(input.rating) <= 5
      ? Number(input.rating) : undefined,
    reviewCount: Number.isFinite(Number(input.reviewCount)) && Number(input.reviewCount) >= 0
      ? Math.floor(Number(input.reviewCount)) : undefined,
    reviewSources: sources,
    pros: Array.isArray(input.pros) ? input.pros.slice(0, 8).map((x) => boundedText(x, 240)) : [],
    cons: Array.isArray(input.cons) ? input.cons.slice(0, 8).map((x) => boundedText(x, 240)) : [],
    updatedAt: input.updatedAt ? boundedText(input.updatedAt, 40) : undefined,
    availability: ["in-stock", "out-of-stock", "unknown"].includes(input.availability)
      ? input.availability : "unknown",
  };
}

function readParams(url) {
  const page = Math.max(1, Math.min(10000, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1));
  const pageSize = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("pageSize") || "30", 10) || 30));
  const rawBudget = url.searchParams.get("budget");
  const budget = rawBudget === null ? undefined : Number(rawBudget);
  return {
    query: boundedText(url.searchParams.get("q"), 120),
    category: boundedText(url.searchParams.get("category"), 80),
    tier: ["low", "medium", "high"].includes(url.searchParams.get("tier"))
      ? url.searchParams.get("tier") : "all",
    budget: Number.isFinite(budget) && budget > 0 ? budget : undefined,
    currency: boundedText(url.searchParams.get("currency"), 3).toUpperCase(),
    sort: ["price-asc", "price-desc", "rating"].includes(url.searchParams.get("sort"))
      ? url.searchParams.get("sort") : "relevance",
    page,
    pageSize,
  };
}

async function handleProductDiscoveryRequest(req, res, providerSearch) {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8", Allow: "GET" });
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return true;
  }
  if (typeof providerSearch !== "function") {
    res.writeHead(503, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: false, error: "Product providers are not configured. No demo products are returned." }));
    return true;
  }
  try {
    const url = new URL(req.url, "http://localhost");
    const params = readParams(url);
    const result = await providerSearch(params);
    const rawItems = Array.isArray(result) ? result : result?.items;
    const items = Array.isArray(rawItems) ? rawItems.map(normalizeProduct).filter(Boolean) : [];
    const total = Number.isFinite(result?.total) ? Math.max(items.length, Number(result.total)) : items.length;
    const start = (params.page - 1) * params.pageSize;
    const pageItems = items.slice(start, start + params.pageSize);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify({ items: pageItems, total, page: params.page, pageSize: params.pageSize }));
  } catch {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: false, error: "Product provider request failed. Try again later." }));
  }
  return true;
}

module.exports = { handleProductDiscoveryRequest, normalizeProduct, readParams };
