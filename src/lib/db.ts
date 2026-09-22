/**
 * SQLite layer (better-sqlite3)
 * Quantum Fate Lite · single-file DB at ./data/qfl.db
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

const DB_DIR = process.env.DATABASE_DIR
  ? path.resolve(process.env.DATABASE_DIR)
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "qfl.db");

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    throw new Error(
      `Cannot create database directory "${DB_DIR}": ${err instanceof Error ? err.message : err}. ` +
      `Set DATABASE_DIR env var to a writable path, or ensure the current working directory is correct.`
    );
  }
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      locale TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_hour INTEGER NOT NULL,
      gender TEXT NOT NULL,
      fate_book TEXT NOT NULL,
      template TEXT NOT NULL,
      input_json TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      content TEXT NOT NULL,
      ai_provider TEXT,
      ai_model TEXT,
      ai_latency_ms INTEGER,
      ip TEXT,
      report_tier TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_created_at
      ON reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_ip_created
      ON reports(ip, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_tier
      ON reports(report_tier);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_zh TEXT NOT NULL,
      description_en TEXT,
      description_zh TEXT,
      category TEXT NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'affiliate',
      url TEXT NOT NULL,
      price TEXT,
      delivery_info TEXT,
      tags TEXT,
      wuxing TEXT,
      locales TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      ts INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_ratelimit_ip_endpoint_ts
      ON rate_limits(ip, endpoint, ts DESC);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      type TEXT NOT NULL,
      ip TEXT,
      locale TEXT,
      meta TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_type_ts
      ON events(type, ts DESC);

    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'report',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled
      ON ai_providers(enabled, sort_order);
    CREATE INDEX IF NOT EXISTS idx_ai_providers_role
      ON ai_providers(role, enabled, sort_order);

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sub',
      password_hash TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      report_id TEXT,
      product_id TEXT NOT NULL,
      product_type TEXT NOT NULL,
      buyer_email TEXT,
      buyer_ip TEXT,
      amount TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      tracking_no TEXT,
      delivery_note TEXT,
      paid_at INTEGER,
      delivered_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status
      ON orders(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_product
      ON orders(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_email
      ON orders(buyer_email);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credits (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'premium',
      credits INTEGER NOT NULL DEFAULT 1,
      used INTEGER NOT NULL DEFAULT 0,
      buyer_email TEXT,
      ip TEXT,
      created_at INTEGER NOT NULL,
      used_at INTEGER,
      expires_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_credits_code
      ON credits(code);
    CREATE INDEX IF NOT EXISTS idx_credits_used
      ON credits(used, expires_at);

    CREATE TABLE IF NOT EXISTS admin_sessions (
      admin_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sub',
      last_heartbeat INTEGER NOT NULL,
      ip TEXT,
      PRIMARY KEY (admin_id)
    );

    CREATE TABLE IF NOT EXISTS report_cycles (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      years INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  safeAddColumn("reports", "ip", "TEXT");
  safeAddColumn("reports", "ai_latency_ms", "INTEGER");
  safeAddColumn("reports", "ai_provider", "TEXT");
  safeAddColumn("reports", "ai_model", "TEXT");
  safeAddColumn("reports", "report_tier", "TEXT NOT NULL DEFAULT 'free'");
  safeAddColumn("products", "product_type", "TEXT NOT NULL DEFAULT 'affiliate'");
  safeAddColumn("products", "delivery_info", "TEXT");
  safeAddColumn("ai_providers", "role", "TEXT NOT NULL DEFAULT 'primary'");

  db.prepare("UPDATE ai_providers SET role = 'primary' WHERE role = 'report'").run();
  db.prepare("UPDATE settings SET value = 'freemium' WHERE key = 'monetization_mode' AND value = 'both'").run();

  seedSuperAdmin(db);
  seedReportCycles(db);
}

function safeAddColumn(table: string, column: string, defSql: string): void {
  try {
    const cols = getDb()
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
      getDb().exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${defSql}`);
    }
  } catch {
  }
}

function seedSuperAdmin(db: Database.Database): void {
  const existing = db.prepare("SELECT * FROM admins WHERE id = ?").get("super-admin") as AdminRow | undefined;
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 6) return;
  const hash = hashPassword(pwd);
  if (existing) {
    if (!isBcryptHash(existing.password_hash) || !bcrypt.compareSync(pwd, existing.password_hash)) {
      db.prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?").run(hash, Date.now(), "super-admin");
    }
    return;
  }
  db.prepare(
    "INSERT OR IGNORE INTO admins (id, name, role, password_hash, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)"
  ).run("super-admin", "Super Admin", "super", hash, Date.now(), Date.now());
}

function seedReportCycles(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) AS c FROM report_cycles").get() as { c: number };
  if (count.c > 0) return;
  const now = Date.now();
  const defaults: ReportCycleRow[] = [
    { id: "1year", name_en: "Annual Energy", name_zh: "本年运势", years: 1, enabled: 1, sort_order: 0, created_at: now, updated_at: now },
    { id: "3year", name_en: "3-Year Cycle", name_zh: "三年运势", years: 3, enabled: 1, sort_order: 1, created_at: now, updated_at: now },
    { id: "5year", name_en: "5-Year Cycle", name_zh: "五年运势", years: 5, enabled: 1, sort_order: 2, created_at: now, updated_at: now },
    { id: "10year", name_en: "10-Year Cycle", name_zh: "十年运势", years: 10, enabled: 1, sort_order: 3, created_at: now, updated_at: now },
  ];
  const stmt = db.prepare(
    "INSERT INTO report_cycles (id, name_en, name_zh, years, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const c of defaults) {
    stmt.run(c.id, c.name_en, c.name_zh, c.years, c.enabled, c.sort_order, c.created_at, c.updated_at);
  }
}

export function hashPassword(pwd: string): string {
  return bcrypt.hashSync(pwd, 10);
}

export function hashPasswordLegacy(pwd: string): string {
  return createHash("sha256").update(pwd).digest("hex");
}

export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$");
}

export interface ReportRow {
  id: string;
  locale: string;
  birth_date: string;
  birth_hour: number;
  gender: string;
  fate_book: string;
  template: string;
  input_json: string;
  analysis_json: string;
  content: string;
  ai_provider: string | null;
  ai_model: string | null;
  ai_latency_ms: number | null;
  ip: string | null;
  report_tier: string;
  created_at: number;
  updated_at: number;
}

export interface ProductRow {
  id: string;
  title_en: string;
  title_zh: string;
  description_en: string | null;
  description_zh: string | null;
  category: string;
  product_type: string;
  url: string;
  price: string | null;
  delivery_info: string | null;
  tags: string | null;
  wuxing: string | null;
  locales: string | null;
  featured: number;
  active: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

/* ---------- reports ---------- */
export function insertReport(row: ReportRow): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO reports
     (id, locale, birth_date, birth_hour, gender, fate_book, template,
      input_json, analysis_json, content, ai_provider, ai_model, ai_latency_ms,
      ip, report_tier, created_at, updated_at)
     VALUES
     (@id, @locale, @birth_date, @birth_hour, @gender, @fate_book, @template,
      @input_json, @analysis_json, @content, @ai_provider, @ai_model, @ai_latency_ms,
      @ip, @report_tier, @created_at, @updated_at)`
  ).run(row);
}

export function getReport(id: string): ReportRow | undefined {
  return getDb()
    .prepare<[string], ReportRow>("SELECT * FROM reports WHERE id = ?")
    .get(id);
}

export function listRecentByIp(
  ip: string,
  withinMs: number,
  limit: number
): ReportRow[] {
  const since = Date.now() - withinMs;
  return getDb()
    .prepare<[string, number, number], ReportRow>(
      `SELECT * FROM reports
       WHERE ip = ? AND created_at >= ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(ip, since, limit);
}

/* ---------- products ---------- */
export function listActiveProducts(locale?: string): ProductRow[] {
  const db = getDb();
  const rows = db
    .prepare<[], ProductRow>(
      "SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, created_at DESC"
    )
    .all();
  if (!locale) return rows;
  return rows.filter((r) => {
    if (!r.locales) return true;
    try {
      const arr = JSON.parse(r.locales) as string[];
      return arr.includes(locale);
    } catch {
      return true;
    }
  });
}

export function upsertProduct(row: ProductRow): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO products
       (id, title_en, title_zh, description_en, description_zh, category, product_type, url, price,
        delivery_info, tags, wuxing, locales, featured, active, sort_order, created_at, updated_at)
       VALUES
       (@id, @title_en, @title_zh, @description_en, @description_zh, @category, @product_type, @url, @price,
        @delivery_info, @tags, @wuxing, @locales, @featured, @active, @sort_order, @created_at, @updated_at)`
    )
    .run(row);
}

export function deleteProduct(id: string): void {
  getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function countProducts(): number {
  const r = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM products")
    .get();
  return r?.c ?? 0;
}

/* ---------- rate limit ---------- */
export function recordRateHit(
  ip: string,
  endpoint: string,
  ts: number
): void {
  getDb()
    .prepare(
      "INSERT INTO rate_limits (ip, endpoint, ts, count) VALUES (?, ?, ?, 1)"
    )
    .run(ip, endpoint, ts);
}

export function countRateHits(
  ip: string,
  endpoint: string,
  since: number
): number {
  const r = getDb()
    .prepare<[string, string, number], { c: number }>(
      "SELECT COUNT(*) AS c FROM rate_limits WHERE ip = ? AND endpoint = ? AND ts >= ?"
    )
    .get(ip, endpoint, since);
  return r?.c ?? 0;
}

export function pruneRateLimits(olderThan: number): number {
  const r = getDb()
    .prepare<[number]>("DELETE FROM rate_limits WHERE ts < ?")
    .run(olderThan);
  return r.changes;
}

/* ---------- events ---------- */
export function logEvent(
  type: string,
  meta?: Record<string, unknown>,
  ip?: string,
  locale?: string
): void {
  getDb()
    .prepare(
      "INSERT INTO events (ts, type, ip, locale, meta) VALUES (?, ?, ?, ?, ?)"
    )
    .run(Date.now(), type, ip ?? null, locale ?? null, meta ? JSON.stringify(meta) : null);
}

export function countEvents(type: string, since: number): number {
  const r = getDb()
    .prepare<[string, number], { c: number }>(
      "SELECT COUNT(*) AS c FROM events WHERE type = ? AND ts >= ?"
    )
    .get(type, since);
  return r?.c ?? 0;
}

export function shutdownDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ============ AI Providers (DB-backed, editable from /admin) ============

export interface AIProviderRow {
  id: string;
  name: string;
  base_url: string;
  model: string;
  api_key: string;
  role: string;
  enabled: number;
  sort_order: number;
  note: string | null;
  created_at: number;
  updated_at: number;
}

export function listAIProviders(): AIProviderRow[] {
  return getDb()
    .prepare<[], AIProviderRow>(
      "SELECT * FROM ai_providers ORDER BY sort_order ASC, created_at ASC"
    )
    .all();
}

export function listEnabledAIProviders(): AIProviderRow[] {
  return getDb()
    .prepare<[], AIProviderRow>(
      "SELECT * FROM ai_providers WHERE enabled = 1 ORDER BY CASE WHEN role = 'primary' THEN 0 ELSE 1 END, sort_order ASC, created_at ASC"
    )
    .all();
}


export function getAIProvider(id: string): AIProviderRow | undefined {
  return getDb()
    .prepare<[string], AIProviderRow>("SELECT * FROM ai_providers WHERE id = ?")
    .get(id);
}

export function upsertAIProvider(row: AIProviderRow): void {
  getDb()
    .prepare(
      `INSERT INTO ai_providers
         (id, name, base_url, model, api_key, role, enabled, sort_order, note, created_at, updated_at)
       VALUES (@id, @name, @base_url, @model, @api_key, @role, @enabled, @sort_order, @note, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         base_url = excluded.base_url,
         model = excluded.model,
         api_key = excluded.api_key,
         role = excluded.role,
         enabled = excluded.enabled,
         sort_order = excluded.sort_order,
         note = excluded.note,
         updated_at = excluded.updated_at`
    )
    .run(row);
}

export function deleteAIProvider(id: string): void {
  getDb().prepare("DELETE FROM ai_providers WHERE id = ?").run(id);
}

export function countAIProviders(): number {
  const r = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM ai_providers")
    .get();
  return r?.c ?? 0;
}

// ============ Report Cycles ============

export interface ReportCycleRow {
  id: string;
  name_en: string;
  name_zh: string;
  years: number;
  enabled: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export function listReportCycles(): ReportCycleRow[] {
  return getDb()
    .prepare<[], ReportCycleRow>("SELECT * FROM report_cycles ORDER BY sort_order ASC, created_at ASC")
    .all();
}

export function listEnabledReportCycles(): ReportCycleRow[] {
  return getDb()
    .prepare<[], ReportCycleRow>("SELECT * FROM report_cycles WHERE enabled = 1 ORDER BY sort_order ASC, created_at ASC")
    .all();
}

export function upsertReportCycle(row: ReportCycleRow): void {
  getDb().prepare(
    `INSERT INTO report_cycles (id, name_en, name_zh, years, enabled, sort_order, created_at, updated_at)
     VALUES (@id, @name_en, @name_zh, @years, @enabled, @sort_order, @created_at, @updated_at)
     ON CONFLICT(id) DO UPDATE SET
       name_en = excluded.name_en,
       name_zh = excluded.name_zh,
       years = excluded.years,
       enabled = excluded.enabled,
       sort_order = excluded.sort_order,
       updated_at = excluded.updated_at`
  ).run(row);
}

export function deleteReportCycle(id: string): void {
  getDb().prepare("DELETE FROM report_cycles WHERE id = ?").run(id);
}

export function getReportCycle(id: string): ReportCycleRow | undefined {
  return getDb()
    .prepare<[string], ReportCycleRow>("SELECT * FROM report_cycles WHERE id = ?")
    .get(id);
}

// ============ Admins ============

export interface AdminRow {
  id: string;
  name: string;
  role: string;
  password_hash: string;
  enabled: number;
  created_at: number;
  updated_at: number;
}

export function listAdmins(): AdminRow[] {
  return getDb()
    .prepare<[], AdminRow>("SELECT * FROM admins ORDER BY role ASC, created_at ASC")
    .all();
}

export function getAdmin(id: string): AdminRow | undefined {
  return getDb()
    .prepare<[string], AdminRow>("SELECT * FROM admins WHERE id = ?")
    .get(id);
}

export function getAdminByName(name: string): AdminRow | undefined {
  return getDb()
    .prepare<[string], AdminRow>("SELECT * FROM admins WHERE name = ?")
    .get(name);
}

export function upsertAdmin(row: AdminRow): void {
  getDb()
    .prepare(
      `INSERT INTO admins (id, name, role, password_hash, enabled, created_at, updated_at)
       VALUES (@id, @name, @role, @password_hash, @enabled, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         role = excluded.role,
         password_hash = excluded.password_hash,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`
    )
    .run(row);
}

export function deleteAdmin(id: string): void {
  getDb().prepare("DELETE FROM admins WHERE id = ?").run(id);
}

export function countAdmins(): number {
  const r = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM admins")
    .get();
  return r?.c ?? 0;
}

// ============ Orders ============

export interface OrderRow {
  id: string;
  report_id: string | null;
  product_id: string;
  product_type: string;
  buyer_email: string | null;
  buyer_ip: string | null;
  amount: string | null;
  status: string;
  tracking_no: string | null;
  delivery_note: string | null;
  paid_at: number | null;
  delivered_at: number | null;
  created_at: number;
  updated_at: number;
}

export function listOrders(status?: string): OrderRow[] {
  if (status) {
    return getDb()
      .prepare<[string], OrderRow>("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC")
      .all(status);
  }
  return getDb()
    .prepare<[], OrderRow>("SELECT * FROM orders ORDER BY created_at DESC")
    .all();
}

export function getOrder(id: string): OrderRow | undefined {
  return getDb()
    .prepare<[string], OrderRow>("SELECT * FROM orders WHERE id = ?")
    .get(id);
}

export function insertOrder(row: OrderRow): void {
  getDb()
    .prepare(
      `INSERT INTO orders (id, report_id, product_id, product_type, buyer_email, buyer_ip,
       amount, status, tracking_no, delivery_note, paid_at, delivered_at, created_at, updated_at)
       VALUES (@id, @report_id, @product_id, @product_type, @buyer_email, @buyer_ip,
       @amount, @status, @tracking_no, @delivery_note, @paid_at, @delivered_at, @created_at, @updated_at)`
    )
    .run(row);
}

export function updateOrder(row: OrderRow): void {
  getDb()
    .prepare(
      `UPDATE orders SET
         report_id = @report_id, product_id = @product_id, product_type = @product_type,
         buyer_email = @buyer_email, buyer_ip = @buyer_ip, amount = @amount,
         status = @status, tracking_no = @tracking_no, delivery_note = @delivery_note,
         paid_at = @paid_at, delivered_at = @delivered_at, updated_at = @updated_at
       WHERE id = @id`
    )
    .run(row);
}

export function countOrders(status?: string): number {
  if (status) {
    const r = getDb()
      .prepare<[string], { c: number }>("SELECT COUNT(*) AS c FROM orders WHERE status = ?")
      .get(status);
    return r?.c ?? 0;
  }
  const r = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM orders")
    .get();
  return r?.c ?? 0;
}

// ============ Settings ============

export function getSetting(key: string): string | undefined {
  const r = getDb()
    .prepare<[string], { value: string }>("SELECT value FROM settings WHERE key = ?")
    .get(key);
  return r?.value;
}

export function setSetting(key: string, value: string): void {
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, value, now);
}

export function getAllSettings(): Array<{ key: string; value: string; updated_at: number }> {
  return getDb()
    .prepare<[], { key: string; value: string; updated_at: number }>("SELECT * FROM settings ORDER BY key")
    .all();
}

export function getSettingsMap(): Record<string, string> {
  const rows = getAllSettings();
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

// ============ Credits (卡密) ============

export interface CreditRow {
  id: string;
  code: string;
  tier: string;
  credits: number;
  used: number;
  buyer_email: string | null;
  ip: string | null;
  created_at: number;
  used_at: number | null;
  expires_at: number | null;
}

export function getCreditByCode(code: string): CreditRow | undefined {
  return getDb()
    .prepare<[string], CreditRow>("SELECT * FROM credits WHERE code = ?")
    .get(code);
}

export function insertCredit(row: CreditRow): void {
  getDb()
    .prepare(
      `INSERT INTO credits (id, code, tier, credits, used, buyer_email, ip, created_at, used_at, expires_at)
       VALUES (@id, @code, @tier, @credits, @used, @buyer_email, @ip, @created_at, @used_at, @expires_at)`
    )
    .run(row);
}

export function markCreditUsed(code: string, email: string | null, ip: string | null): boolean {
  const db = getDb();
  const row = db.prepare("SELECT * FROM credits WHERE code = ? AND used = 0").get(code) as CreditRow | undefined;
  if (!row) return false;
  if (row.expires_at && row.expires_at < Date.now()) return false;
  if (row.credits > 1) {
    const remaining = row.credits - 1;
    db.prepare(
      "UPDATE credits SET credits = ?, used = 0, buyer_email = ?, ip = ?, used_at = ? WHERE id = ?"
    ).run(remaining, email, ip, Date.now(), row.id);
  } else {
    db.prepare(
      "UPDATE credits SET used = 1, buyer_email = ?, ip = ?, used_at = ? WHERE id = ?"
    ).run(email, ip, Date.now(), row.id);
  }
  return true;
}

export function redeemCreditCode(code: string, email: string | null, ip: string | null): { ok: boolean; tier?: string; error?: string } {
  const db = getDb();
  const row = db.prepare("SELECT * FROM credits WHERE code = ?").get(code) as CreditRow | undefined;
  if (!row) return { ok: false, error: "code_not_found" };
  if (row.used && row.credits <= 0) return { ok: false, error: "code_already_used" };
  if (row.expires_at && row.expires_at < Date.now()) return { ok: false, error: "code_expired" };
  const marked = markCreditUsed(code, email, ip);
  if (!marked) return { ok: false, error: "code_already_used" };
  return { ok: true, tier: row.tier };
}

export function listCredits(used?: number): CreditRow[] {
  if (used !== undefined) {
    return getDb()
      .prepare<[number], CreditRow>("SELECT * FROM credits WHERE used = ? ORDER BY created_at DESC")
      .all(used);
  }
  return getDb()
    .prepare<[], CreditRow>("SELECT * FROM credits ORDER BY created_at DESC")
    .all();
}

export function countCredits(used?: number): number {
  if (used !== undefined) {
    const r = getDb()
      .prepare<[number], { c: number }>("SELECT COUNT(*) AS c FROM credits WHERE used = ?")
      .get(used);
    return r?.c ?? 0;
  }
  const r = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM credits")
    .get();
  return r?.c ?? 0;
}

export function generateCreditCode(): string {
  const seg = () => randomUUID().slice(0, 4).toUpperCase();
  return `QFL-${seg()}-${seg()}-${seg()}`;
}

export function purgeExpiredReports(maxAgeMs?: number): number {
  const ttlHours = maxAgeMs
    ? maxAgeMs / 3_600_000
    : parseInt(getSetting("report_ttl_hours") || "24", 10) || 24;
  const cutoff = Date.now() - ttlHours * 3_600_000;
  const r = getDb()
    .prepare<[number]>("DELETE FROM reports WHERE created_at < ?")
    .run(cutoff);
  return r.changes;
}

export function getAdminSessionTtlMs(): number {
  const hours = parseInt(getSetting("admin_session_ttl_hours") || "2", 10);
  if (!Number.isFinite(hours) || hours < 0.25) return 2 * 60 * 60 * 1000;
  return hours * 3600 * 1000;
}

export function adminHeartbeat(adminId: string, role: string, ip?: string | null): void {
  const now = Date.now();
  const ttlMs = getAdminSessionTtlMs();
  getDb().prepare(
    "INSERT INTO admin_sessions (admin_id, role, last_heartbeat, ip) VALUES (?, ?, ?, ?) ON CONFLICT(admin_id) DO UPDATE SET last_heartbeat = ?, ip = ?, role = ?"
  ).run(adminId, role, now, ip ?? null, now, ip ?? null, role);
  getDb().prepare("DELETE FROM admin_sessions WHERE last_heartbeat < ?").run(now - ttlMs);
}

export function getOnlineAdmins(): Array<{ adminId: string; role: string; lastHeartbeat: number; ip: string | null }> {
  const ttlMs = getAdminSessionTtlMs();
  const cutoff = Date.now() - ttlMs;
  getDb().prepare("DELETE FROM admin_sessions WHERE last_heartbeat < ?").run(cutoff);
  const rows = getDb().prepare(
    "SELECT admin_id, role, last_heartbeat, ip FROM admin_sessions WHERE last_heartbeat >= ? ORDER BY last_heartbeat DESC"
  ).all(cutoff) as Array<{ admin_id: string; role: string; last_heartbeat: number; ip: string | null }>;
  return rows.map((r) => ({
    adminId: r.admin_id,
    role: r.role,
    lastHeartbeat: r.last_heartbeat,
    ip: r.ip,
  }));
}

export function countOnlineAdmins(): number {
  const ttlMs = getAdminSessionTtlMs();
  const cutoff = Date.now() - ttlMs;
  getDb().prepare("DELETE FROM admin_sessions WHERE last_heartbeat < ?").run(cutoff);
  const r = getDb().prepare<[number], { c: number }>("SELECT COUNT(*) AS c FROM admin_sessions WHERE last_heartbeat >= ?").get(cutoff);
  return r?.c ?? 0;
}

export function removeAdminSession(adminId: string): void {
  getDb().prepare("DELETE FROM admin_sessions WHERE admin_id = ?").run(adminId);
}

export function countRecentActiveUsers(minutes: number = 5): number {
  const cutoff = Date.now() - minutes * 60 * 1000;
  const r = getDb().prepare<[number], { c: number }>(
    "SELECT COUNT(DISTINCT ip) AS c FROM events WHERE ts >= ? AND ip IS NOT NULL"
  ).get(cutoff);
  return r?.c ?? 0;
}
