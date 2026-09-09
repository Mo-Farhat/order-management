import { describe, expect, it } from "vitest";
import {
  FEATURES_BY_TIER,
  honoredConfig,
  pickAllowedConfig,
  showsPoweredBy,
  tierAllows,
  tierFor,
  tierRank,
} from "@/lib/entitlements";

describe("tierAllows", () => {
  it("gates by cumulative tier", () => {
    expect(tierAllows("basic", "logoUpload")).toBe(true);
    expect(tierAllows("basic", "bannerImage")).toBe(false);
    expect(tierAllows("studio", "bannerImage")).toBe(true);
    expect(tierAllows("studio", "readApi")).toBe(false);
    expect(tierAllows("pro", "readApi")).toBe(true);
  });

  it("treats nullish tier as basic", () => {
    expect(tierAllows(null, "logoUpload")).toBe(true);
    expect(tierAllows(undefined, "bannerImage")).toBe(false);
  });

  it("is cumulative — pro has every studio feature", () => {
    for (const f of FEATURES_BY_TIER.studio) expect(FEATURES_BY_TIER.pro.has(f)).toBe(true);
    for (const f of FEATURES_BY_TIER.basic) expect(FEATURES_BY_TIER.studio.has(f)).toBe(true);
  });
});

describe("tierRank / tierFor", () => {
  it("orders basic < studio < pro", () => {
    expect(tierRank("basic")).toBeLessThan(tierRank("studio"));
    expect(tierRank("studio")).toBeLessThan(tierRank("pro"));
  });
  it("tierFor returns the unlocking tier", () => {
    expect(tierFor("logoUpload")).toBe("basic");
    expect(tierFor("bannerImage")).toBe("studio");
    expect(tierFor("removePoweredBy")).toBe("pro");
  });
});

describe("pickAllowedConfig", () => {
  it("drops keys the tier doesn't allow", () => {
    const raw = { tagline: "hi", heroTitle: "Big", onAccentColor: "#ffffff", font: "serif" as const };
    expect(pickAllowedConfig(raw, "basic")).toEqual({ onAccentColor: "#ffffff" });
    expect(pickAllowedConfig(raw, "studio")).toEqual(raw);
  });
});

describe("honoredConfig", () => {
  it("merges defaults and always returns full sections", () => {
    const c = honoredConfig("basic", null);
    expect(c.font).toBe("sans");
    expect(c.bgTone).toBe("default");
    expect(c.defaultSort).toBe("newest");
    expect(c.sections).toEqual({
      banner: true,
      policyNote: true,
      categoryNav: true,
      poweredBy: true,
    });
  });

  it("keeps stored studio values only while the tier allows them", () => {
    const stored = { tagline: "Fresh drops", font: "serif" as const, defaultSort: "price_asc" as const };
    expect(honoredConfig("studio", stored)).toMatchObject({ tagline: "Fresh drops", font: "serif", defaultSort: "price_asc" });
    // downgrade: values persist in the row but are not honored
    const down = honoredConfig("basic", stored);
    expect(down.tagline).toBeUndefined();
    expect(down.font).toBe("sans");
    expect(down.defaultSort).toBe("newest");
  });

  it("honors explicit section = false only when tier allows toggles", () => {
    const cfg = { sections: { banner: false } };
    expect(honoredConfig("studio", cfg).sections.banner).toBe(false);
    expect(honoredConfig("basic", cfg).sections.banner).toBe(true);
  });
});

describe("showsPoweredBy", () => {
  it("is always true below pro", () => {
    expect(showsPoweredBy("basic", { sections: { poweredBy: false } })).toBe(true);
    expect(showsPoweredBy("studio", { sections: { poweredBy: false } })).toBe(true);
  });
  it("pro can hide it", () => {
    expect(showsPoweredBy("pro", { sections: { poweredBy: false } })).toBe(false);
    expect(showsPoweredBy("pro", { sections: { poweredBy: true } })).toBe(true);
    expect(showsPoweredBy("pro", null)).toBe(true);
  });
});
