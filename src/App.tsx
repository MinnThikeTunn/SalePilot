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
  Languages,
  Send,
  Copy,
  Menu,
  LogOut,
  User,
  Bot
} from "lucide-react";

import { CustomChart } from "./components/CustomChart";
import { TelegramSimulator } from "./components/TelegramSimulator";
import { SmartMarketing } from "./components/SmartMarketing";
import { Onboarding } from "./components/Onboarding";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { PublicShop } from "./components/PublicShop";
import { useAuth } from "./contexts/AuthContext";
import { invokeApi } from "./services/api";
import { getShopState, saveShopState } from "./services/shopState";
import {
  emptyOnboardingForm,
  getShopForOwner,
  shopRecordToFormData,
} from "./services/shopRecord";
import { getProducts, migrateProductsFromJson, upsertProduct, deleteProduct } from "./services/productService";
import type { OnboardingFormState, ShopRecord } from "./types";
import { Product, DeliveryZone, Order, ShopConfig, TelegramSession, SystemState } from "./types";
import * as store from "./services/clientStore";
import { supabase } from "./utils/supabase";
import { fetchDeliveryMatrix, addDeliveryZone, deleteDeliveryZone } from "./services/deliveryMatrixApi";
import { buildShopPublicUrl } from "./utils/shopId";
import { loadTownships } from "./data/townships";
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
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "delivery" | "insights" | "bot_config" | "live_support" | "smart_marketing">("orders");
  const [botConnectionTab, setBotConnectionTab] = useState<"messenger" | "telegram">("messenger");
  const [activeSessionId, setActiveSessionId] = useState<string>("default_customer");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Onboarding / Config Draft state
  const [shopRecord, setShopRecord] = useState<ShopRecord | null>(null);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [configDraft, setConfigDraft] = useState<ShopConfig | null>(null);
  const [messengerStatus, setMessengerStatus] = useState<{
    connected: boolean;
    oauth_completed?: boolean;
    pending_page_selection?: boolean;
    pages: { id: string; name: string }[];
    active_page_id?: string | null;
    error?: string;
  } | null>(null);
  const [loadingMessengerStatus, setLoadingMessengerStatus] = useState<boolean>(false);
  const [pendingPageId, setPendingPageId] = useState<string>("");

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
    description: "",
    stock: 25,
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

      // 5. Update states ONLY after all sync logic is done
      setStoreState(data);

      setConfigDraft((prev) => {
        if (activeTab === "bot_config" && prev) return prev;
        return data.config;
      });
      if (data.sessions && Object.keys(data.sessions).length > 0) {
        const keys = Object.keys(data.sessions);
        if (!keys.includes(activeSessionId)) {
          setActiveSessionId(keys[0]);
        }
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

  const fetchMessengerStatus = async () => {
    setLoadingMessengerStatus(true);
    try {
      const data = await invokeApi<{
        connected: boolean;
        oauth_completed?: boolean;
        pending_page_selection?: boolean;
        pages: { id: string; name: string }[];
        active_page_id?: string | null;
        error?: string;
      }>("messenger/status");
      const pages = Array.isArray(data.pages) ? data.pages : [];
      setMessengerStatus({
        connected: Boolean(data.connected),
        oauth_completed: Boolean(data.oauth_completed),
        pending_page_selection: Boolean(data.pending_page_selection),
        pages,
        active_page_id: data.active_page_id,
        error: data.error,
      });
      if (data.active_page_id) {
        setPendingPageId(String(data.active_page_id));
      } else if (pages.length === 1) {
        setPendingPageId(pages[0].id);
      }
    } catch {
      setMessengerStatus({
        connected: false,
        pages: [],
        error: "Could not reach API. Check Omnichannel backend on port 8000.",
      });
    } finally {
      setLoadingMessengerStatus(false);
    }
  };

  const startFacebookConnect = async () => {
    try {
      const redirectUri =
        (import.meta.env.VITE_FB_REDIRECT_URI as string | undefined)?.replace(/\/$/, "") ||
        `${window.location.origin}/facebook/callback`;

      const data = await invokeApi<{ url?: string; state?: string; error?: string }>(
        "messenger/auth-url",
        { redirect_uri: redirectUri }
      );
      if (data.error || !data.url) {
        showToast(
          data.error || "Unable to start Facebook login.",
          "info"
        );
        return;
      }

      if (data.state) {
        sessionStorage.setItem("fb_oauth_state", data.state);
      }

      const popup = window.open(data.url, "fb_oauth", "width=620,height=720");
      if (!popup) {
        showToast(
          "Please allow popups for this site.",
          "info"
        );
        return;
      }

      const onMessage = (ev: MessageEvent) => {
        if (ev.data?.type === "messenger_oauth_done") {
          window.removeEventListener("message", onMessage);
          fetchMessengerStatus();
          fetchState(true);
        }
      };
      window.addEventListener("message", onMessage);

      const poll = setInterval(() => {
        if (popup.closed) {
          clearInterval(poll);
          window.removeEventListener("message", onMessage);
          fetchMessengerStatus();
          fetchState(true);
        }
      }, 2000);
      setTimeout(() => {
        clearInterval(poll);
        window.removeEventListener("message", onMessage);
      }, 180000);
    } catch {
      showToast(
        "Start Omnichannel backend: uvicorn app.main:app --reload --port 8000",
        "info"
      );
    }
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

  // Load Messenger status when opening the Messenger tab (not on every state poll)
  useEffect(() => {
    if (activeTab !== "bot_config" || botConnectionTab !== "messenger") return;
    if (storeState) {
      setConfigDraft((prev) => prev ?? storeState.config);
      if (botConnectionTab === "messenger") {
        fetchMessengerStatus();
      }
    }
  }, [activeTab, storeState, botConnectionTab]);

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
        setProdForm({ name: "", price: 4500, description: "", stock: 25, image: "", varies: [], is_on_demand: false, waiting_time: "" });
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
      await invokeApi("orders/update", { orderId, status });
      {
        showToast(
          `Order status marked as [${status.toUpperCase()}]! Invoice sent.`,
          "success"
        );
        setActiveVerificationReceipt(null);
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakeover = async (sessId: string) => {
    try {
      await invokeApi("bot/takeover", { sessionId: sessId });
      {
        showToast(
          "🔴 Bot deactivated. Owner intervention launched! Live chat active.",
          "info"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseToAi = async (sessId: string) => {
    try {
      await invokeApi("bot/release", { sessionId: sessId });
      {
        showToast(
          "🟢 Bot reactivated. Candy taking over.",
          "success"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOwnerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerReplyText.trim()) return;
    try {
      await invokeApi("bot/owner-reply", { sessionId: activeSessionId, content: ownerReplyText });
      setOwnerReplyText("");
      fetchState();
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
          <p className="text-xs text-stone-500 mt-1">Preparing your merchant sanctuary...</p>
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

  const activeSession: TelegramSession | undefined = storeState.sessions[activeSessionId] || Object.values(storeState.sessions)[0];

  const tabTitles: Record<string, string> = {
    orders: t("tabOrders"),
    products: t("tabProducts"),
    delivery: t("tabDelivery"),
    insights: t("tabInsights"),
    smart_marketing: t("tabSmartMarketing"),
    bot_config: t("tabConfig"),
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
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                    <Sparkles size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-xs font-extrabold tracking-wider font-mono text-slate-900 uppercase">
                      Sales Brain
                    </h1>
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">
                      AI Commerce Suite
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
                  { id: "bot_config", label: t("tabConfig"), icon: Settings },
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
              {/* Mobile Language Switcher */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-600">{t("chooseLanguage")}</span>
                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      lang === "en" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("my")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      lang === "my" ? "bg-[#0069FF] text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    မြန်မာ
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  setStoreState(null);
                  setShopRecord(null);
                }}
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
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#0069FF]/30 text-[#0069FF] flex items-center justify-center font-bold shadow-xs">
                <Sparkles size={16} />
              </div>
              <div>
                <h1 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">
                  Sales Brain
                </h1>
                <span className="text-[10px] font-bold text-[#78716C] font-mono tracking-widest uppercase block">
                  AI Commerce Suite
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
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

          {/* Section 3: Channels */}
          <div>
            <p className="px-3 text-[10px] font-bold font-mono tracking-[0.15em] text-[#78716C] uppercase mb-1.5">
              Channels
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("bot_config")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                  activeTab === "bot_config"
                    ? "bg-[#1C1917] text-white font-semibold shadow-xs"
                    : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={15} className={activeTab === "bot_config" ? "text-white" : "text-stone-400 group-hover:text-stone-700"} />
                  <span>{t("tabConfig")}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono ${activeTab === "bot_config" ? "bg-stone-800 text-stone-300" : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E]"}`}>
                  Meta &amp; TG
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* BOTTOM: User Profile Footer */}
        <div className="p-3 border-t border-[#E7E5E4] bg-[#FAF8F5] space-y-2.5">
          {/* Desktop Sidebar Language Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-xl border border-[#E7E5E4] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#57534E]">{t("chooseLanguage")}</span>
            <div className="flex items-center bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E7E5E4]">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  lang === "en" ? "bg-[#1C1917] text-white shadow-xs" : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("my")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  lang === "my" ? "bg-[#0069FF] text-white shadow-xs" : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                မြန်မာ
              </button>
            </div>
          </div>

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
              onClick={async () => {
                await signOut();
                setStoreState(null);
                setShopRecord(null);
              }}
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
            {/* Header Language Switcher */}
            <div className="flex items-center bg-white/90 p-0.5 rounded-full border border-[#E7E5E4] shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === "en"
                    ? "bg-[#0A1B2A] text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("my")}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === "my"
                    ? "bg-[#0069FF] text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="မြန်မာဘာသာသို့ ပြောင်းမည်"
              >
                မြန်မာ
              </button>
            </div>

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
                {showSimulator ? (lang === "my" ? "ပိတ်မည်" : "Close") : (lang === "my" ? "စမ်းသပ်မည်" : "Simulate")}
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
                              <td className="p-3 font-semibold text-[#1C1917] text-xs">{o.invoiceId}</td>
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
                    setProdForm({ name: "", price: 4500, description: "", stock: 25, image: "", varies: [], is_on_demand: false, waiting_time: "" });
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
                              description: p.description,
                              stock: p.stock,
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
                <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                  {t("townshipDeliveryRateMatrix")}
                </h3>

                {/* Insertion row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 items-end text-xs text-[#57534E]">
                  <div className="space-y-1 sm:col-span-2">
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
                        placeholder="e.g., Yankin, Tamwe, North Dagon"
                        className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] text-xs focus:outline-none focus:border-[#0069FF]"
                      />
                      {showTownshipSuggestions && newZone.township_name.trim().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E7E5E4] rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {loadTownships()
                            .filter(t => t.toLowerCase().includes(newZone.township_name.toLowerCase()))
                            .slice(0, 10)
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

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#78716C] block font-mono font-semibold uppercase">{t("rateLabel")}</label>
                    <input
                      type="number"
                      value={newZone.rate}
                      onChange={(e) => setNewZone({ ...newZone, rate: Number(e.target.value) })}
                      className="w-full bg-[#FAF8F5] border border-[#E7E5E4] p-2.5 rounded-xl text-[#1C1917] font-mono text-xs focus:outline-none focus:border-[#0069FF]"
                    />
                  </div>

                  <button
                    onClick={handleAddZone}
                    className="bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold py-2 px-5 rounded-full text-xs cursor-pointer h-10 transition-all active:scale-[0.98] shadow-2xs"
                  >
                    {t("addRateRule")}
                  </button>
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
                  placeholder="Search township name..."
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

          {/* TAB 4: AI STRATEGY & REAL BUSINESS INSIGHTS */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              
              {/* SVG Charts section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs flex-1">
                    <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight mb-2">
                      {t("weeklyStoreVolume")}
                    </h3>
                    <CustomChart data={weekdaysChartData} color="#0069FF" title="Revenue Matrix" unit="MMK" />
                  </div>
                </div>

                <div className="md:col-span-4 bg-white border border-[#E7E5E4] rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight mb-2">
                      {t("leanAccountingStatsSummary")}
                    </h3>
                    
                    <div className="mt-4 space-y-3 text-xs font-mono">
                      <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-2.5">
                        <span className="text-[#78716C] font-sans">{t("grossSalesValue")}</span>
                        <strong className="text-[#1C1917]">{totalSalesRevenue.toLocaleString()} MMK</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-2.5">
                        <span className="text-[#78716C] font-sans">{t("ordersCompiled")}</span>
                        <strong className="text-[#57534E]">{storeState.orders.length} orders</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-2.5">
                        <span className="text-[#78716C] font-sans">{t("canceledTransactions")}</span>
                        <strong className="text-rose-600 font-semibold">{storeState.orders.filter(o => o.status === 'cancelled').length} entries</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={exportExcelReport}
                    className="w-full bg-[#1C1917] hover:bg-stone-850 text-white py-2.5 rounded-full font-semibold text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <Download size={13} className="text-stone-300" /> {t("downloadLedgerCsv")}
                  </button>
                </div>
              </div>

               {/* LIVE GEMINI STRATEGIST ADVICE CARD */}
              <div className="bg-white border border-[#E7E5E4] p-6 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">
                        {t("salesBrainAdvisorDesk")}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchAiStrategy(true)}
                    disabled={loadingAi}
                    className="text-xs font-semibold text-[#1C1917] hover:text-[#0069FF] bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <RefreshCw size={11} className={loadingAi ? "animate-spin text-[#0069FF]" : "text-stone-400"} /> {loadingAi ? t("analyzingPatterns").substring(0, 10) : t("reEvaluateStrategy")}
                  </button>
                </div>

                {loadingAi ? (
                  <div className="py-12 text-center text-[#78716C] font-mono text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-[#0069FF]/20 border-t-[#0069FF] rounded-full animate-spin mx-auto"></div>
                    <div>{t("analyzingPatterns")}</div>
                  </div>
                ) : (
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E7E5E4] leading-relaxed text-xs text-[#1C1917] space-y-3 font-sans max-w-none whitespace-pre-line select-text">
                    {aiAnalysisText}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: BOT ACTIVATION SETUP */}
          {activeTab === "bot_config" && (
            <div className="space-y-4">
              {/* Bot Type Sub-tabs */}
              <div className="flex bg-[#FAF8F5] p-1 rounded-full border border-[#E7E5E4] w-fit shadow-2xs">
                <button
                  onClick={() => setBotConnectionTab("messenger")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    botConnectionTab === "messenger"
                      ? "bg-[#1C1917] text-white shadow-xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  Messenger
                </button>
                <button
                  onClick={() => setBotConnectionTab("telegram")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    botConnectionTab === "telegram"
                      ? "bg-[#1C1917] text-white shadow-xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  Telegram
                </button>
              </div>

              {botConnectionTab === "telegram" ? (
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] animate-fadeIn">
                  <h3 className="font-serif text-lg font-medium text-[#1C1917] flex items-center gap-2 mb-1 tracking-tight">
                    {t("telegramBotActivationWorkspace")}
                  </h3>
                <p className="text-xs text-[#78716C]">{t("oneClickOnboardingDesc")}</p>

                {storeState.config.telegramBotUsername && (
                  <div className="mt-5 p-4 bg-[#FAF8F5] border border-sky-200/70 rounded-2xl flex items-center justify-between gap-3 text-[#1C1917]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-200/60">
                        <Send size={15} className="rotate-45" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#1C1917]">
                          Direct Link to Active Telegram Bot
                        </h4>
                        <p className="text-[11px] text-[#78716C] font-mono">
                          @{storeState.config.telegramBotUsername.replace("@", "")}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://t.me/${storeState.config.telegramBotUsername.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-[#229ED9] hover:bg-[#1E8EC4] text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0 active:scale-[0.98]"
                    >
                      <Send size={11} className="rotate-45" />
                      <span>{t("liveBot")}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {storeState.config.shopId && (
                  <div className="mt-4 p-4 bg-[#FAF8F5] border border-indigo-200/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200/60">
                        <ShoppingBag size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#1C1917]">
                          Your Public Shop Link
                        </h4>
                        <p className="text-[11px] text-[#78716C]">
                          Share this with your customers
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#57534E] truncate flex items-center">
                        {buildShopPublicUrl(storeState.config.shopId)}
                      </div>
                      <button
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
                        <span>{copiedConfigLink ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleOnboardingSubmit} className="space-y-4 mt-6 text-xs text-[#57534E]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("storeNameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#57534E] font-mono text-xs cursor-not-allowed select-none">
                      {storeState.config.shopName || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("smeOwnerNameLabel")}</label>
                      <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#57534E] font-mono text-xs cursor-not-allowed select-none">
                        {storeState.config.ownerName || "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("contactPhoneLabel")}</label>
                      <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#57534E] font-mono text-xs cursor-not-allowed select-none">
                        {storeState.config.phone || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">{t("telegramBotUsernameLabel")}</label>
                    <div className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#57534E] font-mono text-xs cursor-not-allowed select-none">
                      {storeState.config.telegramBotUsername || "@Jjkql_bot"}
                    </div>
                    <a
                      href="https://t.me/Jjkql_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-mono mt-1"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
                      t.me/Jjkql_bot
                    </a>
                  </div>

                  <TelegramConnectSection user={user} t={t} />

                  <button
                    type="submit"
                    disabled={savingAction}
                    className="w-full bg-[#1C1917] hover:bg-stone-850 text-white font-semibold py-3 rounded-full cursor-pointer uppercase text-xs tracking-wider transition-all active:scale-[0.98] shadow-2xs"
                  >
                    {savingAction ? "Re-connecting..." : t("saveStoreSettingsBtn")}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs text-[#1C1917] animate-fadeIn">
                <h3 className="font-serif text-lg font-medium text-[#1C1917] flex items-center gap-2 mb-1 tracking-tight">
                  {t("messengerBotActivationWorkspace")}
                </h3>
                
                {loadingMessengerStatus && (
                  <div className="text-xs text-[#78716C] font-mono mb-3 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    Checking Messenger connection…
                  </div>
                )}

                {messengerStatus?.error && !messengerStatus.connected && (
                  <div className="mb-4 p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900">
                    {messengerStatus.error}
                  </div>
                )}

                {messengerStatus?.connected ? (
                  <div className="space-y-4 mt-5">
                    <div className="p-4 bg-[#FAF8F5] border border-indigo-200/70 rounded-2xl flex items-center justify-between gap-3 text-[#1C1917]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          f
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-[#1C1917]">
                            Active: {storeState.config.messengerBotName || "Facebook Page"}
                          </h4>
                          <p className="text-[11px] text-[#78716C] font-mono">
                            ID: {storeState.config.messengerBotId}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs uppercase tracking-wider font-mono">
                        Live
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingAction(true);
                        try {
                          await invokeApi("messenger/disconnect");
                          if (storeState && user) {
                            await persistState({
                              ...storeState,
                              config: {
                                ...storeState.config,
                                messengerBotId: "",
                                messengerBotName: "",
                              },
                            });
                          }
                          setPendingPageId("");
                          showToast(
                            "Messenger bot disconnected",
                            "info"
                          );
                          fetchMessengerStatus();
                        } finally {
                          setSavingAction(false);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {t("disconnectFacebook")}
                    </button>
                  </div>
                ) : messengerStatus?.pending_page_selection ? (
                  <div className="space-y-4 mt-5">
                    <p className="text-xs text-[#57534E] leading-relaxed bg-[#FAF8F5] border border-[#E7E5E4] rounded-2xl p-4">
                      {t("oauthCompleteChoosePage")}
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase block">
                        {t("selectPageLabel")}
                      </label>
                      <select
                        className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-[#1C1917] font-mono text-xs focus:outline-none focus:border-[#0069FF]"
                        value={pendingPageId}
                        onChange={(e) => setPendingPageId(e.target.value)}
                      >
                        <option value="">-- Select Page --</option>
                        {messengerStatus.pages.map((page) => (
                          <option key={page.id} value={page.id}>{page.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!pendingPageId || savingAction}
                      onClick={async () => {
                        const page = messengerStatus.pages.find((p) => p.id === pendingPageId);
                        if (!page) return;
                        setSavingAction(true);
                        try {
                          const result = await invokeApi<{
                            page_id?: string;
                            page_name?: string;
                          }>("messenger/connect-page", { pageId: page.id });
                          if (storeState && user && result.page_id) {
                            await persistState({
                              ...storeState,
                              config: {
                                ...storeState.config,
                                messengerBotId: result.page_id,
                                messengerBotName: result.page_name || page.name,
                              },
                            });
                          }
                          showToast(
                            "Messenger bot is now active on your Page!",
                            "success"
                          );
                          fetchMessengerStatus();
                        } finally {
                          setSavingAction(false);
                        }
                      }}
                      className="w-full px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 text-white rounded-full font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <MessageSquare size={16} />
                      {t("activateMessengerBot")}
                    </button>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 mt-2">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 mb-2 border border-indigo-100">
                      <MessageSquare size={26} />
                    </div>
                    <p className="text-xs text-[#78716C] max-w-sm text-center leading-relaxed font-sans">
                      {t("signInFacebookFirst")}
                    </p>
                    <button
                      type="button"
                      onClick={startFacebookConnect}
                      className="px-6 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <MessageSquare size={16} />
                      {t("connectMessengerBot")}
                    </button>
                  </div>
                )}
              </div>
            )}
          {/* TAB 5 END */}
          </div>
        )}

          {/* CRM DIRECT SUPPORT LIVE WORKSPACE & CHAT TAKE-OVER CRM */}
          {activeTab === "live_support" && (
            <section className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7E5E4] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1C1917] tracking-tight">
                    {t("liveSupportRoomHeader")}
                  </h3>
                </div>

                {/* Selector for active customer chat session */}
                <select
                  value={activeSessionId}
                  onChange={(e) => setActiveSessionId(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#E7E5E4] text-[#1C1917] text-xs rounded-xl p-2.5 focus:outline-none focus:border-[#0069FF]"
                >
                  {(Object.values(storeState.sessions) as TelegramSession[]).map((sess) => (
                    <option key={sess.sessionId} value={sess.sessionId}>
                      {sess.customerName || "Web Simulator"} ({sess.liveTakeoverActive ? "Owner Active" : "AI Powered"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chat list visual layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 text-[#1C1917]">
                
                {/* Session list items sidebar */}
                <div className="md:col-span-1 space-y-2.5 border-r border-[#E7E5E4] pr-4">
                  <span className="text-[11px] font-mono font-semibold text-[#78716C] block tracking-wider uppercase">{t("activeUserSessionsLabel")}</span>
                  {(Object.values(storeState.sessions) as TelegramSession[]).map((sess) => {
                    const isSessActive = sess.sessionId === activeSessionId;
                    const latestMsg = sess.messages[sess.messages.length - 1];

                    return (
                      <div
                        key={sess.sessionId}
                        onClick={() => setActiveSessionId(sess.sessionId)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSessActive
                            ? "bg-[#FAF8F5] border-[#1C1917] text-[#1C1917] shadow-2xs"
                            : "bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#FAF8F5]/60"
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{sess.customerName || "Customer Client"}</span>
                          <span className={`w-2 h-2 rounded-full ${sess.liveTakeoverActive ? "bg-amber-500" : "bg-[#1C1917]"}`}></span>
                        </div>
                        <p className="text-[11px] text-[#78716C] mt-1 truncate">
                          {latestMsg ? latestMsg.content : "No messages recorded"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#E7E5E4]/70 text-[11px] font-mono leading-none">
                          <span className={sess.liveTakeoverActive ? "text-amber-700 font-semibold" : "text-[#1C1917] font-semibold"}>
                            {sess.liveTakeoverActive ? t("supportLabel") : t("aiAutoLabel")}
                          </span>
                          <span className="text-[#78716C]">
                            {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CRM Live Dialogue monitor screen */}
                <div className="md:col-span-2 space-y-4 flex flex-col justify-between min-h-[260px]">
                  
                  <div className="p-4 bg-[#FAF8F5] border border-[#E7E5E4] rounded-2xl space-y-3 max-h-[220px] overflow-y-auto">
                    
                    {activeSession ? (
                      activeSession.messages.map((m, idx) => (
                        <div key={idx} className="text-xs leading-relaxed">
                          <span className={`font-semibold font-mono text-[11px] uppercase tracking-wide ${
                            m.sender === "customer" ? "text-indigo-700" : m.sender === "owner" ? "text-amber-800" : "text-[#78716C]"
                          }`}>
                            {m.sender === "customer" ? "CLIENT" : m.sender === "owner" ? "SALES HUB" : "SYSTEM CANDY"}:
                          </span>
                          <span className="text-[#1C1917] ml-1.5 whitespace-pre-line">{m.content}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#78716C] italic p-4 text-center text-xs font-sans">{t("noMessagesChosen")}</div>
                    )}
                  </div>

                  {/* Direct Owner Intervention replies */}
                  <form onSubmit={handleSendOwnerMessage} className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[#78716C] font-mono">
                      <span>
                        {t("activeModeLabel")} {activeSession?.liveTakeoverActive ? `${t("manualSupportOverrideLabel")}` : `${t("automatedBotActiveLabel")}`}
                      </span>
                      {activeSession?.liveTakeoverActive ? (
                        <button
                          type="button"
                          onClick={() => handleReleaseToAi(activeSession.sessionId)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                        >
                          {t("turnOnAiBotLabel")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTakeover(activeSession.sessionId)}
                          className="text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                        >
                          {t("switchToManualLabel")}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        disabled={!activeSession?.liveTakeoverActive}
                        value={ownerReplyText}
                        onChange={(e) => setOwnerReplyText(e.target.value)}
                        placeholder={activeSession?.liveTakeoverActive ? t("ownerChatInputPlaceholder") : t("takeoverPlaceholder")}
                        className="flex-1 bg-white border border-[#E7E5E4] rounded-full px-4 py-2.5 text-xs text-[#1C1917] disabled:opacity-50 focus:outline-none focus:border-[#0069FF]"
                      />
                      <button
                        type="submit"
                        disabled={!activeSession?.liveTakeoverActive || !ownerReplyText.trim()}
                        className="bg-[#1C1917] hover:bg-stone-850 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-full text-xs cursor-pointer transition-all shrink-0 uppercase active:scale-[0.98] shadow-2xs"
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
