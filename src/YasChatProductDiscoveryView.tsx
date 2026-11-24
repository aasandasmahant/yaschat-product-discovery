import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  assessEvidence,
  classifyPriceTier,
  DiscoveryProduct,
  DiscoverySearchParams,
  filterAndSortProducts,
  isSafeExternalUrl,
  PriceTier,
} from "./yasChatDiscovery";
import { searchDiscoveryProducts } from "./yasChatDiscoveryApi";

export interface YasChatProductDiscoveryViewProps {
  apiBaseUrl?: string;
  initialItems?: DiscoveryProduct[];
  defaultCurrency?: string;
  pageSize?: number;
  onProductOpen?: (product: DiscoveryProduct) => void;
}

const tiers: Array<PriceTier | "All"> = ["All", "Low", "Medium", "High"];
const panel: React.CSSProperties = {
  background: "#111d38", border: "1px solid #263b68", borderRadius: 14,
  padding: 14, color: "#eef4ff",
};
const button: React.CSSProperties = {
  border: "1px solid #36517f", borderRadius: 9, padding: "9px 12px",
  background: "#17294b", color: "#eef4ff", cursor: "pointer", fontWeight: 600,
};
const field: React.CSSProperties = {
  minWidth: 0, width: "100%", boxSizing: "border-box", border: "1px solid #38517c",
  borderRadius: 9, padding: "10px 12px", background: "#0b152b", color: "#fff",
};

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function ProductCard({
  product, budget, onOpen,
}: { product: DiscoveryProduct; budget: number; onOpen?: (product: DiscoveryProduct) => void }) {
  const evidence = assessEvidence(product);
  const tier = classifyPriceTier(product.price, budget);
  const safeBuyUrl = isSafeExternalUrl(product.buyUrl) ? product.buyUrl : undefined;
  const recommendation = product.providerRecommendation;
  const recommendationLabel = recommendation === "suitable" ? "Provider marked suitable"
    : recommendation === "caution" ? "Check carefully"
    : recommendation === "avoid" ? "Provider marked avoid" : "No purchase verdict";
  return (
    <article style={{ ...panel, display: "grid", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", color: "#93c5fd" }}>{tier.toUpperCase()} PRICE BAND</span>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>{evidence.label}</span>
      </div>
      {product.imageUrl && isSafeExternalUrl(product.imageUrl) ? (
        <img src={product.imageUrl} alt={product.title} loading="lazy"
          style={{ width: "100%", height: 170, objectFit: "contain", borderRadius: 10, background: "#0b152b" }} />
      ) : (
        <div role="img" aria-label="No product image supplied"
          style={{ height: 90, display: "grid", placeItems: "center", background: "#0b152b", borderRadius: 10, color: "#94a3b8" }}>
          Product image not supplied
        </div>
      )}
      <div>
        <div style={{ fontSize: 12, color: "#93c5fd" }}>{product.brand || product.category}</div>
        <h3 style={{ margin: "4px 0", fontSize: 17, lineHeight: 1.35 }}>{product.title}</h3>
        {product.description && <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{product.description}</p>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <strong style={{ fontSize: 19 }}>{money(product.price, product.currency)}</strong>
        {product.originalPrice && product.originalPrice > product.price &&
          <span style={{ color: "#94a3b8", textDecoration: "line-through", fontSize: 12 }}>{money(product.originalPrice, product.currency)}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#dbeafe" }}>
        {product.rating !== undefined && <span>Rating supplied: {product.rating.toFixed(1)}/5</span>}
        {product.reviewCount !== undefined && <span>{product.reviewCount.toLocaleString()} reviews supplied</span>}
        <span>{recommendationLabel}</span>
      </div>
      {(product.pros?.length || product.cons?.length) ? (
        <div style={{ display: "grid", gap: 7, fontSize: 12 }}>
          {!!product.pros?.length && <div><strong style={{ color: "#86efac" }}>Potential advantages:</strong> {product.pros.join(" · ")}</div>}
          {!!product.cons?.length && <div><strong style={{ color: "#fca5a5" }}>Limitations:</strong> {product.cons.join(" · ")}</div>}
        </div>
      ) : null}
      <div style={{ fontSize: 11, color: "#aebed8" }}>
        Review evidence: {evidence.status}. {evidence.totalReviews ? `${evidence.totalReviews.toLocaleString()} review count reported` : "No review count supplied"}.
        {product.updatedAt ? ` Data updated: ${new Date(product.updatedAt).toLocaleDateString()}. ` : " "}
        Ratings and summaries are shown as supplied by the connected provider; verify details at source.
      </div>
      {!!product.reviewSources?.length && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {product.reviewSources.map((source, index) => isSafeExternalUrl(source.url) ? (
            <a key={`${source.platform}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer"
              style={{ color: "#7dd3fc", fontSize: 11 }}>{source.platform} source ↗</a>
          ) : <span key={`${source.platform}-${index}`} style={{ color: "#94a3b8", fontSize: 11 }}>{source.platform} (no source link)</span>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {safeBuyUrl ? <a href={safeBuyUrl} target="_blank" rel="sponsored nofollow noopener noreferrer"
          onClick={() => onOpen?.(product)}
          style={{ ...button, background: "#2563eb", textDecoration: "none", display: "inline-block" }}>
          View merchant offer
        </a> : <span style={{ fontSize: 12, color: "#fbbf24" }}>Verified merchant link not supplied</span>}
        <button type="button" style={button} onClick={() => onOpen?.(product)}>Product details</button>
      </div>
    </article>
  );
}

export default function YasChatProductDiscoveryView({
  apiBaseUrl,
  initialItems = [],
  defaultCurrency = "INR",
  pageSize = 30,
  onProductOpen,
}: YasChatProductDiscoveryViewProps) {
  const [items, setItems] = useState<DiscoveryProduct[]>(initialItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [tier, setTier] = useState<PriceTier | "All">("All");
  const [budgetText, setBudgetText] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [sort, setSort] = useState<DiscoverySearchParams["sort"]>("relevance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiConnected, setApiConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category))).sort()],
    [items],
  );
  const budget = Number(budgetText);
  const filteredItems = useMemo(() => filterAndSortProducts(items, {
    query, category, tier, budget: Number.isFinite(budget) ? budget : 0, currency, sort,
  }), [items, query, category, tier, budget, currency, sort]);

  const runSearch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await searchDiscoveryProducts({
        query, category, tier, budget: Number.isFinite(budget) && budget > 0 ? budget : undefined,
        currency, sort, page: 1, pageSize,
      }, { baseUrl: apiBaseUrl, signal });
      setItems(response.items);
      setApiConnected(true);
      setLastUpdated(new Date().toISOString());
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setApiConnected(false);
      setError(cause instanceof Error ? cause.message : "Product search is currently unavailable.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiBaseUrl, budget, category, currency, pageSize, query, sort, tier]);

  useEffect(() => {
    const controller = new AbortController();
    void runSearch(controller.signal);
    return () => controller.abort();
  }, []); // Initial load only. Search is submitted explicitly by the user.

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void runSearch();
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setTier("All");
    setBudgetText("");
    setSort("relevance");
  };

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 12, color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ ...panel, marginBottom: 12, background: "linear-gradient(135deg,#0b1734,#172d55)" }}>
        <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 800, letterSpacing: ".12em" }}>YAS CHAT · DISCOVERY</div>
        <h1 style={{ fontSize: 23, margin: "5px 0" }}>Find products with clearer evidence</h1>
        <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13 }}>Compare budget bands, merchant details and available review sources before deciding.</p>
      </header>

      <form onSubmit={submit} style={{ ...panel, display: "grid", gap: 10, marginBottom: 12 }}>
        <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Search product or category
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. smartphone, headphones, kitchen mixer" style={field} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 9 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Your budget
            <input type="number" min="0" step="any" value={budgetText} onChange={(event) => setBudgetText(event.target.value)} placeholder="Enter budget" style={field} />
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Currency
            <select value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} style={field}>
              {["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"].map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} style={field}>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as DiscoverySearchParams["sort"])} style={field}>
              <option value="relevance">Relevance</option><option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option><option value="rating">Rating supplied</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
          {tiers.map((value) => <button key={value} type="button" aria-pressed={tier === value}
            onClick={() => setTier(value)} style={{ ...button, background: tier === value ? "#1d4ed8" : "#17294b" }}>{value === "All" ? "All budgets" : `${value} price`}</button>)}
          <button type="submit" style={{ ...button, background: "#0e7490" }} disabled={loading}>{loading ? "Searching…" : "Search"}</button>
          <button type="button" style={button} onClick={clearFilters}>Clear filters</button>
        </div>
        <div style={{ fontSize: 11, color: "#9fb2d1" }}>
          Low: up to 75% of budget · Medium: 75–100% · High: above budget. These are price bands, not quality scores.
        </div>
      </form>

      <section style={{ ...panel, marginBottom: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
        <span>Product API: <strong style={{ color: apiConnected ? "#86efac" : "#fbbf24" }}>{apiConnected ? "Connected" : "Not confirmed"}</strong></span>
        <span>{filteredItems.length} products shown</span>
        {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
      </section>

      {error && <div role="alert" style={{ ...panel, borderColor: "#92400e", color: "#fde68a", marginBottom: 12 }}>
        <strong>Live product data is not connected.</strong><p style={{ margin: "5px 0 0", fontSize: 13 }}>{error}</p>
        <p style={{ margin: "5px 0 0", fontSize: 12 }}>The existing legacy endpoint /api/discover stores community cards. A separate /api/discover/products backend route and approved product feeds are required for real product search.</p>
        {initialItems.length > 0 && <button type="button" style={button} onClick={() => setItems(initialItems)}>Show supplied preview data</button>}
      </div>}

      {loading && <p role="status" style={{ textAlign: "center", color: "#bfdbfe" }}>Loading product results…</p>}
      {!loading && filteredItems.length === 0 && <div style={{ ...panel, textAlign: "center", padding: 26 }}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>No verified product records to show</h2>
        <p style={{ color: "#cbd5e1", fontSize: 13 }}>Connect the product API or provide real product records. YAS Chat will not invent product prices, images, ratings or affiliate links.</p>
      </div>}

      <section aria-label="Product results" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 12 }}>
        {filteredItems.map((product) => <ProductCard key={product.id} product={product} budget={budget} onOpen={onProductOpen} />)}
      </section>

      <footer style={{ marginTop: 14, color: "#94a3b8", fontSize: 11, lineHeight: 1.5 }}>
        Affiliate disclosure: YAS Chat may receive a commission when a user buys through a qualifying link. This does not change the evidence labels. Always confirm final price, shipping, seller and return policy on the merchant site.
      </footer>
    </main>
  );
}
