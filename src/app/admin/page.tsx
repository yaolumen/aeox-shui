import { headers, cookies } from "next/headers";
import { AdminPanel } from "@/components/AdminPanel";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { getSettingOrDefault } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const adminDefault = getSettingOrDefault("admin_default_locale") as "en" | "zh-CN";
  const locale = resolveLocale(al, cookieLang, null, adminDefault || "zh-CN");
  return (
    <main className="mx-auto min-h-screen px-2 sm:px-4">
      <AdminPanel defaultLocale={locale} />
    </main>
  );
}
