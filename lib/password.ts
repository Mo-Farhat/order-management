import bcrypt from "bcryptjs";

/**
 * bcrypt work factor. 10 (~60–90ms) instead of 12 (~250–400ms) so signup and
 * login stay well inside Cloudflare Workers' per-request CPU budget — cost 12
 * hashing was overrunning it and returning a 500 ("this page couldn't load").
 *
 * `bcrypt.compare` reads the cost from the stored hash, so accounts created at
 * cost 12 keep working unchanged.
 */
export const BCRYPT_COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
