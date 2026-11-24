export type PriceTier = "Low" | "Medium" | "High";
export type EvidenceStatus = "verified" | "partial" | "insufficient";

export interface ProductReviewSource {
  platform: "YouTube" | "Reddit" | "Google" | "Store" | "Editorial" | string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  summary?: string;
  verified?: boolean;
}

export interface DiscoveryProduct {
  id: string;
  title: string;
  brand?: string;
  category: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  originalPrice?: number;
  buyUrl?: string;
  affiliateNetwork?: "ClickBank" | "ShareASale" | "Amazon" | "Other" | string;
  rating?: number;
  reviewCount?: number;
  reviewSources?: ProductReviewSource[];
  pros?: string[];
  cons?: string[];
  updatedAt?: string;
  availability?: "in-stock" | "out-of-stock" | "unknown";
  evidenceStatus?: EvidenceStatus;
  /** Optional provider-supplied label. Never treated as verified without evidence. */
  providerRecommendation?: "suitable" | "caution" | "avoid";
}

export interface DiscoverySearchParams {
  query: string;
  category?: string;
  tier?: PriceTier | "All";
  budget?: number;
  currency?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating";
  page?: number;
  pageSize?: number;
}

export interface DiscoveryResponse {
  items: DiscoveryProduct[];
  total: number;
  page: number;
  pageSize: number;
  source: "api" | "provided";
  warnings?: string[];
}

export interface TieredProducts {
  Low: DiscoveryProduct[];
  Medium: DiscoveryProduct[];
  High: DiscoveryProduct[];
}

export function classifyPriceTier(price: number, budget: number): PriceTier {
  if (!Number.isFinite(price) || price < 0) return "High";
  if (!Number.isFinite(budget) || budget <= 0) return "Medium";
  if (price <= budget * 0.75) return "Low";
  if (price <= budget) return "Medium";
  return "High";
}

export function assessEvidence(product: DiscoveryProduct): {
  status: EvidenceStatus;
  averageRating: number | null;
  totalReviews: number;
  label: "Evidence available" | "Limited evidence" | "Not enough evidence";
} {
  const sources = product.reviewSources ?? [];
  const validRatings = sources.filter(
    (source) => Number.isFinite(source.rating) && (source.rating as number) >= 0 && (source.rating as number) <= 5,
  );
  const totalReviews = sources.reduce(
    (sum, source) => sum + (Number.isFinite(source.reviewCount) && (source.reviewCount as number) > 0 ? source.reviewCount as number : 0),
    0,
  );
  const averageRating = validRatings.length
    ? validRatings.reduce((sum, source) => sum + (source.rating as number), 0) / validRatings.length
    : Number.isFinite(product.rating) ? product.rating as number : null;
  const verifiedSources = sources.filter((source) => source.verified && source.url).length;
  const status: EvidenceStatus =
    verifiedSources >= 2 && totalReviews >= 20 ? "verified" :
    validRatings.length > 0 || totalReviews > 0 ? "partial" : "insufficient";
  return {
    status,
    averageRating,
    totalReviews: Math.max(totalReviews, product.reviewCount ?? 0),
    label: status === "verified" ? "Evidence available" : status === "partial" ? "Limited evidence" : "Not enough evidence",
  };
}

export function isSafeExternalUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !["example.com", "www.example.com"].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function validateProduct(value: unknown): value is DiscoveryProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 &&
    typeof item.title === "string" && item.title.trim().length > 0 &&
    typeof item.category === "string" && item.category.trim().length > 0 &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.currency === "string" && item.currency.trim().length > 0;
}

export function filterAndSortProducts(
  products: DiscoveryProduct[],
  params: DiscoverySearchParams,
): DiscoveryProduct[] {
  const query = params.query.trim().toLocaleLowerCase();
  const filtered = products.filter((product) => {
    const searchable = [product.title, product.brand, product.category, product.description]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = !params.category || params.category === "All" || product.category === params.category;
    const hasBudget = Number.isFinite(params.budget) && (params.budget ?? 0) > 0;
    const matchesTier = !params.tier || params.tier === "All" || !hasBudget ||
      classifyPriceTier(product.price, params.budget as number) === params.tier;
    return matchesQuery && matchesCategory && matchesTier;
  });
  switch (params.sort ?? "relevance") {
    case "price-asc": return filtered.sort((a, b) => a.price - b.price);
    case "price-desc": return filtered.sort((a, b) => b.price - a.price);
    case "rating": return filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default: return filtered;
  }
}
