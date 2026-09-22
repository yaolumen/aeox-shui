"use client";
import { useEffect, useState, createContext, useContext } from "react";
import type { TabId, I18n, Locale } from "./types";

type ToastItem = { id: number; msg: string; type: "ok" | "err" | "info" };

type AdminCtx = {
  t: I18n;
  locale: Locale;
  setLocale: (l: Locale) => void;
  toast: (msg: string, type?: "ok" | "err" | "info") => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
};

export const AdminContext = createContext<AdminCtx | null>(null);
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be inside AdminContext");
  return ctx;
}

export function ToastContainer({ items }: { items: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
            t.type === "ok"
              ? "bg-emerald-600 text-white"
              : t.type === "err"
              ? "bg-red-600 text-white"
              : "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  let _id = 0;
  const add = (msg: string, type: "ok" | "err" | "info" = "ok") => {
    const id = ++_id + Date.now();
    setItems((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3000);
  };
  return { items, add };
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div
        className={`relative w-full rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      {children}
    </label>
  );
}

export function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "green" | "amber" | "red" | "blue" | "zinc" | "indigo";
}) {
  const map = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

const tabIcons: Record<TabId, string> = {
  stats: "📊",
  products: "🛍️",
  ai: "🤖",
  orders: "📦",
  style: "🎨",
  settings: "⚙️",
  admins: "👤",
  credits: "🎟️",
};

export function SidebarShell({
  tab,
  setTab,
  tabs,
  onLogout,
  children,
  t,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  tabs: Array<{ id: TabId; label: string; badge?: number }>;
  onLogout: () => void;
  children: React.ReactNode;
  t: I18n;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = tabs.find((x) => x.id === tab);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-zinc-50/80 lg:block dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="sticky top-0 flex h-full flex-col p-3">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Navigation
          </div>
          <nav className="flex-1 space-y-0.5">
            {tabs.map((b) => (
              <button
                key={b.id}
                onClick={() => setTab(b.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === b.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span className="text-base">{tabIcons[b.id]}</span>
                <span>{b.label}</span>
                {b.badge ? (
                  <span
                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      tab === b.id
                        ? "bg-white/20 text-white"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    }`}
                  >
                    {b.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <button
            onClick={onLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Mobile + Content wrapper */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-sm font-medium">{current?.label}</span>
          <button onClick={onLogout} className="ml-auto rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t.signOut}</button>
        </div>
        {mobileOpen && (
          <div className="border-b border-zinc-200 bg-white px-2 py-1 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
            {tabs.map((b) => (
              <button
                key={b.id}
                onClick={() => { setTab(b.id); setMobileOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  tab === b.id
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tabIcons[b.id]}</span>
                <span>{b.label}</span>
                {b.badge ? <span className="ml-auto rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">{b.badge}</span> : null}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-indigo-400 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-indigo-400 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-indigo-400 ${
        props.className ?? ""
      }`}
    />
  );
}

export function PrimaryBtn({
  children,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40 ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function GhostBtn({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function DangerBtn({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-bold">{children}</h2>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">{children}</div>;
}
