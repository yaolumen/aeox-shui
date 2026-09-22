"use client";
import { useAdmin, Card, Badge } from "./ui";
import type { Stats } from "./types";

export function StatsTab({ stats }: { stats: Stats | null }) {
  const { t, locale } = useAdmin();
  if (!stats) return null;

  const onlineAdmins = stats.online?.admins ?? [];
  const recentUsers = stats.online?.recentUsers ?? 0;
  const errorRate = stats.reports.last24h > 0
    ? ((stats.reports.errors24h / stats.reports.last24h) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{t.tabStats}</h2>
        <span className="text-xs text-zinc-400">
          {locale === "zh-CN" ? "每 30 秒自动刷新" : "Auto-refreshes every 30s"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon="📋"
          label={`${t.reports} · ${t.stats24}`}
          value={stats.reports.last24h}
          color="indigo"
        />
        <KPICard
          icon="📋"
          label={`${t.reports} · ${t.stats7}`}
          value={stats.reports.last7Days}
          color="blue"
        />
        <KPICard
          icon="📋"
          label={`${t.reports} · ${t.statsAll}`}
          value={stats.reports.total}
          color="violet"
        />
        <KPICard
          icon="👁"
          label={`${t.views} · ${t.stats24}`}
          value={stats.reports.views24h}
          color="cyan"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniCard label={t.products} value={stats.products.total} />
        <MiniCard
          label={t.onlineAdmins}
          value={onlineAdmins.length}
          accent={onlineAdmins.length > 0 ? "emerald" : undefined}
        />
        <MiniCard
          label={t.recentUsers}
          value={recentUsers}
          accent={recentUsers > 0 ? "blue" : undefined}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t.errors} · {t.stats24}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{stats.reports.errors24h}</span>
            <span className="text-xs text-zinc-400">({errorRate}%)</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                parseFloat(errorRate) > 10 ? "bg-red-500" : parseFloat(errorRate) > 3 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, parseFloat(errorRate) * 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning */}
      {onlineAdmins.length >= 2 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {t.maxAdminsWarning}
        </div>
      )}

      {/* Online Admins */}
      {onlineAdmins.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <PulseDot color="emerald" />
            {t.onlineAdmins}
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {onlineAdmins.map((a) => (
              <li key={a.adminId} className="flex flex-wrap items-center gap-2 py-2.5">
                <PulseDot color="emerald" size="sm" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{a.adminId}</span>
                <Badge color={a.role === "super" ? "amber" : "zinc"}>
                  {a.role}
                </Badge>
                {a.ip && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{a.ip}</span>
                )}
                <span className="text-xs text-zinc-400">
                  {formatTimeAgo(a.lastHeartbeat, locale)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 7-Day Chart */}
      {stats.daily.length > 0 && (
        <Card>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {t.stats7}
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b border-zinc-50 dark:border-zinc-800/50" />
              ))}
            </div>
            <div className="relative flex h-28 items-end gap-2">
              {stats.daily.map((d) => {
                const max = Math.max(1, ...stats.daily.map((x) => x.count));
                const pct = d.count / max;
                const h = Math.max(4, Math.round(pct * 100));
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    {d.count > 0 && (
                      <span className="text-xs font-medium tabular-nums text-zinc-500">
                        {d.count}
                      </span>
                    )}
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all hover:from-indigo-400 hover:to-indigo-300 dark:from-indigo-600 dark:to-indigo-500"
                      style={{ height: `${h}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <div className="text-xs text-zinc-500">{d.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Reports */}
      {stats.recent.length > 0 && (
        <Card>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {t.recent}
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stats.recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {r.id.slice(0, 8)}
                </code>
                <Badge color="zinc">{r.locale}</Badge>
                <Badge color="indigo">{r.provider ?? "?"}</Badge>
                <span className="ml-auto text-xs text-zinc-400">
                  {new Date(r.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                </span>
                <a
                  href={`/report/${r.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:underline dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                >
                  view →
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: "from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900/40",
    blue: "from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900 border-blue-100 dark:border-blue-900/40",
    violet: "from-violet-50 to-white dark:from-violet-950/30 dark:to-zinc-900 border-violet-100 dark:border-violet-900/40",
    cyan: "from-cyan-50 to-white dark:from-cyan-950/30 dark:to-zinc-900 border-cyan-100 dark:border-cyan-900/40",
  };
  const valMap: Record<string, string> = {
    indigo: "text-indigo-700 dark:text-indigo-300",
    blue: "text-blue-700 dark:text-blue-300",
    violet: "text-violet-700 dark:text-violet-300",
    cyan: "text-cyan-700 dark:text-cyan-300",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm ${bgMap[color] || bgMap.indigo}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        <span className="text-sm">{icon}</span>
        {label}
      </div>
      <div className={`mt-1.5 text-3xl font-bold tabular-nums ${valMap[color] || valMap.indigo}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function MiniCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent ? accentMap[accent] || "" : ""}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function PulseDot({ color, size }: { color: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <span className={`relative inline-flex ${sizeClass}`}>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colorMap[color] || "bg-emerald-500"} opacity-40`} />
      <span className={`relative inline-flex ${sizeClass} rounded-full ${colorMap[color] || "bg-emerald-500"}`} />
    </span>
  );
}

function formatTimeAgo(ts: number, locale: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return locale === "zh-CN" ? `${diff}秒前` : `${diff}s ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return locale === "zh-CN" ? `${m}分钟前` : `${m}m ago`;
  }
  const h = Math.floor(diff / 3600);
  return locale === "zh-CN" ? `${h}小时前` : `${h}h ago`;
}
