"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/config";

interface NavBarProps {
  locale?: Locale;
}

export function NavBar({ locale = "en" }: NavBarProps) {
  const brand = locale === "zh-CN" ? "水 · 节律" : "Shui";
  const pathname = usePathname();
  const sp = useSearchParams();

  function href(path: string): string {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}lang=${locale}`;
  }

  function langHref(l: Locale): string {
    const params = new URLSearchParams(sp.toString());
    params.set("lang", l);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-12 sm:h-11 max-w-3xl items-center justify-between px-4">
        <Link href={href("/")} className="text-sm font-bold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400">
          ← {brand}
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={href("/analyze")} className="text-sm sm:text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            {locale === "zh-CN" ? "解码" : "Decode"}
          </Link>
          <Link href={href("/recent")} className="text-sm sm:text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            {locale === "zh-CN" ? "最近" : "Recent"}
          </Link>
          <Link href={href("/faq")} className="text-sm sm:text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            FAQ
          </Link>
          <div className="ml-1 flex gap-1.5 sm:gap-1">
            {(["en", "zh-CN"] as const).map((l) => (
              <Link
                key={l}
                href={langHref(l)}
                className={`rounded px-3 py-1 sm:px-1.5 sm:py-0.5 text-sm sm:text-xs font-medium transition-colors min-h-[36px] sm:min-h-0 inline-flex items-center justify-center ${
                  locale === l
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {l === "en" ? "EN" : "中"}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
