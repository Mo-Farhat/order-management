import { describe, it, expect } from "vitest";
import { can, assertCan, ForbiddenError, CAPABILITIES } from "@/lib/rbac";

describe("RBAC matrix (PRD §7.1)", () => {
  it("owner has every capability", () => {
    for (const cap of CAPABILITIES) expect(can("owner", cap)).toBe(true);
  });

  it("staff can work the catalog and orders but not destructive / owner-only actions", () => {
    expect(can("staff", "catalog:edit")).toBe(true);
    expect(can("staff", "order:create")).toBe(true);
    expect(can("staff", "order:advance")).toBe(true);
    expect(can("staff", "view")).toBe(true);

    expect(can("staff", "catalog:delete_product")).toBe(false);
    expect(can("staff", "order:edit_past_confirmed")).toBe(false);
    expect(can("staff", "billing")).toBe(false);
  });

  it("viewer is read-only", () => {
    expect(can("viewer", "view")).toBe(true);
    for (const cap of CAPABILITIES) {
      if (cap === "view") continue;
      expect(can("viewer", cap)).toBe(false);
    }
  });

  it("assertCan throws ForbiddenError when the capability is missing", () => {
    expect(() => assertCan("viewer", "order:create")).toThrow(ForbiddenError);
    expect(() => assertCan("owner", "order:create")).not.toThrow();
  });
});
