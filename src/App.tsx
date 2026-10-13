import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash,
  Trash2,
  ShoppingBag,
  Check,
  Image,
  X,
  MessageSquare,
  Settings,
  Database,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  UserCheck,
  Bell,
  Truck,
  Info,
  Coins,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Send,
  Copy,
  Menu,
  LogOut,
  User,
  Bot,
  Store
} from "lucide-react";

import { CustomChart } from "./components/CustomChart";
import { TelegramSimulator } from "./components/TelegramSimulator";
import { SmartMarketing } from "./components/SmartMarketing";
import { Onboarding } from "./components/Onboarding";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { PublicShop } from "./components/PublicShop";
import { AIStrategyDesk } from "./components/strategy/AIStrategyDesk";
import { useAuth } from "./contexts/AuthContext";
import { invokeApi } from "./services/api";
import { getShopState, saveShopState } from "./services/shopState";
import {
  emptyOnboardingForm,
  getShopForOwner,
  shopRecordToFormData,
} from "./services/shopRecord";
import { getProducts, migrateProductsFromJson, upsertProduct, deleteProduct, deductProductStock } from "./services/productService";
import type { OnboardingFormState, ShopRecord } from "./types";
import { Product, DeliveryZone, Order, ShopConfig, TelegramSession, SystemState } from "./types";
import * as store from "./services/clientStore";
import { getDefaultSessions } from "./services/defaults";
import { supabase } from "./utils/supabase";
import { fetchDeliveryMatrix, addDeliveryZone, deleteDeliveryZone } from "./services/deliveryMatrixApi";
import { getOrdersForOwner, updateDbOrderStatus } from "./services/ordersApi";
import { buildShopPublicUrl } from "./utils/shopId";
import { loadTownships, loadAllDeliveryLocations, MYANMAR_REGIONS } from "./data/townships";
import QRCode from "qrcode";
import { useLanguage } from "./contexts/LanguageContext";
import { translations, getTranslation, Language } from "./i18n/translations";
import {
  createTelegramLinkToken,
  subscribeToTokenVerification,
  getLinkedTelegramAccount,
  TARGET_BOT_USERNAME,
} from "./services/telegramAuthService";

const dict = translations;

function TelegramConnectSection({ user, t }: { user: any; t: any }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [deepLink, setDeepLink] = React.useState<string>(`https://t.me/${TARGET_BOT_USERNAME}`);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [linkStatus, setLinkStatus] = React.useState<"idle" | "waiting" | "connected">("idle");
  const [linkedInfo, setLinkedInfo] = React.useState<{ telegramUserId?: number; telegramUsername?: string } | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  // Check if User A already has a linked Telegram account
  React.useEffect(() => {
    if (!user?.id) return;
    getLinkedTelegramAccount(user.id).then((res) => {
      if (res.linked) {
        setLinkStatus("connected");
        setLinkedInfo({
          telegramUserId: res.telegramUserId,
          telegramUsername: res.telegramUsername,
        });
      }
    });
  }, [user?.id]);

  // Render QR code whenever deepLink changes
  React.useEffect(() => {
    if (canvasRef.current && deepLink) {
      QRCode.toCanvas(canvasRef.current, deepLink, {
        width: 160,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
    }
  }, [deepLink]);

  const handleGenerateLink = async () => {
    if (!user?.id) return;
    setIsGenerating(true);
    try {
      const res = await createTelegramLinkToken(user.id);
      setToken(res.token);
      setDeepLink(res.deepLink);
      setLinkStatus("waiting");

      // Subscribe to Supabase Realtime verification
      const unsubscribe = subscribeToTokenVerification(res.token, (record) => {
        setLinkStatus("connected");
        setLinkedInfo({
          telegramUserId: record.telegram_user_id ?? undefined,
          telegramUsername: record.telegram_username ?? undefined,
        });
        unsubscribe();
      });
    } catch (err) {
      console.error("Failed to generate link token:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-[32px] space-y-5 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-black text-sm tracking-tight text-slate-900">
            Telegram Store Handshake (@{TARGET_BOT_USERNAME})
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Link your authenticated merchant account so @{TARGET_BOT_USERNAME} automatically syncs your products and orders.
          </p>
        </div>
        {linkStatus === "connected" && (
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            ● LINKED
          </span>
        )}
        {linkStatus === "waiting" && (
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            ⏳ WAITING FOR TELEGRAM
          </span>
        )}
      </div>

      {linkStatus === "connected" ? (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Store Successfully Connected</p>
              <p className="text-[11px] text-emerald-700 font-mono">
                {linkedInfo?.telegramUsername ? `@${linkedInfo.telegramUsername}` : "Verified Account"} (ID: {linkedInfo?.telegramUserId || "Linked"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateLink}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
          >
            Re-link Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            <canvas ref={canvasRef} className="rounded-xl" />
            <p className="text-[10px] font-mono text-slate-400 mt-2">Scan with Telegram Camera</p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Launch <strong>@{TARGET_BOT_USERNAME}</strong> with your unique single-use token. Once opened, the bot will verify your authenticated identity and load your store catalog into memory.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {linkStatus === "idle" ? (
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={isGenerating || !user}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>{isGenerating ? "Generating..." : "Generate 1-Click Link"}</span>
                </button>
              ) : (
                <>
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#229ED9] hover:bg-[#1E8EC4] text-white flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Send size={13} className="rotate-45" />
                    <span>Open in Telegram (@{TARGET_BOT_USERNAME})</span>
                    <ExternalLink size={12} />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy Link"}</span>
                  </button>
                </>
              )}
            </div>

            {!user && (
              <p className="text-[11px] text-amber-600 font-medium">
                * Please sign in to your merchant account to generate a link token.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, setLang, toggleLang, t } = useLanguage();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('landing') === 'true') return true;
    return true;
  });
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Simple routing for public shop view
  const shopMatch = window.location.pathname.match(/\/shop\/([^\/]+)/);
  const publicShopId = shopMatch ? shopMatch[1] : null;

  if (publicShopId) {
    return <PublicShop shopId={publicShopId} />;
  }

  // Main Store State
  const [storeState, setStoreState] = useState<SystemState | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "orders"
    | "products"
    | "delivery"
    | "insights"
    | "bot_config"
    | "telegram_bot"
    | "web_chatbot"
    | "live_support"
    | "smart_marketing"
  >("orders");
  const [activeSessionId, setActiveSessionId] = useState<string>("default_customer");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Synchronize active user isolation in clientStore
  useEffect(() => {
    if (user?.id) {
      store.setActiveUser(user.id);
    } else {
      store.setActiveUser(null);
      setStoreState(null);
      setShopRecord(null);
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    if (user?.id) {
      store.clearUserState(user.id);
    }
    store.setActiveUser(null);
    await signOut();
    setStoreState(null);
    setShopRecord(null);
    setShowLandingPage(true);
  };

  // Onboarding / Config Draft state
  const [shopRecord, setShopRecord] = useState<ShopRecord | null>(null);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [configDraft, setConfigDraft] = useState<ShopConfig | null>(null);

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);
  const [savingAction, setSavingAction] = useState<boolean>(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Forms / Input Dialogs State
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNotification, setShowNotification] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [copiedConfigLink, setCopiedConfigLink] = useState<boolean>(false);

  // New Product Form state
  const [prodForm, setProdForm] = useState({
    name: "",
    price: 4500,
    cost_price: 2700,
    description: "",
    stock: 25,
    lead_time_days: 3,
    safety_stock_threshold: 5,
    image: "",
    varies: [] as { key: string; value: string }[],
    is_on_demand: false,
    waiting_time: ""
  });

  // New Zone Form state
  const [newZone, setNewZone] = useState({
    township_name: "",
    region: "",
    division: "",
    rate: 2000,
    estimated_transit_timeline: "1-2 Days"
  });
  const [showTownshipSuggestions, setShowTownshipSuggestions] = useState(false);

  // Delivery zones from API
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryZonesLoading, setDeliveryZonesLoading] = useState(false);
  const [deliveryZonesPage, setDeliveryZonesPage] = useState(1);
  const [deliveryZonesSearch, setDeliveryZonesSearch] = useState("");
  const [deliveryZonesPagination, setDeliveryZonesPagination] = useState({
    total_records: 0,
    current_page: 1,
    limit: 10,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });

  // Owner custom live reply states
  const [ownerReplyText, setOwnerReplyText] = useState<string>("");
  const [activeVerificationReceipt, setActiveVerificationReceipt] = useState<Order | null>(null);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  const onboardingInitialForm: OnboardingFormState = React.useMemo(() => {
    return shopRecord
      ? shopRecordToFormData(shopRecord)
      : {
          ...emptyOnboardingForm(storeState?.config?.shopName, storeState?.config?.ownerName),
          phone: storeState?.config?.phone || "",
        };
  }, [shopRecord, storeState?.config?.shopName, storeState?.config?.ownerName, storeState?.config?.phone]);

  // Fetch shop state from Supabase Storage
  const fetchState = async (silent = false) => {
    if (!user) return;
    store.setActiveUser(user.id);
    if (!silent) setLoading(true);
    try {
      // 1. Fetch JSON state from storage
      const data = await getShopState(user.id);
      
      // 2. Sync shop row from Postgres (source of truth for onboarding)
      try {
        const shopRow = await getShopForOwner(user.id);
        if (shopRow) {
          setShopRecord(shopRow);
          data.config.onboardingCompleted = shopRow.onboarding_completed;
          if (shopRow.shop_id) {
            data.config.shopId = shopRow.shop_id;
          } else {
            // Fallback for legacy shopId during migration
            const { data: legacy } = await supabase
              .from('business_onboarding')
              .select('shop_id')
              .eq('user_id', user.id)
              .maybeSingle();
            if (legacy?.shop_id) {
              data.config.shopId = legacy.shop_id;
            }
          }
          if (shopRow.shop_name) {
            data.config.shopName = shopRow.shop_name;
          }
          if (shopRow.owner_name) {
            data.config.ownerName = shopRow.owner_name;
          }
          const shopPhone =
            shopRow.phone?.trim() ||
            shopRow.onboarding_profile?.phone?.trim() ||
            "";
          if (shopPhone) {
            data.config.phone = shopPhone;
          }
        } else {
          setShopRecord(null);
        }
      } catch (dbError) {
        console.warn("Shop fetch error:", dbError);
      }

      // 3. Migrate products from JSON to table if needed
      if (data.products && data.products.length > 0 && !data.config.productsMigrated) {
        const result = await migrateProductsFromJson(user.id, data.products);
        if (result.success) {
          data.products = [];
          data.config.productsMigrated = true;
          await saveShopState(user.id, data);
        }
      }

      // 4. Fetch products from table
      const products = await getProducts(user.id);
      data.products = products;

      // 4.5. Fetch orders from Supabase Postgres table (source of truth) and merge
      try {
        const dbOrders = await getOrdersForOwner(user.id, data.config.shopId);
        const orderMap = new Map<string, Order>();

        // 1. Strict filter on JSON state orders: must belong to this user or shop
        (data.orders || []).forEach((o) => {
          const matchesOwner = o.owner_id && o.owner_id === user.id;
          const matchesShop = data.config.shopId && (o as any).shop_id && (o as any).shop_id === data.config.shopId;
          if (matchesOwner || matchesShop) {
            const key = o.invoiceId || o.id;
            if (key) orderMap.set(key, o);
          }
        });

        // 2. DB orders from Supabase (already filtered for this user/shop)
        dbOrders.forEach((o) => {
          const key = o.invoiceId || o.id;
          if (key) orderMap.set(key, o);
        });

        // 3. Local store orders (strictly match current owner or shop - NEVER match unowned orders)
        const localState = store.getState();
        (localState.orders || []).forEach((o) => {
          const key = o.invoiceId || o.id;
          const matchesOwner = o.owner_id && o.owner_id === user.id;
          const matchesShop = data.config.shopId && (o as any).shop_id && (o as any).shop_id === data.config.shopId;
          if (key && !orderMap.has(key) && (matchesOwner || matchesShop)) {
            orderMap.set(key, o);
          }
        });

        data.orders = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (orderErr) {
        console.warn("[App] Error syncing orders from DB:", orderErr);
      }

      // 4.6 Sync and ensure active sessions exist
      const localSessions = store.getState().sessions || {};
      const baseDefaults = getDefaultSessions();
      const combinedSessions = {
        ...baseDefaults,
        ...localSessions,
        ...(data.sessions || {}),
      };
      data.sessions = combinedSessions;

      // 5. Update states ONLY after all sync logic is done
      setStoreState(data);
      store.setStoreState(data);

      setConfigDraft((prev) => {
        if ((activeTab === "bot_config" || activeTab === "telegram_bot" || activeTab === "web_chatbot") && prev) return prev;
        return data.config;
      });
      const sessionKeys = Object.keys(combinedSessions);
      if (sessionKeys.length > 0 && !combinedSessions[activeSessionId]) {
        setActiveSessionId(sessionKeys[0]);
      }
    } catch (err) {
      console.debug("State load err:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const persistState = async (next: SystemState) => {
    if (!user) return;
    // Exclude products from JSON storage - they live in the products table now
    const stateToSave = { ...next, products: [] };
    await saveShopState(user.id, stateToSave);
    setStoreState(next);
  };

  const fetchDeliveryZonesFromApi = async () => {
    setDeliveryZonesLoading(true);
    const shopAddress =
      shopRecord?.address?.trim() ||
      shopRecord?.onboarding_profile?.business_address?.trim() ||
      "";
    try {
      const result = await fetchDeliveryMatrix(
        deliveryZonesPage,
        10,
        deliveryZonesSearch,
        shopAddress
      );
      setDeliveryZones(result.data);
      setDeliveryZonesPagination(result.pagination);
      setStoreState((prev) => (prev ? { ...prev, deliveryZones: result.data } : prev));
    } catch (err) {
      console.error("Failed to fetch delivery zones:", err);
      showToast(
        "Failed to load delivery zones", 
        "error"
      );
    } finally {
      setDeliveryZonesLoading(false);
    }
  };

  // Run initial state loading and setup periodic fast poll to grab customer simulator inputs immediately!
  useEffect(() => {
    if (user && !authLoading) {
      localStorage.setItem('sales_brain_visited', 'true');
    }
    if (!user) return;
    fetchState();

    // Pause periodic polling while actively onboarding or editing business profile
    if (!storeState?.config.onboardingCompleted || editingOnboarding) {
      return;
    }

    const interval = setInterval(() => {
      fetchState(true);
    }, 4500);

    return () => clearInterval(interval);
  }, [user?.id, authLoading, storeState?.config.onboardingCompleted, editingOnboarding]);
  // Instant real-time listener for orders created in the same browser session
  useEffect(() => {
    const handleOrderCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Order>;
      if (customEvent.detail) {
        const newOrder = customEvent.detail;
        if (user?.id) {
          const matchesOwner = (newOrder as any).owner_id === user.id;
          const matchesShop = shopRecord?.shop_id && (newOrder as any).shop_id === shopRecord.shop_id;
          if (!matchesOwner && !matchesShop) return;
        }
        setStoreState((prev) => {
          if (!prev) return prev;
          const exists = (prev.orders || []).some(
            (o) => o.invoiceId === newOrder.invoiceId || o.id === newOrder.id
          );
          const nextSessions = { ...prev.sessions };
          Object.keys(nextSessions).forEach((sKey) => {
            if (
              nextSessions[sKey].customerTelegramId === newOrder.customerTelegramId ||
              nextSessions[sKey].sessionId === newOrder.customerTelegramId ||
              !newOrder.customerTelegramId ||
              newOrder.customerTelegramId === "public_chat_customer"
            ) {
              nextSessions[sKey] = {
                ...nextSessions[sKey],
                cart: [],
              };
            }
          });
          return {
            ...prev,
            orders: exists ? prev.orders : [newOrder, ...(prev.orders || [])],
            sessions: nextSessions,
          };
        });
        showToast(`🎉 New order received! (${newOrder.invoiceId})`, "info");
      }
    };

    const handleCartCleared = () => {
      setStoreState((prev) => {
        if (!prev) return prev;
        const nextSessions = { ...prev.sessions };
        Object.keys(nextSessions).forEach((sKey) => {
          nextSessions[sKey] = {
            ...nextSessions[sKey],
            cart: [],
          };
        });
        return {
          ...prev,
          sessions: nextSessions,
        };
      });
    };

    const handleSessionUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<TelegramSession>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        setStoreState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sessions: {
              ...(prev.sessions || {}),
              [updated.sessionId]: updated,
            },
          };
        });
      }
    };

    window.addEventListener("sales_brain_session_updated", handleSessionUpdated);
    window.addEventListener("sales_brain_order_created", handleOrderCreated);
    window.addEventListener("sales_brain_cart_cleared", handleCartCleared);
    return () => {
      window.removeEventListener("sales_brain_session_updated", handleSessionUpdated);
      window.removeEventListener("sales_brain_order_created", handleOrderCreated);
      window.removeEventListener("sales_brain_cart_cleared", handleCartCleared);
    };
  }, []);

  // Supabase Realtime listener on "orders" table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("public-orders-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchState(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [storeState?.sessions, activeSessionId, activeTab]);

  useEffect(() => {
    if (activeTab !== "bot_config" && activeTab !== "telegram_bot" && activeTab !== "web_chatbot") return;
    if (storeState) {
      setConfigDraft((prev) => prev ?? storeState.config);
    }
  }, [activeTab, storeState]);

  // Fetch delivery zones when tab, page, search, or shop address changes
  useEffect(() => {
    if (activeTab === "delivery") {
      fetchDeliveryZonesFromApi();
    }
  }, [
    activeTab,
    deliveryZonesPage,
    deliveryZonesSearch,
    shopRecord?.address,
    shopRecord?.onboarding_profile?.business_address,
  ]);

  // Fetch AI strategy when the selected language changes
  useEffect(() => {
    fetchAiStrategy();
  }, [lang]);

  // Display toast alerts
  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setShowNotification({ text, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Retrieve AI Strategizer
  const fetchAiStrategy = async (_force: boolean = false) => {
    setLoadingAi(true);
    try {
      const data = await store.getAiStrategy(lang);
      setAiAnalysisText(data.strategy);
    } catch (err) {
      console.warn("Failed to load AI strategy briefing:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Onboarding Setup submit
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeState) return;
    setSavingAction(true);
    try {
      const data = await invokeApi<{ config?: ShopConfig }>("onboarding", {
        ...(configDraft || storeState.config),
      });
      if (data?.config) {
        setStoreState((prev) => (prev ? { ...prev, config: data.config! } : prev));
        setConfigDraft(data.config);
      }
      {
        showToast(
          "Online Shop Settings configured! Telegram Bot activated. 🟢",
          "success"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAction(false);
    }
  };

  // Reset demo store system to original template defaults
  const handleResetSystem = async () => {
    const confirmationMsg = "Restore factory demo values? This resets active simulator carts, orders checklist, and custom shop configurations.";
    
    if (window.confirm(confirmationMsg)) {
      try {
        await invokeApi("reset");
        {
          showToast(
            "Platform state successfully reset.",
            "success"
          );
          fetchState();
          fetchAiStrategy();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Product actions handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAction(true);
    try {
      const isEdit = !!editingProduct;
      if (!user) return;

      const productData = {
        id: editingProduct?.id,
        name: prodForm.name,
        price: Number(prodForm.price) || 0,
        cost_price: Number(prodForm.cost_price) || 0,
        lead_time_days: Number(prodForm.lead_time_days) || 3,
        safety_stock_threshold: Number(prodForm.safety_stock_threshold) || 5,
        description: prodForm.description,
        stock: Number(prodForm.stock) || 0,
        image: prodForm.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
        varies: prodForm.varies,
        is_on_demand: prodForm.is_on_demand,
        waiting_time: prodForm.waiting_time,
      };

      const result = await upsertProduct(user.id, productData);
      
      if (result.success) {
        showToast(
          isEdit 
            ? "Product information updated successfully!" 
            : "Added premium product to store catalog!",
          "success"
        );
        setShowProductModal(false);
        setEditingProduct(null);
        setProdForm({ name: "", price: 4500, cost_price: 2700, description: "", stock: 25, lead_time_days: 3, safety_stock_threshold: 5, image: "", varies: [], is_on_demand: false, waiting_time: "" });
        fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    const confirmMsg = `Are you sure you want to remove "${prod.name}" from your catalog?`;

    if (confirm(confirmMsg)) {
      try {
        if (!user) return;
        const result = await deleteProduct(prod.id, user.id);
        if (result.success) {
          showToast(
            "Product removed from catalog.",
            "info"
          );
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delivery zone Matrix adjustments
  const handleAddZone = async () => {
    if (!newZone.township_name.trim()) return;
    try {
      await addDeliveryZone({
        township_name: newZone.township_name,
        region: newZone.region,
        division: newZone.division,
        rate: Number(newZone.rate) || 0,
        estimated_transit_timeline: newZone.estimated_transit_timeline || "1-2 Days",
      });
      showToast(
        `Added township rate mapping for: ${newZone.township_name}`, 
        "success"
      );
      setNewZone({ township_name: "", region: "", division: "", rate: 2000, estimated_transit_timeline: "1-2 Days" });
      fetchDeliveryZonesFromApi();
    } catch (err) {
      console.error(err);
      showToast(
        "Failed to add delivery zone", 
        "error"
      );
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    try {
      await deleteDeliveryZone(id);
      showToast(
        `Removed township shipping rule: ${name}`,
        "info"
      );
      fetchDeliveryZonesFromApi();
    } catch (err) {
      console.error(err);
      showToast(
        "Failed to delete delivery zone",
        "error"
      );
    }
  };

  // Order payment screenshot evaluation trigger (Accept / Cancel)
  const handleUpdateOrderStatus = async (orderId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const targetOrder = storeState?.orders.find((o) => o.id === orderId || o.invoiceId === orderId);
      const prevStatus = targetOrder?.status;

      await invokeApi("orders/update", { orderId, status });
      await updateDbOrderStatus(orderId, status);
      store.updateOrderStatus(orderId, status);

      if (status === "confirmed" && prevStatus !== "confirmed" && targetOrder?.items && user) {
        await deductProductStock(user.id, targetOrder.items);
      }

      showToast(
        `Order status marked as [${status.toUpperCase()}]! Invoice sent.`,
        "success"
      );
      setActiveVerificationReceipt(null);
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakeover = async (sessId?: string) => {
    const targetId = sessId || activeSessionId;
    if (!targetId) return;

    // 1. Optimistic UI state update
    setStoreState((prev) => {
      if (!prev || !prev.sessions[targetId]) return prev;
      const sess = prev.sessions[targetId];
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [targetId]: {
            ...sess,
            liveTakeoverActive: true,
            messages: [
              ...sess.messages,
              {
                id: `sys-${Date.now()}`,
                sender: "system",
                content: "Shop Owner has taken over the chat. Candy AI is paused.",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      };
    });

    showToast(
      "🔴 Bot deactivated. Owner intervention launched! Live chat active.",
      "info"
    );

    try {
      await invokeApi("bot/takeover", { sessionId: targetId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseToAi = async (sessId?: string) => {
    const targetId = sessId || activeSessionId;
    if (!targetId) return;

    // 1. Optimistic UI state update
    setStoreState((prev) => {
      if (!prev || !prev.sessions[targetId]) return prev;
      const sess = prev.sessions[targetId];
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [targetId]: {
            ...sess,
            liveTakeoverActive: false,
            messages: [
              ...sess.messages,
              {
                id: `sys-${Date.now()}`,
                sender: "system",
                content: "AI assistant Candy is active again.",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      };
    });

    showToast(
      "🟢 Bot reactivated. Candy taking over.",
      "success"
    );

    try {
      await invokeApi("bot/release", { sessionId: targetId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOwnerMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const contentToSend = (customContent || ownerReplyText).trim();
    if (!contentToSend || !activeSessionId) return;

    const newMsg = {
      id: `mo-${Date.now()}`,
      sender: "owner" as const,
      content: contentToSend,
      timestamp: new Date().toISOString(),
    };

    // 1. Optimistic UI update
    setStoreState((prev) => {
      if (!prev || !prev.sessions[activeSessionId]) return prev;
      const sess = prev.sessions[activeSessionId];
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionId]: {
            ...sess,
            lastActive: new Date().toISOString(),
            messages: [...sess.messages, newMsg],
          },
        },
      };
    });

    setOwnerReplyText("");

    try {
      await invokeApi("bot/owner-reply", { sessionId: activeSessionId, content: contentToSend });
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Excel Formatter download simulation
  const exportExcelReport = () => {
    if (!storeState) return;
    
    // Create standard CSV structured rows representing store state accounting values
    const headers = "InvoiceID,Customer,Phone,TelegramID,Township,Subtotal,DeliveryRate,GrandTotal,Type,Status,Date\n";
    const rows = storeState.orders.map(o => {
      const prodSub = o.totalAmount - o.deliveryFee;
      return `${o.invoiceId},"${o.customerName}",${o.customerPhone},${o.customerTelegramId},${o.township},${prodSub},${o.deliveryFee},${o.totalAmount},${o.paymentMethod.toUpperCase()},${o.status.toUpperCase()},${o.createdAt}`;
    }).join("\n");

    const content = headers + rows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sales_Brain_Accounting_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(
      "CSV Ledger Account Excel sheet generated & downloaded! 📊",
      "success"
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-3 border-[#0069FF]/20 border-t-[#0069FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (showLandingPage) {
    return (
      <LandingPage
        isLoggedIn={!!user}
        onLogout={handleSignOut}
        onGetStarted={() => {
          if (user) {
            setShowLandingPage(false);
          } else {
            setAuthMode("signup");
            setShowLandingPage(false);
          }
        }}
        onLogin={() => {
          if (user) {
            setShowLandingPage(false);
          } else {
            setAuthMode("login");
            setShowLandingPage(false);
          }
        }}
        onDashboard={() => {
          setShowLandingPage(false);
        }}
      />
    );
  }

  if (!user) {
    return (
      <AuthPage
        initialMode={authMode}
        onBackToHome={() => setShowLandingPage(true)}
      />
    );
  }

  if (loading || !storeState) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-center items-center font-sans space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-[#0069FF]/20 border-t-[#0069FF] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-serif font-bold text-xs text-[#0069FF]">SB</div>
        </div>
        <div className="text-center font-sans">
          <h2 className="font-serif text-lg tracking-tight text-stone-900">Sales Brain AI</h2>
          <p className="text-xs text-stone-500 mt-1">Preparing your store...</p>
        </div>
      </div>
    );
  }


  const handleWizardComplete = async (
    profile: { shopName: string; ownerName: string; phone: string; businessAddress: string },
    aiSummary: string,
    wasEdit: boolean
  ) => {
    if (!user || !storeState) return;
    const updatedState = {
      ...storeState,
      config: {
        ...storeState.config,
        shopName: profile.shopName,
        ownerName: profile.ownerName,
        phone: profile.phone || storeState.config.phone,
        onboardingCompleted: true,
      },
    };
    setStoreState(updatedState);
    setAiAnalysisText(aiSummary);
    setEditingOnboarding(false);

    try {
      await invokeApi("onboarding", {
        ...storeState.config,
        shopName: profile.shopName,
        ownerName: profile.ownerName,
        phone: profile.phone || storeState.config.phone,
        onboardingCompleted: true,
      });
      await saveShopState(user.id, updatedState);
      showToast(
        wasEdit
          ? "Business profile updated successfully. 🟢"
          : "Setup completed! Welcome to your SME dashboard. 🟢",
        "success"
      );
      await fetchState(true);
    } catch (err) {
      console.error("[App] Saving onboarding stats failed", err);
      setStoreState(updatedState);
    }
  };

  // First-time setup or edit profile from dashboard
  if (!storeState.config.onboardingCompleted || editingOnboarding) {
    return (
      <Onboarding
        key={editingOnboarding ? `edit-${shopRecord?.id ?? "shop"}` : "setup"}
        lang={lang}
        isEditMode={editingOnboarding}
        initialFormData={onboardingInitialForm}
        onLangChange={setLang}
        onCancelEdit={() => setEditingOnboarding(false)}
        onComplete={(profile, aiSummary) =>
          handleWizardComplete(profile, aiSummary, editingOnboarding)
        }
      />
    );
  }
 

  // Derived dashboard analytics values
  const productsCount = storeState.products.length;
  const deliveryZonesCount = deliveryZones.length;
  const verifiedOrders = storeState.orders.filter(o => o.status === "confirmed" || o.status === "completed");
  const unverifiedPrepaysCount = storeState.orders.filter(o => o.status === "verifying" && o.paymentMethod === "prepay").length;
  const alertLowStock = storeState.products.filter(p => p.stock <= 5);
  const isDefaultBot = !storeState.config.telegramBotUsername;

  const totalSalesRevenue = verifiedOrders.reduce((sum, o) => {
    const revenueBeforeShipping = o.totalAmount; // includes delivery cost
    return sum + (revenueBeforeShipping - o.deliveryFee);
  }, 0);

  // SVG Chart data points matching week dates calculated from real verified orders
  const weekdaysChartData = (() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayTotals: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };
    verifiedOrders.forEach(o => {
      const d = new Date(o.createdAt);
      if (!isNaN(d.getTime())) {
        const dayIdx = (d.getDay() + 6) % 7;
        const dayName = days[dayIdx];
        const net = Math.max(0, o.totalAmount - (o.deliveryFee || 0));
        dayTotals[dayName] = (dayTotals[dayName] || 0) + net;
      }
    });
    return days.map(label => ({ label, value: dayTotals[label] || 0 }));
  })();

  const activeSession: TelegramSession =
    (storeState.sessions && storeState.sessions[activeSessionId]) ||
    (storeState.sessions && Object.values(storeState.sessions)[0]) ||
    getDefaultSessions().default_customer;

  const tabTitles: Record<string, string> = {
    orders: t("tabOrders"),
    products: t("tabProducts"),
    delivery: t("tabDelivery"),
    insights: t("tabInsights"),
    smart_marketing: t("tabSmartMarketing"),
    bot_config: t("tabTelegramBot"),
    telegram_bot: t("tabTelegramBot"),
    web_chatbot: t("tabWebChatbot"),
    live_support: t("tabLiveSupport"),
  };

  return (
    <div className="flex h-screen bg-[#FAF8F5] text-slate-900 font-sans overflow-hidden selection:bg-slate-900 selection:text-white relative">
      
      {/* Toast Notification HUD */}
      {showNotification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 transition-all">
          <div className="bg-[#0A1B2A] border border-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 font-medium max-w-sm">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium font-mono">{showNotification.text}</span>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR DRAWER (Only visible on screens < lg when toggled) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-stone-100 flex items-center justify-center shadow-xs">
                    <Store size={16} strokeWidth={1.8} className="text-stone-200" />
                  </div>
                  <div>
                    <h1 className="font-serif text-sm font-medium text-stone-900 tracking-tight">
                      Sales Brain
                    </h1>
                    <span className="text-[9px] font-medium text-stone-500 tracking-wide">
                      Commerce Studio
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Store Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {storeState.config.shopName || "My Store"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {storeState.config.ownerName || "Merchant Owner"}
                </p>
              </div>

              {/* Mobile Nav Links */}
              <div className="space-y-1">
                {[
                  { id: "orders", label: t("tabOrders"), icon: ShoppingBag },
                  { id: "products", label: t("tabProducts"), icon: Database },
                  { id: "delivery", label: t("tabDelivery"), icon: Truck },
                  { id: "insights", label: t("tabInsights"), icon: Sparkles },
                  { id: "smart_marketing", label: t("tabSmartMarketing"), icon: TrendingUp },
                  { id: "live_support", label: t("tabLiveSupport"), icon: MessageSquare },
                  { id: "telegram_bot", label: t("tabTelegramBot"), icon: Send },
                  { id: "web_chatbot", label: t("tabWebChatbot"), icon: Store },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-slate-900 text-white font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut size={16} />
                <span>{t("signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. DESKTOP FULL-HEIGHT LEFT SIDEBAR */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-[#E7E5E4] flex-col justify-between shrink-0 h-full z-30 select-none">
        
        {/* TOP: Brand Logo & Store Selector */}
        <div className="p-4 border-b border-[#E7E5E4] space-y-3.5">
          {/* Brand Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-stone-100 flex items-center justify-center shadow-xs">
                <Store size={16} strokeWidth={1.8} className="text-stone-200" />
              </div>
              <div>
                <h1 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">
                  Sales Brain
                </h1>
                <span className="text-[10px] font-medium text-[#78716C] tracking-wide block">
                  Commerce Studio
                </span>
              </div>
            </div>
          </div>

          {/* Active Store Card */}
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl flex items-center justify-between group hover:border-stone-400 transition-colors">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-[#1C1917] truncate">
                {storeState.config.shopName || "My Online Shop"}
              </p>
              <p className="text-[10px] text-[#57534E] truncate">
                {storeState.config.ownerName || "Merchant Owner"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingOnboarding(true);
                if (user?.id) {
                  getShopForOwner(user.id).then((freshShop) => {
                    if (freshShop) setShopRecord(freshShop);
                  });
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-white transition-colors cursor-pointer"
              title="Edit Store Profile"
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>

        {/* MIDDLE: Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
          
          {/* Section 1: Operations */}
          <div>
            <p className="px-3 text-[10px] font-bold font-mono tracking-[0.15em] text-[#78716C] uppercase mb-1.5">
              Operations
            </p>
            <div className="space-y-1">
              {/* Orders */}
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "orders"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag size={15} className={activeTab === "orders" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabOrders")}</span>
                </div>
                {unverifiedPrepaysCount > 0 ? (
                  <span className="text-[10px] font-bold bg-[#0069FF] text-white px-2 py-0.5 rounded-full shadow-2xs">
                    {unverifiedPrepaysCount}
                  </span>
                ) : verifiedOrders.length > 0 ? (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === "orders" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                    {verifiedOrders.length}
                  </span>
                ) : null}
              </button>

              {/* Products */}
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "products"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database size={15} className={activeTab === "products" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabProducts")}</span>
                </div>
                {alertLowStock.length > 0 ? (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activeTab === "products" ? "bg-stone-800 text-rose-300" : "bg-stone-100 text-stone-700"}`}>
                    {alertLowStock.length} low
                  </span>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === "products" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                    {productsCount}
                  </span>
                )}
              </button>

              {/* Delivery */}
              <button
                type="button"
                onClick={() => setActiveTab("delivery")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "delivery"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck size={15} className={activeTab === "delivery" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabDelivery")}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === "delivery" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                  {deliveryZonesCount}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Intelligence & Growth */}
          <div>
            <p className="px-3 text-[10px] font-bold font-mono tracking-[0.15em] text-[#78716C] uppercase mb-1.5">
              Intelligence &amp; Growth
            </p>
            <div className="space-y-1">
              {/* AI Strategy */}
              <button
                type="button"
                onClick={() => setActiveTab("insights")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "insights"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={15} className={activeTab === "insights" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabInsights")}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium ${activeTab === "insights" ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"}`}>
                  Advisor
                </span>
              </button>

              {/* Smart Marketing */}
              <button
                type="button"
                onClick={() => setActiveTab("smart_marketing")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "smart_marketing"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={15} className={activeTab === "smart_marketing" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabSmartMarketing")}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium ${activeTab === "smart_marketing" ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"}`}>
                  Campaigns
                </span>
              </button>

              {/* Live VIP Support */}
              <button
                type="button"
                onClick={() => setActiveTab("live_support")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "live_support"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={15} className={activeTab === "live_support" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabLiveSupport")}</span>
                </div>
                {activeSession?.liveTakeoverActive && (
                  <span className="text-[9px] font-semibold bg-[#0069FF] text-white px-2 py-0.5 rounded-full shadow-2xs">
                    VIP Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Bot Connections */}
          <div>
            <p className="px-3 text-[10px] font-bold font-mono tracking-[0.15em] text-[#78716C] uppercase mb-1.5">
              Bot Connections
            </p>
            <div className="space-y-1">
              {/* Telegram Bot Connection */}
              <button
                type="button"
                onClick={() => setActiveTab("telegram_bot")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "telegram_bot" || activeTab === "bot_config"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send size={15} className={`rotate-45 ${activeTab === "telegram_bot" || activeTab === "bot_config" ? "text-white" : "text-sky-500 group-hover:text-sky-600"}`} />
                  <span>{t("tabTelegramBot")}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono ${activeTab === "telegram_bot" || activeTab === "bot_config" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                  Telegram
                </span>
              </button>

              {/* Public Web Chatbot Connection */}
              <button
                type="button"
                onClick={() => setActiveTab("web_chatbot")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "web_chatbot"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store size={15} className={activeTab === "web_chatbot" ? "text-white" : "text-emerald-500 group-hover:text-emerald-600"} />
                  <span>{t("tabWebChatbot")}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono ${activeTab === "web_chatbot" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                  Web Bot
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* BOTTOM: User Profile Footer */}
        <div className="p-3 border-t border-[#E7E5E4] bg-[#FAF8F5] space-y-2.5">
          

          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                {user?.email?.charAt(0) || "M"}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-900 font-semibold truncate max-w-[120px]">
                  {storeState.config.ownerName || "Merchant"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={user?.email || ""}>
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* TOP CONTEXTUAL BAR */}
        <header className="h-14 border-b border-[#E7E5E4] bg-[#FAF8F5]/90 backdrop-blur-sm px-3 sm:px-6 flex items-center justify-between shrink-0 z-20 gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0 shrink">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 mr-0.5 cursor-pointer shrink-0 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
            <span className="text-stone-400 font-medium hidden md:inline shrink-0 whitespace-nowrap">{t("workspace")}</span>
            <ChevronRight size={12} className="text-stone-300 hidden md:inline shrink-0" />
            <span className="font-serif text-sm sm:text-base font-semibold text-[#0A1B2A] tracking-tight truncate min-w-0">
              {tabTitles[activeTab]}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-full overflow-x-auto no-scrollbar py-1">
            

            {/* Landing Page */}
            <button
              type="button"
              onClick={() => setShowLandingPage(true)}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-[#E7E5E4] transition-all cursor-pointer hidden sm:inline-flex items-center gap-1.5 shadow-2xs active:scale-[0.98] shrink-0 whitespace-nowrap"
              title={t("landingPage")}
              aria-label={t("landingPage")}
            >
              <ExternalLink size={13} className="text-stone-400 shrink-0" />
              <span className="hidden xl:inline">{t("landingPage")}</span>
            </button>

            {/* Edit Profile */}
            <button
              type="button"
              onClick={() => {
                setEditingOnboarding(true);
                if (user?.id) {
                  getShopForOwner(user.id).then((freshShop) => {
                    if (freshShop) setShopRecord(freshShop);
                  });
                }
              }}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-[#E7E5E4] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-[0.98] shrink-0 whitespace-nowrap"
              title={t("editProfile")}
              aria-label={t("editProfile")}
            >
              <Edit2 size={13} className="text-stone-400 shrink-0" />
              <span className="hidden lg:inline">{t("editProfile")}</span>
            </button>

            {/* Telegram Live Bot */}
            {storeState.config.telegramBotUsername && (
              <a
                href={`https://t.me/${storeState.config.telegramBotUsername.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-[#E7E5E4] transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-[0.98] shrink-0 whitespace-nowrap"
                title={t("liveBot")}
                aria-label={t("liveBot")}
              >
                <Send size={11} className="rotate-45 text-stone-400 shrink-0" />
                <span className="hidden xl:inline">{t("liveBot")}</span>
              </a>
            )}

            {/* Simulate Customer Chat Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0 whitespace-nowrap ${
                showSimulator
                  ? "bg-[#0069FF] hover:bg-[#0052CC] text-white"
                  : "bg-white hover:bg-stone-100 text-[#0A1B2A] border border-[#E7E5E4]"
              }`}
              title={showSimulator ? t("closeSimulatorButton") : t("viewSimulatorButton")}
              aria-label={showSimulator ? t("closeSimulatorButton") : t("viewSimulatorButton")}
            >
              <Smartphone size={13} className={`shrink-0 ${showSimulator ? "text-white" : "text-[#0069FF]"}`} />
              <span className="hidden sm:inline">
                {showSimulator ? t("closeSimulatorButton") : t("viewSimulatorButton")}
              </span>
              <span className="sm:hidden">
                {showSimulator ? "Close" : "Simulate"}
              </span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#FAF8F5]">
          <div className={`mx-auto transition-all ${showSimulator ? "max-w-[1600px] flex flex-col xl:flex-row gap-8 items-start" : "max-w-7xl"}`}>
            
            {/* PRIMARY WORKSPACE */}
            <main className={`space-y-6 min-w-0 ${showSimulator ? "flex-1 w-full" : "w-full"}`}>

          {/* TOP ACTIVE SYSTEM MESSAGES HUB */}
          {unverifiedPrepaysCount > 0 && (
            <div className="bg-white border border-[#E7E5E4] p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0069FF] flex items-center justify-center shrink-0 border border-[#0069FF]/20">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-[#1C1917]">
                      {t("webhookAlertTitle").replace("{count}", String(unverifiedPrepaysCount))}
                    </h4>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] leading-relaxed mt-0.5 line-clamp-1">
                    {t("webhookAlertBody")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab("orders");
                  const verifyingOrder = storeState.orders.find(o => o.status === "verifying" && o.paymentMethod === "prepay");
                  if (verifyingOrder) {
                    setActiveVerificationReceipt(verifyingOrder);
                  }
                }}
                className="bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] shrink-0 shadow-xs"
              >
                {t("reviewReceipts")} →
              </button>
            </div>
          )}

          {/* BUSINESS HIGH LEVEL KPI COUNTERS */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors">
              <span className="text-[10px] font-semibold font-mono tracking-wider text-[#78716C] uppercase">
                {t("totalStoreRevenue")}
              </span>
              <div className="mt-2.5">
                <span className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
                  {totalSalesRevenue.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-[#78716C] ml-1.5">MMK</span>
              </div>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors">
              <span className="text-[10px] font-semibold font-mono tracking-wider text-[#78716C] uppercase">
                {t("validatedOrders")}
              </span>
              <div className="mt-2.5">
                <span className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
                  {verifiedOrders.length}
                </span>
                <span className="text-xs font-medium text-[#78716C] ml-1.5">orders</span>
              </div>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors">
              <span className="text-[10px] font-semibold font-mono tracking-wider text-[#78716C] uppercase">
                {t("needsVerification")}
              </span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
                  {unverifiedPrepaysCount}
                </span>
                <span className="text-xs font-medium text-[#78716C]">evals</span>
                {unverifiedPrepaysCount > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                    Review
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors">
              <span className="text-[10px] font-semibold font-mono tracking-wider text-[#78716C] uppercase">
                {t("stockWarnings")}
              </span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
                  {alertLowStock.length}
                </span>
                <span className="text-xs font-medium text-[#78716C]">items</span>
                {alertLowStock.length > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60 font-medium">
                    Low
                  </span>
                )}
              </div>
            </div>

          </section>

          {/* TAB 1: ORDERS VERIFICATION HUB AND LEDGER TABLE */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              
              {/* LEDGER WORKSPACE */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                      {t("pendingTransactionsLedger")}
                    </h3>
                  </div>
                  
                  <button
                    onClick={exportExcelReport}
                    className="bg-[#1C1917] hover:bg-stone-850 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
                  >
                    <Download size={13} className="text-stone-300" /> {t("exportLedgerCsv")}
                  </button>
                </div>

                {/* Orders responsive Table */}
                <div className="overflow-x-auto text-xs text-[#57534E]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7E5E4] bg-[#FAF8F5]/80 text-[10px] uppercase font-mono tracking-wider font-semibold text-[#78716C]">
                        <th className="p-3">{t("orderInvoice")}</th>
                        <th className="p-3">{t("clientCustomer")}</th>
                        <th className="p-3">{t("addressLocation")}</th>
                        <th className="p-3">{t("paymentMethod")}</th>
                        <th className="p-3 text-right">{t("invoiceSum")}</th>
                        <th className="p-3 text-center">{t("receiptVerification")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]/80 bg-white">
                      {storeState.orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#78716C] italic font-sans">No business orders submitted yet.</td>
                        </tr>
                      ) : (
                        storeState.orders.map((o) => {
                          const isVerifying = o.status === "verifying";
                          const isConfirmed = o.status === "confirmed";
                          const isCancelled = o.status === "cancelled";
                          
                          return (
                            <tr key={o.id} className="hover:bg-[#FAF8F5]/60 transition-colors font-mono">
                              <td className="p-3 font-semibold text-[#1C1917] text-xs">
                                <span className="block">{o.invoiceId}</span>
                                {o.items && o.items.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 font-sans">
                                    {o.items.map((it, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200/80 font-mono"
                                      >
                                        {it.quantity}× {it.productName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap font-sans text-xs">
                                <span className="font-semibold text-[#1C1917] block">{o.customerName}</span>
                                <span className="text-[11px] text-[#78716C] block">{o.customerPhone}</span>
                              </td>
                              <td className="p-3 font-sans text-xs text-[#57534E] leading-tight">
                                <span className="font-medium text-[#1C1917] block">{o.township}</span>
                                <span className="text-[11px] text-[#78716C] line-clamp-1">{o.addressDetails || o.township}</span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full font-mono ${
                                  o.paymentMethod === "prepay" ? "bg-stone-100 text-stone-700 border border-stone-200/80" : "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                }`}>
                                  {o.paymentMethod.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold text-[#1C1917] text-xs">{o.totalAmount.toLocaleString()} MMK</td>
                              <td className="p-3 text-center">
                                {isVerifying ? (
                                  <button
                                    onClick={() => setActiveVerificationReceipt(o)}
                                    className="bg-[#0069FF] hover:bg-[#0052CC] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
                                  >
                                    {t("evaluateReceipt")}
                                  </button>
                                ) : o.paymentMethod === "cod" && o.status === "pending" ? (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, "confirmed")}
                                    className="bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
                                  >
                                    {t("approveCod")}
                                  </button>
                                ) : o.status === "confirmed" ? (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, "completed")}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
                                  >
                                    {t("markCompleted")}
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#78716C] italic font-sans">{t("noAuditNeeded")}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* EVALUATOR PANEL PREVIEW MODAL ASIDE PANEL */}
              {activeVerificationReceipt && (
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-lg animate-fadeIn grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-xs font-semibold font-mono text-amber-900 select-none block bg-amber-50 p-2.5 rounded-xl border border-amber-200/70">
                      {t("evaluateReceiptHeader")}
                    </span>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex flex-col border-b border-[#E7E5E4] pb-2">
                        <span className="text-[10px] text-[#78716C] uppercase">{t("invoiceRef")}:</span>
                        <strong className="text-[#1C1917] mt-0.5">{activeVerificationReceipt.invoiceId}</strong>
                      </div>
                      <div className="flex flex-col border-b border-[#E7E5E4] pb-2">
                        <span className="text-[10px] text-[#78716C] uppercase">{t("clientCustomer")}:</span>
                        <strong className="text-[#1C1917] mt-0.5">{activeVerificationReceipt.customerName}</strong>
                      </div>
                      <div className="flex flex-col border-b border-[#E7E5E4] pb-2">
                        <span className="text-[10px] text-[#78716C] uppercase">{t("transactionId")}:</span>
                        <strong className="text-indigo-700 mt-0.5 font-bold">{activeVerificationReceipt.paymentDetails?.transactionId}</strong>
                      </div>
                      <div className="flex flex-col border-b border-[#E7E5E4] pb-2">
                        <span className="text-[10px] text-[#78716C] uppercase">{t("paymentChannel")}:</span>
                        <strong className="text-[#57534E] mt-0.5">{activeVerificationReceipt.paymentDetails?.method}</strong>
                      </div>
                    </div>

                    {activeVerificationReceipt.items && activeVerificationReceipt.items.length > 0 && (
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E5E4] space-y-1.5">
                        <span className="text-[10px] text-[#78716C] uppercase font-mono block font-semibold">
                          {t("orderItems")}:
                        </span>
                        <div className="space-y-1">
                          {activeVerificationReceipt.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-mono text-stone-800">
                              <span>{it.quantity}× {it.productName}</span>
                              <span>{((it.price || 0) * (it.quantity || 1)).toLocaleString()} MMK</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7E5E4] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#78716C] uppercase font-mono">{t("totalCharged")}:</span>
                      <strong className="text-[#1C1917] font-semibold font-mono text-base">
                        {activeVerificationReceipt.totalAmount.toLocaleString()} MMK
                      </strong>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(activeVerificationReceipt.id, "confirmed")}
                        className="w-full sm:flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-full text-xs transition-all cursor-pointer text-center active:scale-[0.98]"
                      >
                        {t("confirmGenerateInvoice")}
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(activeVerificationReceipt.id, "cancelled")}
                        className="w-full sm:flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 font-semibold py-2.5 rounded-full text-xs transition-all cursor-pointer text-center active:scale-[0.98]"
                      >
                        {t("rejectScreenshot")}
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveVerificationReceipt(null)}
                      className="w-full text-center text-xs text-[#78716C] mt-2 font-mono hover:text-[#1C1917] cursor-pointer"
                    >
                      {t("closeEvalPane")}
                    </button>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-center">
                    <span className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider block mb-2 font-semibold">
                      {t("submittedScreenshotEvidence")}
                    </span>
                    <div className="border border-[#E7E5E4] bg-[#FAF8F5] p-2.5 rounded-2xl text-center relative max-h-[290px] overflow-hidden">
                      <img
                        src={activeVerificationReceipt.paymentDetails?.screenshotUrl}
                        alt="Submitted receipt attachment proof"
                        className="w-auto h-auto max-h-[260px] object-contain mx-auto rounded-xl shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: PRODUCT CATALOG SETUP */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E7E5E4] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                    {t("premiumStoreCatalog")}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProdForm({ name: "", price: 4500, cost_price: 2700, description: "", stock: 25, lead_time_days: 3, safety_stock_threshold: 5, image: "", varies: [], is_on_demand: false, waiting_time: "" });
                    setShowProductModal(true);
                  }}
                  className="bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
                >
                  <Plus size={14} /> {t("addNewProduct")}
                </button>
              </div>

              {/* Product matrix grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeState.products.map((p) => (
                  <div key={p.id} className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden flex flex-col shadow-2xs hover:border-stone-300 transition-colors group">
                    <div className="h-44 bg-[#FAF8F5] relative overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                      
                      {/* Out of stock tag warnings */}
                      {p.stock <= 5 && (
                        <span className="absolute left-3 top-3 text-[9px] font-mono font-semibold bg-rose-750/90 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs shadow-xs">
                          {t("lowStockTag")} ({p.stock})
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-[#1C1917] line-clamp-1">{p.name}</h4>
                        {p.varies && p.varies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.varies.slice(0, 3).map((vary, idx) => (
                              <div key={idx} className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded-md text-[#57534E]">
                                <span className="text-[#78716C] font-semibold">{vary.key}</span>
                                <span className="text-stone-300">•</span>
                                <span className="text-[#1C1917] font-semibold">{vary.value}</span>
                              </div>
                            ))}
                            {p.varies.length > 3 && (
                              <span className="text-[10px] font-medium text-[#78716C] bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded-md">
                                +{p.varies.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-[#E7E5E4]/70 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-mono text-[#78716C] uppercase block">{t("unitPriceMmk")}:</span>
                          <span className="font-mono font-semibold text-xs text-[#1C1917]">{p.price.toLocaleString()} MMK</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#78716C] uppercase block text-right">{t("stockLevel")}:</span>
                          <span className="font-mono text-xs text-[#57534E] block text-right">{p.stock} units</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E5E4]/70">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProdForm({
                              name: p.name,
                              price: p.price,
                              cost_price: p.cost_price || Math.round(p.price * 0.6),
                              description: p.description,
                              stock: p.stock,
                              lead_time_days: p.lead_time_days || 3,
                              safety_stock_threshold: p.safety_stock_threshold || 5,
                              image: p.image,
                              varies: p.varies || [],
                              is_on_demand: p.is_on_demand || false,
                              waiting_time: p.waiting_time || ""
                            });
                            setShowProductModal(true);
                          }}
                          className="bg-stone-50 hover:bg-stone-100 border border-[#E7E5E4] text-[#1C1917] py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <Edit2 size={11} className="text-stone-500" /> {t("editInfo")}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-700 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <Trash size={11} className="text-rose-600" /> {t("delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Modal Window */}
              {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                  {/* Backdrop Click Dismiss */}
                  <div className="fixed inset-0 cursor-default" onClick={() => setShowProductModal(false)}></div>

                  <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl p-6 w-full max-w-lg text-[#1C1917] relative z-10 space-y-4 animate-in zoom-in-95 duration-200 my-8">
                    <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                      <h4 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                        {editingProduct ? t("editProductHeader") : t("addNewProductHeader")}
                      </h4>
                      <button onClick={() => setShowProductModal(false)} className="text-[#78716C] hover:text-[#1C1917] cursor-pointer p-1 rounded-full hover:bg-[#FAF8F5] transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs text-[#57534E]">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("brandNameLabel")}</label>
                        <input
                          type="text"
                          required
                          value={prodForm.name}
                          onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF] transition-colors"
                          placeholder="e.g., Premium Product Name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">{t("unitPriceLabel")}</label>
                          <input
                            type="number"
                            required
                            value={prodForm.price}
                            onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                            className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] font-mono focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF] transition-colors"
                            placeholder="e.g., 4500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">Cost / COGS (MMK)</label>
                          <input
                            type="number"
                            value={prodForm.cost_price}
                            onChange={(e) => setProdForm({ ...prodForm, cost_price: Number(e.target.value) })}
                            className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] font-mono focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF] transition-colors"
                            placeholder="e.g., 2700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">{t("availableStockLabel")}</label>
                          <input
                            type="number"
                            required
                            value={prodForm.stock}
                            onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                            className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] font-mono focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF] transition-colors"
                            placeholder="e.g., 25"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">{t("imageUrlLabel")}</label>
                          {prodForm.image ? (
                            <div className="relative border border-[#E7E5E4] rounded-xl overflow-hidden bg-[#FAF8F5] p-2 flex items-center justify-between gap-2 shadow-inner h-[38px]">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={prodForm.image}
                                  alt="Product Preview"
                                  className="w-6 h-6 rounded object-cover border border-[#E7E5E4] shadow-2xs"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[10px] text-emerald-700 font-semibold truncate font-mono">Uploaded</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProdForm({ ...prodForm, image: "" })}
                                className="text-rose-700 hover:text-rose-800 font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase hover:bg-rose-50"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center border border-dashed border-[#E7E5E4] hover:border-[#0069FF] bg-[#FAF8F5] hover:bg-[#EFF6FF] rounded-xl px-3 py-2 cursor-pointer transition-all duration-150 relative h-[38px] text-center">
                              <span className="text-xs font-semibold text-[#0069FF] flex items-center gap-1">
                                <Image size={11} className="shrink-0" />
                                Upload File
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setProdForm({ ...prodForm, image: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">{t("shortDescriptionLabel")}</label>
                        <textarea
                          value={prodForm.description}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          rows={3}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF] transition-colors"
                          placeholder="Explain ingredients or packing..."
                        />
                      </div>

                      {/* Varies Section */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">
                          VARIES
                        </label>
                        <div className="space-y-2">
                          {prodForm.varies.map((vary, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                              <input
                                type="text"
                                value={vary.key}
                                onChange={(e) => {
                                  const updated = [...prodForm.varies];
                                  updated[idx].key = e.target.value;
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2 text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                                placeholder="Key (e.g., Size)"
                              />
                              <input
                                type="text"
                                value={vary.value}
                                onChange={(e) => {
                                  const updated = [...prodForm.varies];
                                  updated[idx].value = e.target.value;
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2 text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                                placeholder="Value (e.g., 500g)"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = prodForm.varies.filter((_, i) => i !== idx);
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setProdForm({ ...prodForm, varies: [...prodForm.varies, { key: "", value: "" }] });
                            }}
                            className="w-full bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] text-[#57534E] py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.99]"
                          >
                            <Plus size={12} /> Add Varies
                          </button>
                        </div>
                      </div>

                      {/* On Demand Toggle */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodForm.is_on_demand}
                            onChange={(e) => setProdForm({ ...prodForm, is_on_demand: e.target.checked, waiting_time: e.target.checked ? prodForm.waiting_time : "" })}
                            className="w-4 h-4 text-[#0069FF] border-[#E7E5E4] rounded focus:ring-[#0069FF]"
                          />
                          <span className="text-xs font-medium text-[#1C1917]">
                            On Demand
                          </span>
                        </label>
                      </div>

                      {/* Conditional Waiting Time Input */}
                      {prodForm.is_on_demand && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-semibold text-[#78716C] block uppercase">
                            WAITING TIME
                          </label>
                          <input
                            type="text"
                            value={prodForm.waiting_time}
                            onChange={(e) => setProdForm({ ...prodForm, waiting_time: e.target.value })}
                            className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2 text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                            placeholder="e.g., 2 days"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={savingAction}
                        className="w-full bg-[#0069FF] hover:bg-[#0052CC] text-white py-3 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] shadow-2xs"
                      >
                        {savingAction ? "Processing..." : editingProduct ? t("confirmProductRevisions") : t("addItemCatalog")}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOWNSHIP MATRIX CONTROL */}
          {activeTab === "delivery" && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                      {t("townshipDeliveryRateMatrix")}
                    </h3>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      {t("defineDeliveryFees")}
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#E7E5E4]/80">
                  <span className="text-[11px] font-medium text-[#78716C] mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setNewZone({ township_name: "Local City Delivery", region: "", division: "", rate: 2500, estimated_transit_timeline: "1-2 Days" })}
                    className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] rounded-full text-[11px] font-medium text-[#1C1917] cursor-pointer transition-colors"
                  >
                    + Local City (2,500 MMK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewZone({ township_name: "Mandalay Region (Bus Gate)", region: "Mandalay Region", division: "", rate: 4000, estimated_transit_timeline: "2-3 Days" })}
                    className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] rounded-full text-[11px] font-medium text-[#1C1917] cursor-pointer transition-colors"
                  >
                    + Mandalay Region (4,000 MMK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewZone({ township_name: "Yangon Region (Bus Gate)", region: "Yangon Region", division: "", rate: 4000, estimated_transit_timeline: "2-3 Days" })}
                    className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] rounded-full text-[11px] font-medium text-[#1C1917] cursor-pointer transition-colors"
                  >
                    + Yangon Region (4,000 MMK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewZone({ township_name: "Other States & Regions (Highway Bus Gate)", region: "", division: "", rate: 4500, estimated_transit_timeline: "2-4 Days" })}
                    className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] rounded-full text-[11px] font-medium text-[#1C1917] cursor-pointer transition-colors"
                  >
                    + Inter-State Bus Gate (4,500 MMK)
                  </button>
                </div>

                {/* Insertion row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 items-end text-xs text-[#57534E]">
                  <div className="space-y-1 sm:col-span-5">
                    <label className="text-[10px] text-[#78716C] block font-mono font-semibold uppercase">{t("townshipNameLabel")}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newZone.township_name}
                        onChange={(e) => {
                          setNewZone({ ...newZone, township_name: e.target.value });
                          setShowTownshipSuggestions(true);
                        }}
                        onFocus={() => setShowTownshipSuggestions(true)}
                        placeholder="e.g., Kamayut, Chanayethazan, Taunggyi, or Mandalay Region"
                        className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                      />
                      {showTownshipSuggestions && newZone.township_name.trim().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E7E5E4] rounded-xl shadow-lg max-h-44 overflow-y-auto">
                          {loadAllDeliveryLocations()
                            .filter(t => t.toLowerCase().includes(newZone.township_name.toLowerCase()))
                            .slice(0, 12)
                            .map((township, idx) => (
                              <div
                                key={`${township}-${idx}`}
                                className="px-3 py-2 hover:bg-[#FAF8F5] cursor-pointer text-xs text-[#1C1917]"
                                onClick={() => {
                                  setNewZone({ ...newZone, township_name: township });
                                  setShowTownshipSuggestions(false);
                                }}
                              >
                                {township}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[10px] text-[#78716C] block font-mono font-semibold uppercase">{t("rateLabel")}</label>
                    <input
                      type="number"
                      value={newZone.rate}
                      onChange={(e) => setNewZone({ ...newZone, rate: Number(e.target.value) })}
                      className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] font-mono text-xs focus:outline-none focus:border-[#0069FF]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-[#78716C] block font-mono font-semibold uppercase">Transit Time</label>
                    <select
                      value={newZone.estimated_transit_timeline}
                      onChange={(e) => setNewZone({ ...newZone, estimated_transit_timeline: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF] cursor-pointer"
                    >
                      <option value="1-2 Days">1-2 Days</option>
                      <option value="2-3 Days">2-3 Days</option>
                      <option value="2-4 Days">2-4 Days</option>
                      <option value="3-5 Days">3-5 Days</option>
                      <option value="Same Day">Same Day</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      onClick={handleAddZone}
                      className="w-full bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer h-10 transition-all active:scale-[0.98] shadow-2xs"
                    >
                      {t("addRateRule")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Input */}
              <div className="bg-white border border-[#E7E5E4] p-4 rounded-2xl shadow-2xs">
                <input
                  type="text"
                  value={deliveryZonesSearch}
                  onChange={(e) => {
                    setDeliveryZonesSearch(e.target.value);
                    setDeliveryZonesPage(1);
                  }}
                  placeholder="Search township or region name..."
                  className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                />
              </div>

              {/* Township list grid */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden text-xs shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E5E4] bg-[#FAF8F5]/80 text-[10px] uppercase font-mono tracking-wider font-semibold text-[#78716C]">
                      <th className="p-3 w-1/4">{t("matchedTownship")}</th>
                      <th className="p-3 w-1/4">{t("rateLabel")}</th>
                      <th className="p-3 w-1/4">{t("estimatedTransit")}</th>
                      <th className="p-3 w-1/4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]/80 bg-white text-[#57534E] font-mono">
                    {deliveryZonesLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#78716C] font-sans">
                          <RefreshCw size={16} className="animate-spin inline-block mr-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : deliveryZones.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#78716C] font-sans">
                          No delivery zones found
                        </td>
                      </tr>
                    ) : (
                      deliveryZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="p-3 font-semibold text-[#1C1917] w-1/4 font-sans">{zone.township_name}</td>
                          <td className="p-3 text-emerald-700 font-semibold w-1/4">{zone.rate.toLocaleString()} MMK</td>
                          <td className="p-3 text-[#78716C] w-1/4 font-sans">{zone.estimated_transit_timeline}</td>
                          <td className="p-3 text-right w-1/4">
                            <button
                              onClick={() => handleDeleteZone(zone.id, zone.township_name)}
                              className="text-rose-600 hover:text-rose-700 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                              title={t("removeRule")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {deliveryZonesPagination.total_pages > 1 && (
                <div className="flex items-center justify-between bg-white border border-[#E7E5E4] rounded-2xl p-4 text-xs">
                  <div className="text-[#78716C] font-mono text-[11px]">
                    Page {deliveryZonesPagination.current_page} of {deliveryZonesPagination.total_pages} 
                    ({deliveryZonesPagination.total_records} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeliveryZonesPage(p => p - 1)}
                      disabled={!deliveryZonesPagination.has_prev}
                      className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-xs font-semibold cursor-pointer text-[#1C1917]"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setDeliveryZonesPage(p => p + 1)}
                      disabled={!deliveryZonesPagination.has_next}
                      className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-xs font-semibold cursor-pointer text-[#1C1917]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI STRATEGY DESK */}
          {activeTab === "insights" && storeState && (
            <AIStrategyDesk
              shopId={storeState.config.shopId || user?.id || "default_shop"}
              ownerId={user?.id || "default_owner"}
              products={storeState.products || []}
              orders={storeState.orders || []}
              sessionsCount={Object.keys(storeState.sessions || {}).length}
              weekdaysChartData={weekdaysChartData}
              onExportCsv={exportExcelReport}
            />
          )}

          {/* TAB 5A: TELEGRAM BOT CONNECTION */}
          {(activeTab === "telegram_bot" || activeTab === "bot_config") && (
            <div className="space-y-6 animate-fadeIn">
              {/* TELEGRAM BOT INTEGRATION */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5F5F4]">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                        <Send size={15} className="rotate-45" />
                      </div>
                      <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                        Telegram Commerce Bot
                      </h3>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                        Direct Channel
                      </span>
                    </div>
                    <p className="text-xs text-[#78716C] mt-1">
                      Connect your Telegram bot for automatic order capture, stock inquiries, and live customer takeover.
                    </p>
                  </div>
                  {storeState.config.telegramBotUsername && (
                    <a
                      href={`https://t.me/${storeState.config.telegramBotUsername.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-[#229ED9] hover:bg-[#1E8EC4] text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0 self-start sm:self-auto active:scale-[0.98]"
                    >
                      <Send size={11} className="rotate-45" />
                      <span>Open in Telegram</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {/* Telegram Bot Handle & Status Card */}
                <div className="p-4 bg-[#FAF8F5] border border-sky-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#1C1917]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-200/60">
                      <Send size={15} className="rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1C1917]">
                        Active Telegram Bot Handle
                      </h4>
                      <p className="text-[11px] text-[#78716C] font-mono">
                        @{storeState.config.telegramBotUsername?.replace("@", "") || "Jjkql_bot"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Webhook Active
                    </span>
                  </div>
                </div>

                {/* Telegram Store Handshake (Token & QR Code) */}
                <TelegramConnectSection user={user} t={t} />
              </div>

              {/* STORE MERCHANT PROFILE */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F4]">
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">
                      Merchant Store Profile
                    </h3>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Business identity synced with bot replies and customer receipts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingOnboarding(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit2 size={12} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("storeNameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.shopName || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("smeOwnerNameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.ownerName || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("contactPhoneLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.phone || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5B: PUBLIC WEB CHATBOT & STOREFRONT */}
          {activeTab === "web_chatbot" && (
            <div className="space-y-6 animate-fadeIn">
              {/* PUBLIC WEB CHATBOT & STOREFRONT */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5F5F4]">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
                        <Store size={15} />
                      </div>
                      <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                        Public Web Chatbot &amp; Storefront
                      </h3>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80">
                        Browser &amp; Social
                      </span>
                    </div>
                    <p className="text-xs text-[#78716C] mt-1">
                      Shareable interactive store link for customers arriving from Facebook, Instagram, TikTok, or Viber.
                    </p>
                  </div>
                  {storeState.config.shopId && (
                    <a
                      href={buildShopPublicUrl(storeState.config.shopId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1C1917] hover:bg-stone-800 text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0 self-start sm:self-auto active:scale-[0.98]"
                    >
                      <ExternalLink size={12} />
                      <span>Preview Storefront</span>
                    </a>
                  )}
                </div>

                {/* Shareable Link Box */}
                {storeState.config.shopId ? (
                  <div className="p-4 bg-[#FAF8F5] border border-stone-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag size={15} className="text-stone-700" />
                        <h4 className="text-xs font-semibold text-[#1C1917]">
                          Your Dedicated Storefront URL
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">
                        Shop ID: {storeState.config.shopId}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#57534E] truncate flex items-center">
                        {buildShopPublicUrl(storeState.config.shopId)}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = buildShopPublicUrl(storeState.config.shopId!);
                          navigator.clipboard.writeText(url);
                          setCopiedConfigLink(true);
                          setTimeout(() => setCopiedConfigLink(false), 2000);
                        }}
                        className={`px-4 py-2 rounded-full border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs active:scale-[0.98] ${
                          copiedConfigLink 
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                            : "bg-white border-[#E7E5E4] text-[#1C1917] hover:bg-stone-50"
                        }`}
                      >
                        {copiedConfigLink ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedConfigLink ? "Copied" : "Copy Link"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                    Complete store onboarding to generate your public storefront URL.
                  </div>
                )}

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white border border-stone-200/70 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                      <Bot size={13} className="text-stone-700" />
                      <span>Natural Order Bot</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Customers chat in Myanmar or English to inquire and build carts.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-stone-200/70 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                      <Truck size={13} className="text-stone-700" />
                      <span>Township Rates</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Instant delivery rate calculation based on customer township.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-stone-200/70 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                      <Check size={13} className="text-emerald-600" />
                      <span>Slip Settlement</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Mobile wallet screenshot verification and cash on delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* STORE MERCHANT PROFILE */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F4]">
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">
                      Merchant Store Profile
                    </h3>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Business identity synced with bot replies and customer receipts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingOnboarding(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit2 size={12} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("storeNameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.shopName || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("smeOwnerNameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.ownerName || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("contactPhoneLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-medium truncate">
                      {storeState.config.phone || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRM DIRECT SUPPORT LIVE WORKSPACE & CHAT TAKE-OVER CRM */}
          {/* CRM DIRECT SUPPORT LIVE WORKSPACE & CHAT TAKE-OVER CRM */}
          {activeTab === "live_support" && (
            <section className="bg-white border border-stone-200/70 rounded-[32px] p-6 sm:p-8 shadow-xs">
              {/* Header & Session Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-serif text-xl font-normal text-[#0A1B2A] tracking-tight">
                      {t("liveSupportRoomHeader")}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.liveTakeoverActive ? "bg-amber-500" : "bg-emerald-500"}`} />
                      {activeSession?.liveTakeoverActive ? "Personal" : "AI Agent"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
                    {t("chatTakeoverDesc")}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const newSess = store.createSimulationCustomer();
                      setActiveSessionId(newSess.sessionId);
                      showToast(`✨ Added new test customer (${newSess.customerName})`, "info");
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-full text-xs font-medium bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={13} className="text-stone-500" />
                    <span>New Test Buyer</span>
                  </button>

                  {/* Selector for active customer chat session */}
                  <div className="relative flex-1 sm:flex-initial">
                    <select
                      value={activeSessionId}
                      onChange={(e) => setActiveSessionId(e.target.value)}
                      className="w-full bg-stone-50 hover:bg-stone-100/80 border border-stone-200/70 text-stone-800 text-xs rounded-full px-3.5 py-2 pr-8 appearance-none focus:outline-none focus:border-stone-400 cursor-pointer transition-colors"
                    >
                      {(Object.values(storeState?.sessions || {}) as TelegramSession[]).map((sess) => (
                        <option key={sess.sessionId} value={sess.sessionId}>
                          {sess.customerName || "Customer"} · {sess.liveTakeoverActive ? "Personal" : "AI"}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat list visual layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-[#0A1B2A]">
                
                {/* Session list items sidebar */}
                <div className="md:col-span-1 space-y-2 border-r border-stone-100 pr-5 max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[11px] font-medium text-stone-400 tracking-wide uppercase">
                      {t("activeUserSessionsLabel")}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {Object.keys(storeState?.sessions || {}).length}
                    </span>
                  </div>

                  {(Object.values(storeState?.sessions || {}) as TelegramSession[]).map((sess) => {
                    const isSessActive = sess.sessionId === activeSessionId;
                    const latestMsg = sess.messages[sess.messages.length - 1];

                    return (
                      <div
                        key={sess.sessionId}
                        onClick={() => setActiveSessionId(sess.sessionId)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                          isSessActive
                            ? "bg-stone-100/70 text-stone-900 border border-stone-200/80"
                            : "bg-white hover:bg-stone-50/70 border border-transparent text-stone-600"
                        }`}
                      >
                        <div className="text-xs font-medium flex items-center justify-between text-stone-900">
                          <span className="truncate pr-2">{sess.customerName || "Customer"}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              sess.liveTakeoverActive ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 leading-normal">
                          {latestMsg ? latestMsg.content : "No messages recorded"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                          <span className={`font-medium ${sess.liveTakeoverActive ? "text-amber-700" : "text-emerald-700"}`}>
                            {sess.liveTakeoverActive ? t("supportLabel") : t("aiAutoLabel")}
                          </span>
                          <span>
                            {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CRM Live Dialogue monitor screen */}
                <div className="md:col-span-2 space-y-4 flex flex-col justify-between min-h-[460px]">
                  
                  {/* Messages stream */}
                  <div
                    ref={chatScrollRef}
                    className="p-5 bg-stone-50/50 border border-stone-200/60 rounded-2xl space-y-3.5 max-h-[340px] overflow-y-auto"
                  >
                    {activeSession && activeSession.messages && activeSession.messages.length > 0 ? (
                      activeSession.messages.map((m, idx) => (
                        <div key={idx} className="text-xs">
                          {m.sender === "system" ? (
                            <div className="flex justify-center my-2">
                              <span className="bg-stone-200/60 text-stone-600 text-[10px] px-3 py-1 rounded-full font-medium">
                                {m.content}
                              </span>
                            </div>
                          ) : (
                            <div className={`flex flex-col gap-1 ${m.sender === "owner" ? "items-end" : "items-start"}`}>
                              <span className="text-[10px] text-stone-400 font-medium px-1">
                                {m.sender === "customer"
                                  ? activeSession.customerName || "Customer"
                                  : m.sender === "owner"
                                  ? "You (Store Owner)"
                                  : "Candy AI"}
                              </span>
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                                  m.sender === "owner"
                                    ? "bg-stone-900 text-stone-50 rounded-tr-xs"
                                    : m.sender === "customer"
                                    ? "bg-white border border-stone-200/70 text-stone-800 rounded-tl-xs shadow-2xs"
                                    : "bg-stone-100/90 text-stone-700 rounded-tl-xs"
                                }`}
                              >
                                <span className="whitespace-pre-line">{m.content}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-stone-400 italic py-12 text-center text-xs">
                        {t("noMessagesChosen")}
                      </div>
                    )}
                  </div>

                  {/* Mode Banner & Switcher (Subdued, calm pill bar) */}
                  {!activeSession?.liveTakeoverActive ? (
                    <div className="px-4 py-2.5 bg-stone-50 border border-stone-200/60 rounded-2xl flex items-center justify-between text-xs text-stone-600 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Candy AI is currently responding to this customer automatically.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTakeover(activeSession.sessionId)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-stone-900 hover:bg-stone-800 text-white cursor-pointer transition-colors shrink-0"
                      >
                        {t("switchToManualLabel")}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-center justify-between text-xs text-amber-900 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Personal VIP mode active. Candy AI is paused while you converse directly.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReleaseToAi(activeSession.sessionId)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-amber-100/60 border border-amber-300/80 text-amber-900 cursor-pointer transition-colors shrink-0"
                      >
                        {t("turnOnAiBotLabel")}
                      </button>
                    </div>
                  )}

                  {/* Quick Canned Suggestions when Takeover is Active */}
                  {activeSession?.liveTakeoverActive && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-stone-400 font-medium tracking-wide uppercase px-0.5">
                        Suggested replies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "မင်္ဂလာပါရှင့်! ၂ မျိုးလုံး stock ရှိပါတယ်ရှင် (Both in stock)",
                          "ဟုတ်ကဲ့ ၂ မျိုးလုံးယူရင် 5% discount ပေးပါမယ်ရှင် (5% discount)",
                          "KPay / WavePay လက်ခံပါတယ်ရှင် (KPay/WavePay accepted)",
                          "အော်ဒါ confirm လုပ်ပေးရမလားရှင်? (Confirm order?)"
                        ].map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => setOwnerReplyText(chip)}
                            className="text-[11px] bg-white border border-stone-200/70 hover:border-stone-400 hover:bg-stone-50 text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Owner Intervention replies */}
                  <form onSubmit={handleSendOwnerMessage} className="pt-1">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        disabled={!activeSession?.liveTakeoverActive}
                        value={ownerReplyText}
                        onChange={(e) => setOwnerReplyText(e.target.value)}
                        placeholder={activeSession?.liveTakeoverActive ? t("ownerChatInputPlaceholder") : t("takeoverPlaceholder")}
                        className="flex-1 bg-stone-50 hover:bg-stone-100/60 border border-stone-200/70 rounded-full px-4 py-2.5 text-xs text-[#0A1B2A] placeholder:text-stone-400 disabled:opacity-40 disabled:hover:bg-stone-50 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!activeSession?.liveTakeoverActive || !ownerReplyText.trim()}
                        className="bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white font-medium px-5 py-2.5 rounded-full text-xs cursor-pointer transition-colors shrink-0"
                      >
                        {t("sendMessageBtn")}
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            </section>
          )}

          {activeTab === "smart_marketing" && storeState && (
            <SmartMarketing state={storeState} lang={lang} />
          )}

        </main>

        {/* RIGHT DRAWER: TELEGRAM SMARTPHONE SIMULATOR */}
        {showSimulator && (
          <aside className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-0 animate-fadeIn">
            <div className="bg-[#1C1917] border border-stone-850 p-4 rounded-2xl mb-4 text-center shadow-lg relative overflow-hidden">
              <h4 className="font-serif text-sm font-medium tracking-tight text-white relative z-10 flex items-center justify-center gap-1.5">
                <Smartphone size={14} className="text-amber-400" />
                <span>{t("simulationSandboxTitle")}</span>
              </h4>
              <p className="text-[11px] text-stone-300 mt-1 leading-relaxed relative z-10 font-sans">
                {t("quickGuidanceExplanation")}
              </p>
            </div>

            <TelegramSimulator
              session={activeSession}
              products={storeState.products}
              deliveryZones={deliveryZones}
              onStateUpdated={() => fetchState(true)}
              onSendReply={async (text) => {
                fetchState(true);
              }}
              onTriggerTakeover={async () => {
                await handleTakeover(activeSession.sessionId);
              }}
              onTriggerRelease={async () => {
                await handleReleaseToAi(activeSession.sessionId);
              }}
            />
          </aside>
        )}

          </div>
        </div>

      </div>

    </div>
  );
}
