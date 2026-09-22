/**
 * Admin auth: supports multi-admin with roles (super / sub)
 * Quantum Fate Lite · DB-backed admins + legacy env fallback
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { getAdminByName, hashPasswordLegacy, getSetting, upsertAdmin } from "@/lib/db";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "qfl_admin";
const DEFAULT_SESSION_TTL_SECONDS = 2 * 60 * 60;

function getSessionTtlSeconds(): number {
  const hours = parseInt(getSetting("admin_session_ttl_hours") || "2", 10);
  if (!Number.isFinite(hours) || hours < 0.25) return DEFAULT_SESSION_TTL_SECONDS;
  return hours * 3600;
}

function getSecret(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 6) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_PASSWORD must be set and at least 6 chars in production"
      );
    }
  }
  const raw = (pwd ?? "dev-only-do-not-use-in-production").padEnd(64, "x");
  return raw;
}

function sign(payload: string): string {
  const h = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${h}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
  } catch {
    return null;
  }
  return payload;
}

export function makeToken(adminId: string, role: string): { token: string; maxAgeSeconds: number } {
  const ttl = getSessionTtlSeconds();
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = `${adminId}.${role}.${exp}.${randomBytes(8).toString("hex")}`;
  return { token: sign(payload), maxAgeSeconds: ttl };
}

export interface TokenInfo {
  adminId: string;
  role: "super" | "sub";
  exp: number;
}

export function parseToken(token: string | undefined | null): TokenInfo | null {
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const parts = payload.split(".");
  if (parts.length !== 4) return null;
  const [adminId, role, expStr] = parts;
  if (!adminId || !role || !expStr) return null;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  if (role !== "super" && role !== "sub") return null;
  return { adminId, role: role as "super" | "sub", exp };
}

export function isValidToken(token: string | undefined | null): boolean {
  return parseToken(token) !== null;
}

export function getTokenRole(token: string | undefined | null): "super" | "sub" | null {
  const info = parseToken(token);
  return info?.role ?? null;
}

export function isSuperAdmin(token: string | undefined | null): boolean {
  return getTokenRole(token) === "super";
}

export interface LoginResult {
  ok: boolean;
  token?: string;
  role?: "super" | "sub";
  adminId?: string;
  error?: string;
}

export function checkAdminLogin(name: string, password: string): LoginResult {
  if (!name || !password) {
    return { ok: false, error: "missing_fields" };
  }
  const admin = getAdminByName(name);
  if (!admin || admin.enabled !== 1) {
    return { ok: false, error: "not_found" };
  }
  const storedHash = admin.password_hash;

  let verified = false;
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    verified = bcrypt.compareSync(password, storedHash);
  } else {
    const hash = hashPasswordLegacy(password);
    try {
      if (
        !timingSafeEqual(
          Buffer.from(hash, "hex"),
          Buffer.from(storedHash, "hex")
        )
      ) {
        return { ok: false, error: "wrong_password" };
      }
      verified = true;
    } catch {
      return { ok: false, error: "wrong_password" };
    }
  }

  if (!verified) {
    return { ok: false, error: "wrong_password" };
  }

  if (!storedHash.startsWith("$2a$") && !storedHash.startsWith("$2b$")) {
    const newHash = bcrypt.hashSync(password, 10);
    upsertAdmin({ ...admin, password_hash: newHash, updated_at: Date.now() });
  }

  const role = admin.role === "super" ? "super" : "sub";
  const { token } = makeToken(admin.id, role);
  return { ok: true, token, role, adminId: admin.id };
}

export function checkPassword(input: string | undefined | null): boolean {
  if (!input) return false;
  let pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    if (process.env.NODE_ENV === "production") return false;
    pwd = "change_me_in_production";
  }
  if (input.length !== pwd.length) return false;
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(pwd));
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export function getAdminCookieMaxAge(): number { return getSessionTtlSeconds(); }
