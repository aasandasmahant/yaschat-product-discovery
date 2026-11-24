import { describe, expect, it } from "vitest";
import {
  assessEvidence,
  classifyPriceTier,
  filterAndSortProducts,
  isSafeExternalUrl,
  validateProduct,
  DiscoveryProduct,
} from "./yasChatDiscovery";

const product: DiscoveryProduct = {
  id: "phone-1", title: "Sample phone", category: "Electronics",
  price: 7000, currency: "INR", rating: 4.2, reviewCount: 80,
  reviewSources: [
    { platform: "Store", url: "https://shop.example.org/reviews", rating: 4.2, reviewCount: 40, verified: true },
    { platform: "Editorial", url: "https://review.example.org/phone", rating: 4.1, reviewCount: 40, verified: true },
  ],
};

describe("YAS Chat Product Discovery rules", () => {
  it("classifies prices against a user budget", () => {
    expect(classifyPriceTier(500, 1000)).toBe("Low");
    expect(classifyPriceTier(900, 1000)).toBe("Medium");
    expect(classifyPriceTier(1200, 1000)).toBe("High");
  });

  it("does not filter price bands until a budget exists", () => {
    expect(filterAndSortProducts([product], { query: "", tier: "Low" })).toHaveLength(1);
  });

  it("requires review-source evidence before showing verified status", () => {
    expect(assessEvidence(product).status).toBe("verified");
    expect(assessEvidence({ ...product, reviewSources: [] }).status).toBe("partial");
    expect(assessEvidence({ ...product, reviewSources: [], rating: undefined, reviewCount: 0 }).status).toBe("insufficient");
  });

  it("rejects obvious placeholder and non-http links", () => {
    expect(isSafeExternalUrl("https://example.com/item")).toBe(false);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("https://merchant.example.org/item")).toBe(true);
  });

  it("validates required product fields", () => {
    expect(validateProduct(product)).toBe(true);
    expect(validateProduct({ ...product, price: -1 })).toBe(false);
  });
});
