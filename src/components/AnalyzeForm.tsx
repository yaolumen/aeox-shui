"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";

interface Props {
  defaultLocale: "en" | "zh-CN";
  monetizationMode?: "ecommerce" | "freemium";
}

const COPY = {
  en: {
    title: "Decode Your Energy Cycle",
    subtitle:
      "Enter your birth timestamp to calculate your personal elemental spectrum. Your data is processed in real-time and automatically purged after report generation.",
    birthDate: "Birth Date",
    hour: "Birth Hour (0–23)",
    gender: "Gender",
    male: "♂",
    female: "♀",
    other: "○",
    maleLabel: "Male",
    femaleLabel: "Female",
    otherLabel: "Other",
    fateBook: "Reference Classic",
    bookSanming: "San Ming Tong Hui",
    bookSanmingDesc: "Comprehensive elemental analysis — a foundational Chinese rhythm classic (三命通会)",
    bookZiping: "Zi Ping Zhen Quan",
    bookZipingDesc: "Focused on core-element strength — a concise Chinese rhythm method (子平真诠)",
    submit: "Decode Now",
    submitPremium: "Generate In-Depth Profile",
    error: "Something went wrong. Please try again.",
    error429: "Too many requests. Please wait an hour and try again.",
    errorTimeout: "Request timed out. The AI may still finish — your report ID will be shown if available.",
    errorCancel: "Request cancelled.",
    dateHint: "Select your date of birth",
    yearLabel: "Year",
    monthLabel: "Month",
    dayLabel: "Day",
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    hourHint: "If unsure, choose noon (12).",
    tier: "Report Tier",
    tierFree: "Free (Foundation)",
    tierPremium: "In-Depth Profile",
    creditCode: "Credit Code (optional)",
    creditCodeHint: "Enter a credit code to unlock in-depth profile for free",
    paymentRedirect: "Redirecting to payment...",
    paymentSuccess: "Payment successful! Generating in-depth profile...",
    advanced: "Advanced Options",
    privacyNote: "🔒 Data auto-purged in 24h",
    stepCalc: "Mapping temporal energy coordinates...",
    stepAI: "Calculating Five-Element resonance...",
    stepSynth: "Synthesizing spatial harmony & rhythm...",
    stepPolish: "Polishing your energy vector...",
    stepSave: "Saving",
    cancel: "Cancel",
    cycle: "Analysis Cycle",
    cycleDefault: "Annual",
  },
  "zh-CN": {
    title: "解码你的能量周期",
    subtitle:
      "输入出生时间戳，计算你的个人元素光谱。数据实时处理，报告生成后自动清除。",
    birthDate: "出生日期",
    hour: "出生时辰（0-23）",
    gender: "性别",
    male: "♂",
    female: "♀",
    other: "○",
    maleLabel: "男",
    femaleLabel: "女",
    otherLabel: "其他",
    fateBook: "参考典籍",
    bookSanming: "三命通会",
    bookSanmingDesc: "五行综合分析——传统节律文化基础经典（三命通会）",
    bookZiping: "子平真诠",
    bookZipingDesc: "侧重核心元素强弱——简明节律分析方法（子平真诠）",
    submit: "立即解码",
    submitPremium: "生成深度节律图谱",
    error: "出错了，请重试。",
    error429: "请求过于频繁，请等待一小时后再试。",
    errorTimeout: "请求超时，但 AI 可能仍在处理 — 完成后您将看到报告 ID。",
    errorCancel: "请求已取消。",
    dateHint: "选择你的出生日期",
    yearLabel: "年",
    monthLabel: "月",
    dayLabel: "日",
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    hourHint: "如果不确定，可以选中午 12 点。",
    tier: "报告等级",
    tierFree: "免费（基础版）",
    tierPremium: "深度节律图谱",
    creditCode: "卡密（可选）",
    creditCodeHint: "输入卡密可免费使用深度版",
    paymentRedirect: "正在跳转支付...",
    paymentSuccess: "支付成功！正在生成深度节律图谱...",
    advanced: "高级选项",
    privacyNote: "🔒 数据 24 小时自动清除",
    stepCalc: "正在接入历法时间节律模型...",
    stepAI: "正在计算五行能量平衡光谱...",
    stepSynth: "正在匹配空间与环境共振方案...",
    stepPolish: "正在生成您的专属时空能量报告...",
    stepSave: "保存中",
    cancel: "取消",
    cycle: "分析周期",
    cycleDefault: "本年",
  },
} as const;

const REQUEST_TIMEOUT_MS = 90_000;
const MIN_LOADING_MS = 6_000;

const STEPS_EN = [
  "Mapping temporal energy coordinates...",
  "Calculating Five-Element resonance...",
  "Synthesizing spatial harmony & rhythm...",
  "Polishing your energy vector...",
] as const;
const STEPS_ZH = [
  "正在接入历法时间节律模型...",
  "正在计算五行能量平衡光谱...",
  "正在匹配空间与环境共振方案...",
  "正在生成您的专属时空能量报告...",
] as const;

export function AnalyzeForm({ defaultLocale, monetizationMode = "ecommerce" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");
  const [locale, setLocale] = useState<"en" | "zh-CN">(() => {
    if (urlLang === "en" || urlLang === "zh-CN") return urlLang;
    return defaultLocale;
  });
  useEffect(() => {
    if (urlLang === "en" || urlLang === "zh-CN") setLocale(urlLang);
    else if (defaultLocale !== locale) setLocale(defaultLocale);
  }, [urlLang, defaultLocale]);
  const t = COPY[locale];
  const isEcommerce = monetizationMode === "ecommerce";
  const steps = locale === "zh-CN" ? STEPS_ZH : STEPS_EN;

  const currentYear = new Date().getFullYear();
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(0);
  const [birthDay, setBirthDay] = useState<number>(0);
  const [hour, setHour] = useState(12);
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [fateBook, setFateBook] = useState<"sanming" | "zipingzhenquan">("sanming");

  const maxDayInMonth = birthMonth > 0 ? new Date(birthYear, birthMonth, 0).getDate() : 31;
  const birthDate = birthMonth > 0 && birthDay > 0
    ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`
    : "";
  const [cycleId, setCycleId] = useState<string>("");
  const [cycles, setCycles] = useState<Array<{ id: string; nameEn: string; nameZh: string; years: number }>>([]);
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [creditCode, setCreditCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/v1/config")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.cycles?.length) {
          setCycles(data.cycles);
          setCycleId(data.cycles[0].id);
        }
      })
      .catch(() => {});
  }, []);

  function advanceStep(step: number) {
    setCurrentStep(step);
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  }

  function startProgress() {
    advanceStep(0);
    setElapsed(0);
    loadingStartRef.current = Date.now();
    stepTimerRef.current = setTimeout(() => {
      advanceStep(1);
      stepTimerRef.current = setTimeout(() => {
        advanceStep(2);
        stepTimerRef.current = setTimeout(() => {
          advanceStep(3);
        }, 1800);
      }, 1800);
    }, 1500);
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function stopProgress() {
    if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null; }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
  }

  function onCancel() {
    if (abortRef.current) abortRef.current.abort();
    stopProgress();
    setIsLoading(false);
    setError(t.errorCancel);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(new Date(birthDate).getTime())) {
      setError(locale === "zh-CN" ? "请选择完整的出生日期" : "Please select a complete date of birth");
      return;
    }
    const d = new Date(birthDate);
    if (d > new Date() || d < new Date("1900-01-01")) {
      setError(locale === "zh-CN" ? "请输入 1900 年至今天之间的日期" : "Date must be between 1900 and today");
      return;
    }

    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    startProgress();

    try {
      const res = await fetch("/api/v1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate, hour, gender, locale, fateBook, tier, creditCode: creditCode || undefined, cycleId: cycleId || undefined }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        setError(t.error429);
        return;
      }

      const data = await res.json();

      if (res.status === 402 && data.requires_payment && data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      if (!data?.id) {
        throw new Error("Empty response id");
      }

      setCurrentStep(steps.length - 1);
      const elapsed_ = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed_);
      stopProgress();
      setTimeout(() => {
        router.push(`/report/${data.id}`);
      }, remaining);
    } catch (err) {
      const ex = err as Error & { name?: string };
      if (ex.name === "AbortError") {
        setError(t.errorTimeout);
      } else {
        setError(ex.message || t.error);
      }
    } finally {
      clearTimeout(timeoutId);
      stopProgress();
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 px-4 py-8 sm:max-w-xl sm:px-6 sm:py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          {t.subtitle}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center justify-end">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{t.privacyNote}</span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.birthDate}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthYear}
              onChange={(e) => {
                setBirthYear(Number(e.target.value));
                if (birthDay > new Date(Number(e.target.value), birthMonth, 0).getDate()) {
                  setBirthDay(0);
                }
              }}
              className="rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value={0} disabled>{t.yearLabel}</option>
              {Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => {
                const m = Number(e.target.value);
                setBirthMonth(m);
                if (birthDay > new Date(birthYear, m, 0).getDate()) {
                  setBirthDay(0);
                }
              }}
              className="rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value={0} disabled>{t.monthLabel}</option>
              {t.months.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(Number(e.target.value))}
              className="rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value={0} disabled>{t.dayLabel}</option>
              {Array.from({ length: maxDayInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">{t.dateHint}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.hour}
          </label>
          <div className="flex items-center gap-3 py-1">
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              className="h-2 flex-1 appearance-none rounded-full bg-zinc-200 accent-indigo-600 dark:bg-zinc-700"
            />
            <span className="w-8 text-center text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {String(hour).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">{t.hourHint}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.gender}
          </label>
          <div className="flex gap-2">
            {(["male", "female", "other"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-3 sm:py-2.5 text-sm transition-colors ${
                  gender === g
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-300"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                <span className="text-base">{g === "male" ? t.male : g === "female" ? t.female : t.other}</span>
                <span className="hidden sm:inline">{g === "male" ? t.maleLabel : g === "female" ? t.femaleLabel : t.otherLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {cycles.length > 1 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.cycle}</label>
            <div className="flex flex-wrap gap-2">
              {cycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCycleId(c.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    cycleId === c.id
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {locale === "zh-CN" ? c.nameZh : c.nameEn}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-750"
        >
          {t.advanced}
          <svg className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            {!isEcommerce && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.tier}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTier("free")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      tier === "free"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {t.tierFree}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier("premium")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      tier === "premium"
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {t.tierPremium}
                  </button>
                </div>
              </div>
            )}

            {!isEcommerce && tier === "premium" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.creditCode}</label>
                <input
                  value={creditCode}
                  onChange={(e) => setCreditCode(e.target.value.toUpperCase())}
                  placeholder="QFL-XXXX-XXXX-XXXX"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-0.5 text-xs text-zinc-400">{t.creditCodeHint}</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.fateBook}</label>
              <div className="space-y-2">
                {(["sanming", "zipingzhenquan"] as const).map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setFateBook(b)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      fateBook === b
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-sm font-medium">{b === "sanming" ? t.bookSanming : t.bookZiping}</span>
                    <span className={`block mt-0.5 text-xs ${fateBook === b ? "text-indigo-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                      {b === "sanming" ? t.bookSanmingDesc : t.bookZipingDesc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            !isEcommerce && tier === "premium"
              ? "bg-amber-500 shadow-amber-500/25 hover:bg-amber-600"
              : "bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700"
          }`}
        >
          {!isEcommerce && tier === "premium" ? t.submitPremium : t.submit}
        </button>

        {isLoading && (
          <div className="fixed bottom-0 inset-x-0 z-50 border-t border-indigo-200 bg-white/95 backdrop-blur-sm dark:border-indigo-900 dark:bg-zinc-900/95">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" style={{ animationDuration: "3s" }}>☯</span>
                <span className={`text-sm font-medium text-indigo-700 dark:text-indigo-300 transition-opacity duration-300 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
                  {steps[currentStep]}
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-mono text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {elapsed}s
                </span>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-750"
              >
                {t.cancel}
              </button>
            </div>
            <div className="h-1 bg-indigo-100 dark:bg-indigo-950">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000 ease-out dark:bg-indigo-400"
                style={{ width: `${Math.min(95, ((currentStep + 1) / steps.length) * 60 + (elapsed / 60) * 35)}%` }}
              />
            </div>
          </div>
        )}
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <a href={`/recent?lang=${locale}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
          {locale === "zh-CN" ? "找不到报告？查看最近报告" : "Lost your report? View recent reports"}
        </a>
      </div>

      <Disclaimer variant="compact" locale={locale} />
    </div>
  );
}
