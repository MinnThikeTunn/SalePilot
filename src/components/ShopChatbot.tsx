"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Truck,
  Phone,
  User,
  MapPin,
  CreditCard,
  X,
  ChevronRight,
  ArrowRight,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../utils/supabase";
import { Product, DeliveryZone, Order, OrderItem } from "../types";
import { addOrder } from "../services/clientStore";
import { loadTownships } from "../data/townships";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  orderCard?: Order;
}

type ConvState =
  | "introduction"
  | "intent_classification"
  | "advertise"
  | "show_product"
  | "will_it_buy"
  | "stock_check"
  | "transaction"
  | "terminate_warm"
  | "terminate_notify";

interface UserPrefs {
  likedProducts: string[];
  dislikedProducts: string[];
  pastOrders: string[];
  preferredLanguage: "en" | "my";
  lastVisit: string;
}

interface ShopChatbotProps {
  shopId: string;
  businessName: string;
  phone?: string;
  fullPage?: boolean;
  suggestedPrompts?: string[];
  products?: Product[];
  deliveryZones?: DeliveryZone[];
  onOpenInfo?: () => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

type Language = "en" | "my";

// ─── Bilingual Copy Dictionary ───────────────────────────────────────────────

const COPY: Record<Language, {
  eyebrow: string;
  online: string;
  candyTitle: string;
  candyRole: string;
  greeting: string;
  helper: string;
  placeholder: string;
  send: string;
  thinking: string;
  error: string;
  connectionError: string;
  quickPrompts: string;
  productsTitle: string;
  productsHint: string;
  info: string;
  language: string;
  openChat: string;
  closeChat: string;
  addToCart: string;
  addedToCart: string;
  viewCart: string;
  checkout: string;
  items: string;
  inStock: string;
  soldOut: string;
}> = {
  en: {
    eyebrow: "Artisanal Sales Concierge",
    online: "Online",
    candyTitle: "Candy",
    candyRole: "AI Sales Concierge",
    greeting: "Welcome to our sanctuary. What may I curate for you today?",
    helper: "Ask about handcrafted pieces, township courier rates, and mobile payment, or add items directly to your shopping basket.",
    placeholder: "Inquire with Candy or search curated pieces...",
    send: "Send",
    thinking: "Candy is composing a response...",
    error: "My apologies, I could not complete that request. Please try again.",
    connectionError: "Connection issue detected. Please retry.",
    quickPrompts: "Inquiry Prompts",
    productsTitle: "Featured Pieces",
    productsHint: "Add pieces directly to your order.",
    info: "Shop Details",
    language: "Language",
    openChat: "Open concierge",
    closeChat: "Close concierge",
    addToCart: "Add",
    addedToCart: "Added",
    viewCart: "View Basket",
    checkout: "Checkout",
    items: "items",
    inStock: "in stock",
    soldOut: "Sold out",
  },
  my: {
    eyebrow: "Candy • အရောင်းအကူအညီပေးသူ",
    online: "အဆင်သင့်ရှိပါသည်",
    candyTitle: "Candy",
    candyRole: "AI အရောင်းလက်ထောက်",
    greeting: "ကြိုဆိုပါတယ်ရှင့်။ ဘာများ ကူညီပေးရမလဲရှင့်?",
    helper: "ဆိုင်ရှိပစ္စည်းများ၊ ရန်ကုန်မြို့နယ်အလိုက် ပို့ဆောင်ခနှင့် KPay/Wave ငွေလွှဲအကြောင်း မေးမြန်းနိုင်ပြီး ခြင်းတောင်းထဲသို့ တိုက်ရိုက်ထည့်သွင်းနိုင်ပါတယ်ရှင့်။",
    placeholder: "Candy ကို မေးမြန်းရန် (သို့) ပစ္စည်းရှာရန်...",
    send: "ပို့မည်",
    thinking: "Candy အကြောင်းပြန်ကြားနေပါသည်...",
    error: "တောင်းပန်ပါတယ်ရှင့်၊ တုန့်ပြန်မှုမရရှိပါ။ ထပ်မံကြိုးစားပေးပါရှင့်။",
    connectionError: "လိုင်းအဆင်မပြေဖြစ်နေပါသည်။ ပြန်လည်စမ်းသပ်ကြည့်ပါ။",
    quickPrompts: "အမေးများသော မေးခွန်းများ",
    productsTitle: "ရွေးချယ်ထားသော ပစ္စည်းများ",
    productsHint: "ခြင်းတောင်းထဲသို့ တိုက်ရိုက်ထည့်ဝယ်ယူနိုင်ပါသည်။",
    info: "ဆိုင်အချက်အလက်",
    language: "ဘာသာစကား",
    openChat: "စကားပြောရန်",
    closeChat: "ပိတ်မည်",
    addToCart: "ထည့်မည်",
    addedToCart: "ထည့်ပြီးပါပြီ",
    viewCart: "ခြင်းတောင်းကြည့်မည်",
    checkout: "ငွေရှင်းမည်",
    items: "ခု",
    inStock: "လက်ကျန်ရှိ",
    soldOut: "ပစ္စည်းကုန်",
  },
};

// ─── Memory helpers ───────────────────────────────────────────────────────────

function loadPrefs(shopId: string): UserPrefs {
  try {
    const raw = localStorage.getItem(`shop_prefs_${shopId}`);
    if (raw) return JSON.parse(raw) as UserPrefs;
  } catch {
    // ignore
  }
  return {
    likedProducts: [],
    dislikedProducts: [],
    pastOrders: [],
    preferredLanguage: "en",
    lastVisit: new Date().toISOString(),
  };
}

function savePrefs(shopId: string, prefs: UserPrefs): void {
  try {
    localStorage.setItem(`shop_prefs_${shopId}`, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

// ─── Local Rule-based Responder ──────────────────────────────────────────────

function buildLocalReply(
  text: string,
  products: Product[],
  cart: { productId: string; quantity: number }[],
  state: ConvState,
  businessName: string,
  language: Language
): string {
  const t = text.toLowerCase();
  const isMy = language === "my" || /[\u1000-\u109F]/.test(text);

  // Delivery question
  if (/deliver|shipping|township|ပို့|ပို့ဆောင်|မြို့နယ်/.test(t)) {
    if (isMy) {
      return `ကျွန်မတို့ ${businessName} ဆိုင်တွင် ရန်ကုန်မြို့တွင်း အိမ်ရောက်ငွေချေ (COD) ဖြင့် ပို့ဆောင်ပေးပြီး အခြားမြို့များအတွက် KPay / WavePay ဖြင့် ပို့ဆောင်ပေးပါသည်ရှင့်။ ပို့ဆောင်ခကို မြို့နယ်အလိုက် တွက်ချက်ပေးပါသည်ရှင့်။ [STATE:intent_classification]`;
    }
    return `Our shop ${businessName} provides Cash on Delivery (COD) across Yangon townships and mobile payment (KPay / WavePay) for regional courier dispatch. Shipping fees are calculated by township rate. [STATE:intent_classification]`;
  }

  // Payment question
  if (/pay|payment|kpay|wavepay|cod|prepay|ငွေ|ငွေချေ|လွှဲ/.test(t)) {
    if (isMy) {
      return `ငွေပေးချေမှုအတွက် ရန်ကုန်မြို့တွင်း အိမ်ရောက်ငွေချေ (COD) အပြင် KPay / WavePay မိုဘိုင်းငွေလွှဲဖြင့်လည်း လက်ခံပါသည်ရှင့်။ [STATE:intent_classification]`;
    }
    return `For settlement, we accept Cash on Delivery (COD) within Yangon as well as direct KPay and WavePay mobile transfers. [STATE:intent_classification]`;
  }

  // Add to cart or buy intent
  if (/add|buy|pack|order|ဝယ်|ယူ|ထည့်/.test(t)) {
    for (const p of products) {
      const pFirst = p.name.toLowerCase().split(" ")[0];
      if (t.includes(pFirst) || t.includes(p.name.toLowerCase()) || t.includes(p.id.toLowerCase())) {
        if (isMy) {
          return `✅ "${p.name}" ကို ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီရှင့်! ဈေးနှုန်း: ${p.price.toLocaleString()} MMK ဖြစ်ပါသည်ရှင့်။ အော်ဒါတင်ရန် အောက်ပါ "ငွေရှင်းမည်" ကို နှိပ်နိုင်ပါသည်ရှင့်။ [ACTION:ADD, ID:${p.id}][STATE:will_it_buy]`;
        }
        return `✅ Added "${p.name}" to your basket! Price: ${p.price.toLocaleString()} MMK. Click Checkout below whenever you are ready! [ACTION:ADD, ID:${p.id}][STATE:will_it_buy]`;
      }
    }
  }

  // Checkout intent
  if (/checkout|cart|ငွေရှင်း|ခြင်းတောင်း/.test(t)) {
    if (cart.length === 0) {
      if (isMy) {
        return `မည်သည့်ပစ္စည်းကို မှာယူလိုပါသလဲရှင့်? Candy ကူညီရှာဖွေပေးပါမည်။ [STATE:show_product]`;
      }
      return `Which curated piece would you like to order? I am delighted to help you find it. [STATE:show_product]`;
    }
    if (isMy) {
      return `ခြင်းတောင်းထဲရှိ ပစ္စည်းများကို အော်ဒါတင်ရန် အသင့်ဖြစ်ပါပြီရှင့်။ ပို့ဆောင်မည့်လိပ်စာ ဖြည့်သွင်းရန် အောက်ပါ "ငွေရှင်းမည်" ခလုတ်ကို နှိပ်ပါရှင့်။ [ACTION:CHECKOUT][STATE:transaction]`;
    }
    return `Your order is ready for checkout! Click the Checkout button below to provide your delivery township and address. [ACTION:CHECKOUT][STATE:transaction]`;
  }

  // Product name match
  for (const p of products) {
    if (t.includes(p.name.toLowerCase().split(" ")[0])) {
      if (isMy) {
        const stockNote = p.stock > 0 ? `လက်ကျန် ${p.stock} ခု ရှိပါသည်ရှင့်။` : `လောလောဆယ် ပစ္စည်းကုန်နေပါသည်ရှင့်။ [STATE:terminate_notify]`;
        return `"${p.name}" — ${p.price.toLocaleString()} MMK။ ${p.description || ""} ${stockNote} ခြင်းတောင်းထဲသို့ ထည့်သွင်းလိုပါသလားရှင့်? [STATE:will_it_buy][PREF:LIKE, ID:${p.id}]`;
      }
      const stockNote = p.stock > 0 ? `In stock (${p.stock} units available).` : `Currently sold out. [STATE:terminate_notify]`;
      return `"${p.name}" — ${p.price.toLocaleString()} MMK. ${p.description || ""} ${stockNote} Would you like to add it to your basket? [STATE:will_it_buy][PREF:LIKE, ID:${p.id}]`;
    }
  }

  // Greeting
  if (state === "introduction" || /hello|hi|hey|good morning|good afternoon|မင်္ဂလာပါ/.test(t)) {
    const highlights = products.slice(0, 2).map((p) => `${p.name} (${p.price.toLocaleString()} MMK)`).join(", ");
    if (isMy) {
      return `မင်္ဂလာပါရှင့်! ${businessName} မှ နွေးထွေးစွာ ကြိုဆိုပါတယ်ရှင့်။ ${highlights ? `ယနေ့ မိတ်ဆက်ပစ္စည်းများမှာ ${highlights} ဖြစ်ပါသည်ရှင့်။` : ""} ဘာများ ကူညီပေးရမလဲရှင့်? [STATE:intent_classification]`;
    }
    return `Hello and welcome to ${businessName}. ${highlights ? `Today's featured pieces are: ${highlights}.` : ""} How may I assist your inquiry today? [STATE:intent_classification]`;
  }

  // Browse catalog
  if (/product|catalog|show|list|menu|ပစ္စည်း|စာရင်း/.test(t)) {
    const list = products.map((p) => `• ${p.name} — ${p.price.toLocaleString()} MMK`).join("\n");
    if (isMy) {
      return `လက်ရှိရရှိနိုင်သော ပစ္စည်းစာရင်းများဖြစ်ပါသည်ရှင့်:\n${list}\n\nမည်သည့်ပစ္စည်းကို စိတ်ဝင်စားပါသလဲရှင့်? [STATE:show_product]`;
    }
    return `Here is our current catalog of curated pieces:\n${list}\n\nWhich piece would you like to explore? [STATE:show_product]`;
  }

  if (isMy) {
    return `ကျွန်မ ${businessName} ၏ အရောင်းလက်ထောက် Candy ဖြစ်ပါသည်ရှင့်။ ဆိုင်ရှိပစ္စည်းများအကြောင်း မေးမြန်းနိုင်ပြီး "ထည့်မည်" ခလုတ်ဖြင့်လည်း တိုက်ရိုက်မှာယူနိုင်ပါသည်ရှင့်! [STATE:intent_classification]`;
  }
  return `I am Candy from ${businessName}. Feel free to ask about our curated collection or click "Add" to order directly! [STATE:intent_classification]`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShopChatbot({
  shopId,
  businessName,
  phone,
  fullPage = false,
  suggestedPrompts = [],
  products = [],
  deliveryZones = [],
  onOpenInfo,
  language: propLang,
  onLanguageChange,
}: ShopChatbotProps) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [internalLang, setInternalLang] = useState<Language>("en");
  const language = propLang ?? internalLang;
  const setLanguage = (updater: Language | ((prev: Language) => Language)) => {
    const next = typeof updater === "function" ? updater(language) : updater;
    if (onLanguageChange) {
      onLanguageChange(next);
    }
    setInternalLang(next);
  };
  const [composerExpanded, setComposerExpanded] = useState(false);

  // Conversation state machine
  const [convState, setConvState] = useState<ConvState>("introduction");
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadPrefs(shopId));

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedTownship, setSelectedTownship] = useState("Kamayut");
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "prepay">("cod");
  const [prepayTransactionId, setPrepayTransactionId] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const allTownships = useMemo(() => {
    try {
      const list = loadTownships();
      return Array.from(new Set(list));
    } catch {
      return ["Kamayut", "Hlaing", "Sanchaung", "Bahan", "Yankin"];
    }
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = messages.length > 0;
  const copy = COPY[language];

  const featuredProducts = useMemo(() => (products || []).slice(0, 10), [products]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const p = (products || []).find((prod) => prod.id === item.productId);
        return sum + (p ? (Number(p.price) || 0) * item.quantity : 0);
      }, 0),
    [cart, products]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Calculate delivery fee dynamically based on selected township
  const deliveryFee = useMemo(() => {
    if (!selectedTownship) return 2000;
    const match = (deliveryZones || []).find(
      (z) =>
        (z?.township_name || (z as any)?.township || "").toLowerCase() ===
        selectedTownship.toLowerCase()
    );
    return match ? (Number(match.rate) || 2000) : 2000;
  }, [selectedTownship, deliveryZones]);

  // Session ID initialization
  useEffect(() => {
    if (!sessionId) {
      try {
        const stored = localStorage.getItem(`shop_session_${shopId}`);
        if (stored) {
          setSessionId(stored);
        } else {
          const id = `pub_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem(`shop_session_${shopId}`, id);
          setSessionId(id);
        }
      } catch {
        setSessionId(`pub_${Math.random().toString(36).substring(2, 11)}`);
      }
    }
  }, [shopId, sessionId]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, loading]);

  // Persist prefs
  useEffect(() => {
    savePrefs(shopId, prefs);
  }, [shopId, prefs]);

  // Cart operations
  function handleAddToCart(product: Product) {
    setCart((curr) => {
      const existing = curr.find((c) => c.productId === product.id);
      if (existing) {
        return curr.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...curr, { productId: product.id, quantity: 1 }];
    });

    // Provide friendly bot feedback in conversation
    const confirmMsg = `🛒 Added "${product.name}" to cart! (${product.price.toLocaleString()} MMK)`;

    setMessages((curr) => [
      ...curr,
      { role: "assistant", content: confirmMsg },
    ]);
  }

  function handleUpdateQuantity(productId: string, delta: number) {
    setCart((curr) => {
      return curr
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { productId: string; quantity: number }[];
    });
  }

  function handleRemoveFromCart(productId: string) {
    setCart((curr) => curr.filter((c) => c.productId !== productId));
  }

  // Parse action tags
  function applyTags(
    botText: string,
    currentPrefs: UserPrefs
  ): { cleanText: string; newPrefs: UserPrefs } {
    let newPrefs = { ...currentPrefs };

    const stateMatch = botText.match(/\[STATE:([a-z_]+)\]/);
    if (stateMatch) {
      setConvState(stateMatch[1] as ConvState);
    }

    const addMatch = botText.match(/\[ACTION:ADD, ID:([^\]]+)\]/);
    if (addMatch) {
      const prodId = addMatch[1].trim();
      setCart((curr) => {
        const existing = curr.find((c) => c.productId === prodId);
        if (existing) {
          return curr.map((c) =>
            c.productId === prodId ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [...curr, { productId: prodId, quantity: 1 }];
      });
    }

    const checkoutMatch = botText.match(/\[ACTION:CHECKOUT\]/);
    if (checkoutMatch) {
      setIsCheckoutOpen(true);
    }

    const cleanText = botText
      .replace(/\[STATE:[a-z_]+\]/g, "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/\[PREF:[^\]]+\]/g, "")
      .trim();

    return { cleanText, newPrefs };
  }

  // Send message handler
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setComposerExpanded(false);
    if (composerInputRef.current) composerInputRef.current.style.height = "44px";

    if (convState === "introduction") setConvState("intent_classification");

    setMessages((curr) => [...curr, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      // 1. Direct Gemini API if key is present
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== "undefined" && apiKey !== "") {
        try {
          const productList = products
            .map((p) => `- ${p.name} (Price: ${p.price} MMK, Stock: ${p.stock}): ${p.description}`)
            .join("\n");

          const candidateModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
          let botText: string | null = null;

          for (const model of candidateModels) {
            try {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          {
                            text: `You are "Candy", an artisanal, warm, and attentive AI sales concierge for ${businessName}.
Customer Language Preference: ${language === "my" ? "Burmese (Myanmar Unicode)" : "English"}.
Language instruction: ${
  language === "my" || /[\u1000-\u109F]/.test(trimmed)
    ? "Respond warmly, politely, and respectfully in natural Burmese (Myanmar Unicode script)."
    : "Respond in welcoming, polite, and refined English."
}

Available Products in Catalog:
${productList}

Customer Message: ${trimmed}
Candy:`,
                          },
                        ],
                      },
                    ],
                  }),
                }
              );

              if (response.ok) {
                const resData = await response.json();
                botText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (botText) break;
              } else {
                const errData = await response.json().catch(() => ({}));
                console.warn(`[Gemini ${model}] error:`, errData);
              }
            } catch (err) {
              console.warn(`[Gemini ${model}] fetch error:`, err);
            }
          }

          if (botText) {
            const { cleanText, newPrefs } = applyTags(botText, prefs);
            setPrefs(newPrefs);
            setMessages((curr) => [...curr, { role: "assistant", content: cleanText }]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Gemini call failed, using local engine:", err);
        }
      }

      // 2. High-speed local rule-based responder (zero lag, Burmese & English)
      const localReply = buildLocalReply(trimmed, products, cart, convState, businessName, language);
      const { cleanText, newPrefs } = applyTags(localReply, prefs);
      setPrefs(newPrefs);
      setMessages((curr) => [...curr, { role: "assistant", content: cleanText }]);
    } catch {
      setMessages((curr) => [
        ...curr,
        { role: "assistant", content: copy.error },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Handle Order Placement
  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide your name and phone number");
      return;
    }

    setOrderSubmitting(true);
    const orderItems: OrderItem[] = cart.map((c) => {
      const p = products.find((prod) => prod.id === c.productId);
      return {
        productId: c.productId,
        productName: p?.name || "Product",
        price: p?.price || 0,
        quantity: c.quantity,
      };
    });

    const subtotal = cartTotal;
    const totalAmount = subtotal + deliveryFee;
    const invoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerTelegramId: sessionId || `web_${Date.now()}`,
      township: selectedTownship,
      addressDetails: addressDetails.trim() || `${selectedTownship}, Yangon`,
      deliveryFee,
      paymentMethod,
      totalAmount,
      status: paymentMethod === "prepay" ? "verifying" : "confirmed",
      items: orderItems,
      paymentDetails:
        paymentMethod === "prepay"
          ? {
              method: "KPay",
              transactionId: prepayTransactionId.trim() || `KP-${Date.now().toString().slice(-6)}`,
            }
          : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Record in local client store so merchant dashboard updates immediately
      addOrder(newOrder);

      // 2. Try recording in Supabase database if available
      try {
        await supabase.from("orders").insert({
          id: newOrder.id,
          invoice_id: newOrder.invoiceId,
          shop_id: shopId,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customer_telegram_id: newOrder.customerTelegramId,
          township: newOrder.township,
          address_details: newOrder.addressDetails,
          delivery_fee: newOrder.deliveryFee,
          payment_method: newOrder.paymentMethod,
          total_amount: newOrder.totalAmount,
          status: newOrder.status,
          items: newOrder.items,
          payment_details: newOrder.paymentDetails,
        });
      } catch {
        // Non-fatal if Supabase table is not yet created
      }

      // 3. Clear cart & show success
      setCart([]);
      setIsCheckoutOpen(false);
      setOrderSuccess(newOrder);

      // 4. Send confirmation message in chatbot
      const orderConfirmedText = `🎉 Order placed successfully!\nInvoice ID: ${invoiceId}\nTotal: ${totalAmount.toLocaleString()} MMK\nTownship: ${selectedTownship}\nThe shop owner will verify and dispatch your order shortly. Thank you!`;

      setMessages((curr) => [
        ...curr,
        {
          role: "assistant",
          content: orderConfirmedText,
          orderCard: newOrder,
        },
      ]);
    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  function resizeComposerInput(textarea: HTMLTextAreaElement) {
    textarea.style.height = "44px";
    const next = Math.min(Math.max(textarea.scrollHeight, 44), 144);
    textarea.style.height = `${next}px`;
    setComposerExpanded(next > 52);
  }

  // ── JSX Elements ────────────────────────────────────────────────────────────

  const languageToggle = (
    <button
      type="button"
      onClick={() => setLanguage((prev) => (prev === "en" ? "my" : "en"))}
      className="rounded-full border border-[#E7E5E4] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#1C1917] hover:border-[#0069FF]/40 hover:bg-[#EFF6FF]/50 cursor-pointer shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
      title="Toggle Language / ဘာသာစကားပြောင်းရန်"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#0069FF]" />
      <span>{language === "en" ? "EN" : "မြန်မာ"}</span>
    </button>
  );

  const productCards = (
    <div className="w-full max-w-full">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-serif font-medium text-[#1C1917]">{copy.productsTitle}</p>
          <p className="text-xs text-[#78716C]">{copy.productsHint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#FAF8F5] border border-[#E7E5E4] px-2.5 py-0.5 text-xs font-mono font-medium text-[#57534E]">
          {products.length} {copy.items}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar">
        {featuredProducts.map((product) => (
          <div
            key={product.id}
            className="w-60 shrink-0 rounded-2xl border border-[#E7E5E4] bg-[#FFFFFF] p-3.5 shadow-2xs hover:border-stone-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div
                onClick={() => void sendMessage(`Tell me about ${product.name}`)}
                className="h-32 overflow-hidden rounded-xl bg-[#F3EFEA] cursor-pointer flex items-center justify-center relative group"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <span className="text-xs text-[#78716C] font-sans px-2 text-center font-medium">{product.name}</span>
                )}
                {product.stock > 0 ? (
                  <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-50/95 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    {product.stock} {copy.inStock}
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-mono font-semibold bg-rose-50/95 text-rose-800 border border-rose-200/80 shadow-2xs">
                    {copy.soldOut}
                  </span>
                )}
              </div>
              <p
                onClick={() => void sendMessage(`Tell me about ${product.name}`)}
                className="mt-2.5 line-clamp-1 text-sm font-sans font-semibold text-[#1C1917] cursor-pointer hover:underline tracking-tight"
              >
                {product.name}
              </p>
              <p className="mt-1 line-clamp-2 min-h-[32px] text-xs text-[#78716C] leading-relaxed">
                {product.description || "Authentic quality, sustainably crafted."}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E7E5E4]/80 flex items-center justify-between gap-2">
              <span className="text-sm font-mono font-semibold text-[#1C1917]">
                {(Number(product.price) || 0).toLocaleString()} <span className="text-xs text-[#78716C] font-mono">MMK</span>
              </span>
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                className="bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0 active:scale-[0.98]"
              >
                <Plus size={13} />
                <span>{copy.addToCart}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const promptBar = suggestedPrompts.length > 0 && (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-1">
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendMessage(prompt)}
            className="shrink-0 rounded-full border border-[#E7E5E4] bg-[#FFFFFF] px-3.5 py-1.5 text-xs text-[#57534E] shadow-2xs hover:border-[#0069FF] hover:text-[#0069FF] hover:bg-[#EFF6FF] transition-all cursor-pointer active:scale-[0.98]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  const composer = (
    <div
      className={`mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto] rounded-2xl border border-[#E7E5E4] bg-[#FFFFFF] py-1.5 pl-4 pr-2 shadow-xs transition-colors focus-within:border-[#0069FF] ${
        composerExpanded ? "gap-x-2 gap-y-1" : "items-end gap-2"
      }`}
    >
      <textarea
        ref={composerInputRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          resizeComposerInput(e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage(input);
          }
        }}
        placeholder={copy.placeholder}
        rows={1}
        className="col-start-1 h-11 max-h-36 min-h-11 resize-none overflow-y-auto bg-transparent py-2.5 text-sm leading-relaxed text-[#1C1917] outline-none placeholder:text-[#78716C]"
      />
      <button
        type="button"
        onClick={() => void sendMessage(input)}
        disabled={!input.trim() || loading}
        className="col-start-2 mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0069FF] hover:bg-[#0052CC] text-white transition-all disabled:opacity-40 cursor-pointer shadow-xs active:scale-[0.95]"
        aria-label={copy.send}
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );

  const chatShell = (
    <div className="flex h-full min-h-0 flex-col bg-[#FFFFFF] text-[#1C1917] relative font-sans">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E7E5E4] px-4 py-3 sm:px-6 bg-[#FAF8F5] z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onOpenInfo && (
              <button
                type="button"
                onClick={onOpenInfo}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#57534E] shadow-2xs hover:bg-stone-50 lg:hidden cursor-pointer"
                aria-label="Toggle shop information"
              >
                <span className="flex flex-col gap-1" aria-hidden="true">
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                </span>
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#0069FF]/30 text-[#0069FF] flex items-center justify-center shadow-xs shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5">
                <h2 className="truncate text-base sm:text-lg font-serif font-medium text-[#1C1917] tracking-tight">{businessName}</h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#ECFDF5] text-[#047857] border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {copy.online}
                </span>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">{copy.candyTitle} • {copy.candyRole}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="flex items-center gap-1.5 bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-4 py-1.5 rounded-full cursor-pointer shadow-xs transition-all uppercase tracking-wider active:scale-[0.98]"
              >
                <ShoppingCart size={13} className="text-amber-200" />
                <span>{cartItemCount}</span>
              </button>
            )}
            {languageToggle}
          </div>
        </div>
      </div>

      {/* Chat Messages and Product Stream */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 scroll-smooth overflow-y-auto bg-[#FAF8F5] px-4 py-6 sm:px-6 no-scrollbar space-y-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {/* Always display Greeting + Featured Products on welcome */}
          {!hasStarted && (
            <div className="space-y-6">
              <div className="text-center pt-3 pb-1">
                <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#1C1917] tracking-tight">
                  {copy.greeting}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
                  {copy.helper}
                </p>
              </div>

              {/* Product catalog visible immediately */}
              {productCards}
            </div>
          )}

          {/* Message Thread */}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-3">
              <div className={`flex items-start gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#0069FF]/30 text-[#0069FF] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[92%] sm:max-w-[80%] px-4.5 py-3 text-sm leading-relaxed shadow-2xs ${
                    message.role === "user"
                      ? "rounded-2xl rounded-tr-xs bg-[#1C1917] text-white font-sans"
                      : "rounded-2xl rounded-tl-xs border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] font-sans"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>

                  {/* Order Card if present in assistant message */}
                  {message.orderCard && (
                    <div className="mt-3 p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E7E5E4] text-[#1C1917] space-y-2">
                      <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-2">
                        <span className="font-mono text-xs font-semibold text-[#0069FF]">
                          {message.orderCard.invoiceId}
                        </span>
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857]">
                          {message.orderCard.status}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><span className="text-[#78716C]">Customer:</span> {message.orderCard.customerName} ({message.orderCard.customerPhone})</div>
                        <div><span className="text-[#78716C]">Township:</span> {message.orderCard.township}</div>
                        <div><span className="text-[#78716C]">Total:</span> <span className="font-bold text-[#1C1917] font-mono">{message.orderCard.totalAmount.toLocaleString()} MMK</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optionally show product cards stream */}
              {message.role === "assistant" && (message.content.includes("products") || message.content.includes("available") || message.content.includes("ပစ္စည်း")) && productCards}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#0069FF]/30 text-[#0069FF] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} />
              </div>
              <div className="rounded-2xl border border-[#E7E5E4] bg-[#FFFFFF] px-4 py-2.5 text-xs text-[#78716C] shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0069FF] animate-ping" />
                <span>{copy.thinking}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Checkout Bar when items in cart */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="px-4 pb-2 z-20">
          <div className="mx-auto max-w-3xl bg-[#1C1917] text-[#FAF8F5] px-4 py-2.5 rounded-full shadow-md flex items-center justify-between gap-3 border border-stone-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#FFFFFF]/10 text-stone-200 flex items-center justify-center shrink-0">
                <ShoppingCart size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium">
                  {cartItemCount} {copy.items} • <span className="text-[#EFF6FF] font-mono font-bold">{(Number(cartTotal) || 0).toLocaleString()} MMK</span>
                </p>
                <p className="text-[11px] text-stone-400">Ready for checkout</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs uppercase tracking-wider px-5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <span>{copy.checkout}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Composer Area */}
      <div className="shrink-0 border-t border-[#E7E5E4] bg-[#FAF8F5] px-4 py-3 sm:px-6 z-10 space-y-2">
        {promptBar}
        {composer}
      </div>

      {/* ─── CHECKOUT MODAL ─────────────────────────────────────────────────── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1C1917]/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl border border-[#E7E5E4] max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold shrink-0">
                  <ShoppingCart size={15} />
                </div>
                <div>
                  <h3 className="font-serif font-medium text-base text-[#1C1917]">
                    Checkout & Delivery
                  </h3>
                  <p className="text-[11px] text-[#78716C]">{businessName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E7E5E4] bg-[#FFFFFF] text-[#57534E] flex items-center justify-center hover:bg-stone-50 transition cursor-pointer shadow-2xs"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              {/* Cart Items Review */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#57534E] uppercase tracking-wider">
                  Basket Items
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {cart.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    if (!prod) return null;
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5]"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-sans font-semibold text-[#1C1917] truncate">{prod.name}</p>
                          <p className="text-xs text-[#78716C] font-mono">
                            {(Number(prod.price) || 0).toLocaleString()} MMK × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-[#E7E5E4] rounded-lg bg-[#FFFFFF] overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, -1)}
                              className="px-2 py-1 text-[#57534E] hover:bg-stone-50 cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-bold font-mono">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, 1)}
                              className="px-2 py-1 text-[#57534E] hover:bg-stone-50 cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-[#78716C] hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-full transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Details Form */}
              <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#57534E] block mb-1 uppercase tracking-wider">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#57534E] block mb-1 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="09971234567"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Township & Delivery Fee */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#57534E] block uppercase tracking-wider">
                      Township (Yangon & Regional) *
                    </label>
                    <span className="text-xs font-mono font-semibold text-[#0069FF]">
                      +{deliveryFee.toLocaleString()} MMK
                    </span>
                  </div>
                  <select
                    value={selectedTownship}
                    onChange={(e) => setSelectedTownship(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                  >
                    {allTownships.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] block mb-1 uppercase tracking-wider">
                    Street / Building / Room Address
                  </label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Street name, Building number, Ward"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] block mb-1.5 uppercase tracking-wider">
                    Settlement Method
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        paymentMethod === "cod"
                          ? "border-[#0069FF] bg-[#EFF6FF] text-[#1C1917]"
                          : "border-[#E7E5E4] bg-[#FFFFFF] text-[#57534E] hover:border-stone-400"
                      }`}
                    >
                      <p className="text-xs font-semibold font-sans text-[#1C1917]">Cash on Delivery</p>
                      <p className="text-[11px] text-[#78716C] mt-0.5">Pay upon delivery (COD)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("prepay")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        paymentMethod === "prepay"
                          ? "border-[#0069FF] bg-[#EFF6FF] text-[#1C1917]"
                          : "border-[#E7E5E4] bg-[#FFFFFF] text-[#57534E] hover:border-stone-400"
                      }`}
                    >
                      <p className="text-xs font-semibold font-sans text-[#1C1917]">KPay / WavePay</p>
                      <p className="text-[11px] text-[#78716C] mt-0.5">Mobile wallet transfer</p>
                    </button>
                  </div>

                  {paymentMethod === "prepay" && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-xs space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">
                        Merchant Wallet Account
                      </p>
                      <p className="text-xs font-mono font-semibold text-[#1C1917]">{phone ? `${phone} (KPay / WavePay)` : "09971234567 (KPay / WavePay)"}</p>
                      <input
                        type="text"
                        value={prepayTransactionId}
                        onChange={(e) => setPrepayTransactionId(e.target.value)}
                        placeholder="Transaction ID / Slip reference"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:outline-none mt-1"
                      />
                    </div>
                  )}
                </div>
              </form>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#57534E]">
                  <span>Subtotal:</span>
                  <span>{(Number(cartTotal) || 0).toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between text-[#57534E]">
                  <span>Shipping ({selectedTownship}):</span>
                  <span>{(Number(deliveryFee) || 0).toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1C1917] text-sm pt-2 border-t border-[#E7E5E4]">
                  <span>Grand Total:</span>
                  <span className="text-[#0069FF] font-bold">{((Number(cartTotal) || 0) + (Number(deliveryFee) || 0)).toLocaleString()} MMK</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-[#E7E5E4] bg-[#FAF8F5] flex gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-[#E7E5E4] bg-[#FFFFFF] font-semibold text-xs text-[#57534E] hover:bg-stone-50 cursor-pointer transition-all active:scale-[0.98] uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="checkout-form"
                disabled={orderSubmitting}
                className="flex-2 py-2.5 rounded-full bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs uppercase tracking-wider shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                {orderSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ORDER SUCCESS CONFIRMATION MODAL ─────────────────────────────────── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-4 border border-[#E7E5E4] animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle size={30} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#047857]">
                Order Confirmed
              </span>
              <h3 className="text-2xl font-serif text-[#1C1917] mt-1">
                Thank You
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                The merchant has received your order and will dispatch shortly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E7E5E4] text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[#E7E5E4] pb-2">
                <span className="text-[#78716C]">Invoice:</span>
                <span className="font-bold text-[#0069FF]">{orderSuccess.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Customer:</span>
                <span className="font-bold text-[#1C1917]">{orderSuccess.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Phone:</span>
                <span>{orderSuccess.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Township:</span>
                <span>{orderSuccess.township}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Payment:</span>
                <span className="uppercase">{orderSuccess.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-[#E7E5E4] pt-2 font-bold text-[#1C1917] text-sm">
                <span>Total Amount:</span>
                <span className="text-[#0069FF]">{(Number(orderSuccess.totalAmount) || 0).toLocaleString()} MMK</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOrderSuccess(null)}
              className="w-full py-3 rounded-full bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs uppercase tracking-wider shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (fullPage) return chatShell;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0069FF] hover:bg-[#0052CC] text-sm font-medium text-white shadow-md transition cursor-pointer"
        aria-label={open ? copy.closeChat : copy.openChat}
      >
        {open ? <X size={20} /> : <ShoppingCart size={20} />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[min(650px,calc(100dvh-8rem))] w-[min(400px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-[#E7E5E4] bg-[#FFFFFF] shadow-xl">
          {chatShell}
        </div>
      )}
    </>
  );
}