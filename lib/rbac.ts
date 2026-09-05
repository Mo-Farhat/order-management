import type { Role } from "@/db/schema";

/**
 * RBAC capability matrix (PRD §7.1).
 *
 * v1 ships single-user-per-account, so in practice every signed-in user is an
 * `owner`. The matrix and `can()` are built now so that adding the Staff/Viewer
 * invite UI in v1.1 is not a rearchitecture. Enforcement is always server-side,
 * on every mutation, after `tenantId` scoping — never trusted from the client.
 */

export const CAPABILITIES = [
  "catalog:edit",
  "catalog:delete_product",
  "order:create",
  "order:advance",
  "order:edit_past_confirmed",
  "view",
  "billing",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const MATRIX: Record<Role, ReadonlySet<Capability>> = {
  owner: new Set(CAPABILITIES),
  staff: new Set<Capability>([
    "catalog:edit",
    "order:create",
    "order:advance",
    "view",
  ]),
  viewer: new Set<Capability>(["view"]),
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[role]?.has(capability) ?? false;
}

export class ForbiddenError extends Error {
  constructor(capability: Capability) {
    super(`Missing capability: ${capability}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, capability: Capability): void {
  if (!can(role, capability)) throw new ForbiddenError(capability);
}
