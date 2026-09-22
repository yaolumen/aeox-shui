export type Product = {
  id: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string | null;
  descriptionZh: string | null;
  category: string;
  productType: string;
  url: string;
  price: string | null;
  deliveryInfo: Record<string, string> | null;
  tags: string[];
  wuxing: string[];
  locales: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type OnlineAdmin = {
  adminId: string;
  role: string;
  lastHeartbeat: number;
  ip: string | null;
};

export type Stats = {
  reports: {
    total: number;
    allTime: number;
    last7Days: number;
    last24h: number;
    views24h: number;
    errors24h: number;
  };
  products: { total: number };
  daily: Array<{ date: string; count: number }>;
  recent: Array<{ id: string; createdAt: number; locale: string; provider: string | null }>;
  serverTime: number;
  online: {
    admins: OnlineAdmin[];
    recentUsers: number;
  };
};

export type AIProvider = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKeyMasked: string;
  apiKeyLength: number;
  role: string;
  enabled: boolean;
  sortOrder: number;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export type TestResult = {
  ok: boolean;
  latencyMs: number;
  sample?: string;
  error?: string;
};

export type Admin = {
  id: string;
  name: string;
  role: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Order = {
  id: string;
  reportId: string | null;
  productId: string;
  productType: string;
  buyerEmail: string | null;
  buyerIp: string | null;
  amount: string | null;
  status: string;
  trackingNo: string | null;
  deliveryNote: string | null;
  paidAt: number | null;
  deliveredAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Credit = {
  id: string;
  code: string;
  tier: string;
  credits: number;
  used: boolean;
  buyerEmail: string | null;
  ip: string | null;
  createdAt: number;
  usedAt: number | null;
  expiresAt: number | null;
};

export type Settings = Record<string, string>;

export type TabId = "stats" | "products" | "ai" | "orders" | "settings" | "admins" | "credits" | "style";

export const T = {
  en: {
    title: "Admin · Shui",
    login: "Sign in",
    adminName: "Admin Name",
    password: "Password",
    passwordHint: "Enter name + password, or just password for legacy login",
    signIn: "Sign In",
    signOut: "Sign Out",
    tabStats: "Traffic",
    tabProducts: "Products",
    tabAI: "AI Providers",
    tabOrders: "Orders",
    tabCredits: "Credits",
    tabStyle: "Style",
    tabSettings: "Settings",
    tabAdmins: "Account",
    stats24: "Last 24h",
    stats7: "Last 7 days",
    statsAll: "All time",
    reports: "Reports",
    views: "Views",
    errors: "Errors",
    products: "Products",
    recent: "Recent Reports",
    onlineAdmins: "Online Admins",
    recentUsers: "Recent Users (5m)",
    maxAdminsWarning: "Max 2 admins online",
    add: "Add product",
    id: "ID",
    titleEn: "Title (EN)",
    titleZh: "Title (中文)",
    url: "URL",
    price: "Price",
    category: "Category",
    productType: "Product Type",
    tags: "Tags (comma)",
    wuxing: "Wuxing (comma)",
    featured: "Featured",
    active: "Active",
    save: "Save",
    saved: "Saved ✓",
    delete: "Delete",
    confirmDelete: "Delete this item?",
    noProducts: "No products yet.",
    invalidLogin: "Invalid credentials.",
    maxAdminsReached: "Maximum concurrent admins reached. Please try later.",
    noRecent: "No reports yet.",
    devHint: "Dev: use just the ADMIN_PASSWORD",
    aiTitle: "AI Providers",
    aiSubtitle: "Configure OpenAI-compatible AI providers.",
    aiAdd: "Add provider",
    aiProviderId: "Provider ID (slug)",
    aiName: "Display name",
    aiBaseUrl: "Base URL",
    aiModel: "Model name",
    aiApiKey: "API Key (write-only)",
    aiApiKeyHint: "Stored in SQLite, never returned in plain text.",
    aiSortOrder: "Sort order",
    aiNote: "Note",
    aiSeedFromEnv: "Seed from .env",
    aiTest: "Test",
    aiTestOk: "OK",
    aiTestFail: "Failed",
    aiNoProviders: "No AI providers yet.",
    aiSeeded: "Seeded from .env",
    aiAlreadySeeded: "Already seeded.",
    aiEnabled: "Enabled",
    orderStatus: "Status",
    orderPending: "Pending",
    orderPaid: "Paid",
    orderDelivered: "Delivered",
    orderTracking: "Tracking No.",
    orderNote: "Delivery Note",
    orderMarkPaid: "Mark Paid",
    orderMarkDelivered: "Mark Delivered",
    noOrders: "No orders yet.",
    orderBuyerEmail: "Buyer Email",
    orderProductType: "Product Type",
    settingMode: "Monetization Mode",
    settingPayment: "Payment Provider",
    settingPremiumPrice: "Premium Price (USD)",
    settingPremiumPriceCny: "Premium Price (CNY)",
    settingPremiumTokens: "Premium Max Tokens",
    settingStripeKey: "Stripe Secret Key",
    settingStripeWebhook: "Stripe Webhook Secret",
    settingPaypalClientId: "PayPal Client ID",
    settingPaypalSecret: "PayPal Secret",
    settingPaypalSandbox: "PayPal Sandbox",
    settingShowProducts: "Show Product Recommendations",
    settingFreeLimit: "Free Report Limit (per hour)",
    settingPremiumLimit: "Premium Report Limit (per hour)",
    settingReportTTL: "Report Retention (hours)",
    settingReportTTLHint: "Reports older than this are auto-deleted. Default: 24h",
    settingAdminSessionTTL: "Admin Session Timeout (hours)",
    settingAdminSessionTTLHint: "Admin auto-logout after this period of inactivity. Default: 2h",
    settingSchedulingMode: "AI Scheduling Mode",
    settingSchedulingModeHint: "How to select among multiple AI providers",
    schedulingPriority: "Priority (try in order)",
    schedulingRoundRobin: "Round Robin (rotate evenly)",
    schedulingRandom: "Random (pick randomly)",
    settingBrandTitle: "Brand Title (EN)",
    settingBrandTitleZh: "Brand Title (中文)",
    settingBrandSubtitle: "Brand Subtitle (EN)",
    settingBrandSubtitleZh: "Brand Subtitle (中文)",
    aiRole: "Role",
    aiRolePrimary: "Primary",
    aiRoleFallback: "Fallback",
    aiTestAll: "Test All",
    aiTestAllDone: "All tests complete",
    aiDuplicate: "Duplicate",
    aiDuplicateId: "New Provider ID",
    aiMoveUp: "Move up",
    aiMoveDown: "Move down",
    cycleManagement: "Analysis Cycles",
    cycleAdd: "Add Cycle",
    cycleNameEn: "Name (EN)",
    cycleNameZh: "Name (中文)",
    cycleYears: "Years",
    cycleId: "ID",
    purgeReports: "Purge All Reports Now",
    purgeConfirm: "Delete ALL reports? This cannot be undone.",
    purgeDone: "All reports purged",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved ✓",
    forbidden: "Forbidden — super admin only",
    adminSuper: "Owner",
    noAdmins: "No admins.",
    cannotDeleteSelf: "Cannot delete yourself.",
    creditCode: "Code",
    creditTier: "Tier",
    creditUsed: "Used",
    creditExpires: "Expires",
    creditGenerate: "Generate Credits",
    creditCount: "Count",
    creditExpiresDays: "Expires in (days)",
    noCredits: "No credits yet.",
    deliveryInfo: "Delivery Info",
    deliveryUrl: "Download URL",
    deliveryPassword: "Password/Key",
    typeAffiliate: "Online / Virtual (link redirect)",
    typePhysical: "Physical (self-ship)",
    ecommerce: "E-commerce",
    freemium: "Freemium",
    descEn: "Description (EN)",
    descZh: "Description (中文)",
    sortOrder: "Sort order",
    edit: "Edit",
    on: "On",
    off: "Off",
    disabled: "Disabled",
    generatedCodes: "Generated Codes:",
    copyAll: "Copy All",
    copied: "Copied!",
    changePassword: "Change Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    passwordChanged: "Password changed ✓",
    cancel: "Cancel",
    cardDesign: "Style Preset",
    cardTheme: "Preset",
    cardThemeIndigo: "Indigo",
    cardThemeDark: "Dark",
    cardThemeWarm: "Warm",
    cardThemeGlass: "Glass",
    stylePreview: "Preview",
    styleTheme: "Theme",
    styleIcon: "Icon",
    styleIconWuxing: "Wuxing Cycle",
    styleIconMoon: "Moon Phase",
    styleColumns: "PDF Layout",
    styleColumns1: "Single Column",
    styleColumns2: "Two Columns",
    styleCardLayout: "Card Size",
    styleCardLayoutH: "Horizontal 9:5",
    styleCardLayoutV: "Vertical 9:16",
    styleCardLayoutS: "Square 1:1",
    stylePdfPreview: "PDF Preview",
    styleCardPreview: "Card Preview",
    styleNoReport: "No reports available. Generate a report first.",
    styleSaved: "Style saved ✓",
    styleSaveHint: "Changes are saved immediately.",
  },
  "zh-CN": {
    title: "管理 · Shui",
    login: "登录",
    adminName: "管理员名",
    password: "密码",
    passwordHint: "输入名称+密码，或仅密码使用旧版登录",
    signIn: "登录",
    signOut: "退出",
    tabStats: "流量",
    tabProducts: "商品",
    tabAI: "AI 提供方",
    tabOrders: "订单",
    tabCredits: "卡密",
    tabStyle: "风格",
    tabSettings: "设置",
    tabAdmins: "账户",
    stats24: "近 24 小时",
    stats7: "近 7 天",
    statsAll: "累计",
    reports: "报告",
    views: "浏览",
    errors: "错误",
    products: "商品",
    recent: "最近报告",
    onlineAdmins: "在线管理员",
    recentUsers: "近期用户（5分钟）",
    maxAdminsWarning: "最多 2 名管理员同时在线",
    add: "添加商品",
    id: "ID",
    titleEn: "标题（英）",
    titleZh: "标题（中）",
    url: "链接",
    price: "价格",
    category: "分类",
    productType: "商品类型",
    tags: "标签（逗号分隔）",
    wuxing: "五行（逗号分隔）",
    featured: "推荐",
    active: "启用",
    save: "保存",
    saved: "已保存 ✓",
    delete: "删除",
    confirmDelete: "确认删除？",
    noProducts: "暂无商品。",
    invalidLogin: "凭证错误。",
    maxAdminsReached: "管理员在线数已达上限，请稍后重试。",
    noRecent: "暂无报告。",
    devHint: "开发模式：直接用 ADMIN_PASSWORD 登录",
    aiTitle: "AI 提供方",
    aiSubtitle: "配置 OpenAI 兼容的 AI 服务。",
    aiAdd: "添加提供方",
    aiProviderId: "提供方 ID",
    aiName: "显示名",
    aiBaseUrl: "Base URL",
    aiModel: "模型名",
    aiApiKey: "API Key（只写）",
    aiApiKeyHint: "存在 SQLite，UI 只显示掩码。",
    aiSortOrder: "排序",
    aiNote: "备注",
    aiSeedFromEnv: "从 .env 导入",
    aiTest: "测试",
    aiTestOk: "成功",
    aiTestFail: "失败",
    aiNoProviders: "暂无 AI 提供方。",
    aiSeeded: "已从 .env 导入",
    aiAlreadySeeded: "已存在，未重复导入。",
    aiEnabled: "启用",
    orderStatus: "状态",
    orderPending: "待处理",
    orderPaid: "已付款",
    orderDelivered: "已发货",
    orderTracking: "物流单号",
    orderNote: "发货备注",
    orderMarkPaid: "标记已付",
    orderMarkDelivered: "标记已发货",
    noOrders: "暂无订单。",
    orderBuyerEmail: "买家邮箱",
    orderProductType: "商品类型",
    settingMode: "变现模式",
    settingPayment: "支付方式",
    settingPremiumPrice: "高级版价格 (USD)",
    settingPremiumPriceCny: "高级版价格 (CNY)",
    settingPremiumTokens: "高级版最大 Token",
    settingStripeKey: "Stripe Secret Key",
    settingStripeWebhook: "Stripe Webhook Secret",
    settingPaypalClientId: "PayPal Client ID",
    settingPaypalSecret: "PayPal Secret",
    settingPaypalSandbox: "PayPal 沙箱模式",
    settingShowProducts: "显示商品推荐",
    settingFreeLimit: "免费报告限制（每小时）",
    settingPremiumLimit: "高级报告限制（每小时）",
    settingReportTTL: "报告保留时间（小时）",
    settingReportTTLHint: "超过此时间的报告将被自动删除，默认 24 小时",
    settingAdminSessionTTL: "管理员会话超时（小时）",
    settingAdminSessionTTLHint: "管理员不活动超过此时间后自动登出，默认 2 小时",
    settingSchedulingMode: "AI 调度模式",
    settingSchedulingModeHint: "多个 AI 提供方时的选择策略",
    schedulingPriority: "优先级（按顺序尝试）",
    schedulingRoundRobin: "轮询（均匀轮流）",
    schedulingRandom: "随机（随机选择）",
    settingBrandTitle: "品牌标题（英）",
    settingBrandTitleZh: "品牌标题（中）",
    settingBrandSubtitle: "品牌副标题（英）",
    settingBrandSubtitleZh: "品牌副标题（中）",
    aiRole: "角色",
    aiRolePrimary: "主力",
    aiRoleFallback: "备用",
    aiTestAll: "测试全部",
    aiTestAllDone: "全部测试完成",
    aiDuplicate: "复制",
    aiDuplicateId: "新提供方 ID",
    aiMoveUp: "上移",
    aiMoveDown: "下移",
    cycleManagement: "分析周期",
    cycleAdd: "添加周期",
    cycleNameEn: "名称（英）",
    cycleNameZh: "名称（中）",
    cycleYears: "年数",
    cycleId: "ID",
    purgeReports: "立即清除所有报告",
    purgeConfirm: "确认删除所有报告？此操作不可撤销。",
    purgeDone: "所有报告已清除",
    saveSettings: "保存设置",
    settingsSaved: "设置已保存 ✓",
    forbidden: "权限不足 — 仅主管理员",
    adminSuper: "所有者",
    noAdmins: "暂无管理员。",
    cannotDeleteSelf: "不能删除自己。",
    creditCode: "卡密",
    creditTier: "等级",
    creditUsed: "已使用",
    creditExpires: "过期时间",
    creditGenerate: "生成卡密",
    creditCount: "数量",
    creditExpiresDays: "有效期（天）",
    noCredits: "暂无卡密。",
    deliveryInfo: "交付信息",
    deliveryUrl: "下载地址",
    deliveryPassword: "提取码/密码",
    typeAffiliate: "在线/虚拟商品（链接跳转）",
    typePhysical: "实物（自发货）",
    ecommerce: "电商模式",
    freemium: "免费+付费",
    descEn: "描述（英）",
    descZh: "描述（中文）",
    sortOrder: "排序",
    edit: "编辑",
    on: "开",
    off: "关",
    disabled: "停用",
    generatedCodes: "已生成卡密：",
    copyAll: "全部复制",
    copied: "已复制！",
    changePassword: "修改密码",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    passwordMismatch: "两次密码不一致",
    passwordTooShort: "密码至少 6 位",
    passwordChanged: "密码已修改 ✓",
    cancel: "取消",
    cardDesign: "风格预设",
    cardTheme: "预设",
    cardThemeIndigo: "靛蓝",
    cardThemeDark: "暗色",
    cardThemeWarm: "暖土",
    cardThemeGlass: "毛玻璃",
    stylePreview: "预览",
    styleTheme: "主题",
    styleIcon: "图标",
    styleIconWuxing: "五行循环",
    styleIconMoon: "月相",
    styleColumns: "PDF 排版",
    styleColumns1: "单栏",
    styleColumns2: "双栏",
    styleCardLayout: "卡片尺寸",
    styleCardLayoutH: "横版 9:5",
    styleCardLayoutV: "竖版 9:16",
    styleCardLayoutS: "方形 1:1",
    stylePdfPreview: "PDF 预览",
    styleCardPreview: "卡片预览",
    styleNoReport: "暂无报告，请先生成一个报告。",
    styleSaved: "风格已保存 ✓",
    styleSaveHint: "更改立即保存。",
  },
} as const;

export type Locale = keyof typeof T;
export type I18n = (typeof T)[Locale];
