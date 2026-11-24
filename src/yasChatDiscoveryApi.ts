import {
  DiscoveryProduct,
  DiscoveryResponse,
  DiscoverySearchParams,
  validateProduct,
} from "./yasChatDiscovery";

export interface DiscoveryApiOptions {
  /** Base URL of the YAS Chat API, e.g. https://your-domain.example */
  baseUrl?: string;
  /** Defaults to /api/discover/products. This route must be implemented by the host backend. */
  endpoint?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

function buildUrl(baseUrl: string, endpoint: string, params: DiscoverySearchParams): string {
  const url = new URL(endpoint, baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost"));
  if (params.query) url.searchParams.set("q", params.query);
  if (params.category && params.category !== "All") url.searchParams.set("category", params.category);
  if (params.tier && params.tier !== "All") url.searchParams.set("tier", params.tier.toLowerCase());
  if (params.budget && params.budget > 0) url.searchParams.set("budget", String(params.budget));
  if (params.currency) url.searchParams.set("currency", params.currency);
  url.searchParams.set("sort", params.sort ?? "relevance");
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("pageSize", String(params.pageSize ?? 30));
  return url.toString();
}

export async function searchDiscoveryProducts(
  params: DiscoverySearchParams,
  options: DiscoveryApiOptions = {},
): Promise<DiscoveryResponse> {
  const fetcher = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? "/api/discover/products";
  const url = buildUrl(options.baseUrl ?? "", endpoint, params);
  const response = await fetcher(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? "Product Discovery API is not installed yet. The existing /api/discover route serves community cards, not product search."
      : `Product search failed (HTTP ${response.status}).`);
  }
  const payload = await response.json() as { items?: unknown[]; total?: number; page?: number; pageSize?: number };
  const items = Array.isArray(payload.items) ? payload.items.filter(validateProduct) as DiscoveryProduct[] : [];
  if (!Array.isArray(payload.items)) throw new Error("Invalid API response: expected an items array.");
  return {
    items,
    total: Number.isFinite(payload.total) ? Number(payload.total) : items.length,
    page: Number.isFinite(payload.page) ? Number(payload.page) : params.page ?? 1,
    pageSize: Number.isFinite(payload.pageSize) ? Number(payload.pageSize) : params.pageSize ?? 30,
    source: "api",
  };
}

/** Adapter for the legacy YAS CHAT community discovery-card route. It does not imply affiliate/product verification. */
export interface CommunityDiscoveryCard {
  id: string | number;
  cat: string;
  title: string;
  desc: string;
  rating?: string;
}

export async function fetchCommunityDiscoveryCards(baseUrl = ""): Promise<CommunityDiscoveryCard[]> {
  const response = await fetch(new URL("/api/discover", baseUrl || window.location.origin), {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(`Community discovery unavailable (HTTP ${response.status}).`);
  const payload = await response.json() as { discover?: CommunityDiscoveryCard[] };
  return Array.isArray(payload.discover) ? payload.discover : [];
}
