"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  CreditCard,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "../utils/supabase";
import { Product, DeliveryZone, Order, OrderItem } from "../types";
import { addOrder, clearSessionCart, getState } from "../services/clientStore";
import { getShopState, saveShopState } from "../services/shopState";
import { cleanNormalText } from "../utils/textUtils";

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
  preferredLanguage: "en";
  lastVisit: string;
}

interface ShopChatbotProps {
  shopId: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  businessCategory?: string;
  paymentInfo?: string;
  deliveryInfo?: string;
  fullPage?: boolean;
  suggestedPrompts?: string[];
  products?: Product[];
  deliveryZones?: DeliveryZone[];
  onOpenInfo?: () => void;
  language?: "en";
  onLanguageChange?: (lang: "en") => void;
}

// ─── Copy Dictionary ──────────────────────────────────────────────────────────

const COPY = {
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
  deliveryZones?: DeliveryZone[],
  paymentInfo?: string,
  deliveryInfo?: string,
  phone?: string,
  address?: string,
  ownerName?: string,
  businessCategory?: string
): string {
  const t = text.toLowerCase();

  // 1. Delivery question - check specific township first
  if (deliveryZones && deliveryZones.length > 0) {
    const matchedZone = deliveryZones.find((z) => {
      const name = (z.township_name || (z as any).township || "").toLowerCase().trim();
      return name && name.length >= 3 && t.includes(name);
    });

    if (matchedZone) {
      const name = matchedZone.township_name || (matchedZone as any).township;
      const rate = (Number(matchedZone.rate) || 0).toLocaleString();
      const timeline = matchedZone.estimated_transit_timeline ? ` (${matchedZone.estimated_transit_timeline})` : "";
      return `Delivery to ${name} is ${rate} MMK${timeline}. Would you like to proceed with your order? [STATE:intent_classification]`;
    }
  }

  // General delivery & courier schedule
  if (/deliver|shipping|township|courier|transit|rate|fee|send|cost/.test(t)) {
    if (deliveryZones && deliveryZones.length > 0) {
      const list = deliveryZones
        .map((z) => `${z.township_name || (z as any).township || ""}: ${(Number(z.rate) || 0).toLocaleString()} MMK${z.estimated_transit_timeline ? ` (${z.estimated_transit_timeline})` : ""}`)
        .filter(Boolean)
        .join(" • ");
      return `Delivery rates for ${businessName}:\n${list}${deliveryInfo ? `\nDispatch Policy: ${deliveryInfo}` : ""} [STATE:intent_classification]`;
    } else if (deliveryInfo) {
      return `Delivery information for ${businessName}: ${deliveryInfo} [STATE:intent_classification]`;
    } else {
      return `Delivery arrangements for ${businessName} will be confirmed upon order. Please inquire directly with the store. [STATE:intent_classification]`;
    }
  }

  // 2. Payment options & mobile wallet accounts
  if (/pay|payment|kpay|kbzpay|wave|wavepay|cod|prepay|cash|banking|account|transfer|qr/.test(t)) {
    const payMethods = paymentInfo || "Cash on Delivery (COD) and Mobile Wallets (KBZPay / WavePay)";
    const phoneNote = phone ? ` For KBZPay or WavePay remittances, our shop account number is: ${phone}.` : "";
    return `Payment options for ${businessName}: ${payMethods}.${phoneNote} You can select your preferred payment method during checkout! [STATE:intent_classification]`;
  }

  // 3. Contact & Phone hotline
  if (/phone|contact|call|number|reach|support|hotline/.test(t)) {
    if (phone) {
      return `You can reach ${businessName} directly at ${phone}. Our team is always delighted to assist you! [STATE:intent_classification]`;
    } else {
      return `You can message us directly here in the chat, or complete your order at checkout and our concierge team will reach out to you. [STATE:intent_classification]`;
    }
  }

  // 4. Store Address & Physical Location
  if (/address|location|where|located|store address|shop address|visit|pickup/.test(t)) {
    if (address) {
      return `${businessName} is located at: ${address}. Orders can also be dispatched across our delivery townships directly to your doorstep! [STATE:intent_classification]`;
    } else {
      return `${businessName} operates as an online boutique sanctuary with direct courier delivery across all serviced townships. [STATE:intent_classification]`;
    }
  }

  // 5. About Us / Boutique Story
  if (/about|who are you|story|brand|what do you sell/.test(t)) {
    const catNote = businessCategory ? ` specializing in ${businessCategory}` : "";
    const founderNote = ownerName ? ` Founded by ${ownerName}.` : "";
    return `${businessName} is a curated boutique${catNote}.${founderNote} How may I curate a piece for you today? [STATE:intent_classification]`;
  }

  // 6. How to order guide
  if (/how to order|how to buy|order guide/.test(t)) {
    return `To place an order: 1. Click "Add to Bag" on any featured piece or ask me to add it. 2. Tap "Bag" or "Checkout" to select your township and payment method. 3. Confirm your order! [STATE:intent_classification]`;
  }

  // Order confirmed status inquiries
  if (/order (is )?confirmed|confirm order|order status|track order|my order|order receipt|placed order/i.test(t)) {
    return `Your order has been received and confirmed! Our team will dispatch your package shortly. Your shopping cart has been cleared. Feel free to explore other pieces in our catalog. [STATE:intent_classification]`;
  }

  // Add to cart or buy intent (requires explicit purchase/add intent)
  if (/(add to (cart|bag|basket)|add .* to|buy |want to order|want to buy|purchase)/i.test(t)) {
    for (const p of products) {
      const pFirst = p.name.toLowerCase().split(" ")[0];
      if (t.includes(p.name.toLowerCase()) || (pFirst.length >= 3 && t.includes(pFirst)) || t.includes(p.id.toLowerCase())) {
        return `✅ Added "${p.name}" to your basket! Price: ${p.price.toLocaleString()} MMK. Click Checkout below whenever you are ready! [ACTION:ADD, ID:${p.id}][STATE:will_it_buy]`;
      }
    }
  }

  // Checkout and cart intent
  if (/checkout|cart|basket/i.test(t)) {
    if (cart.length === 0) {
      return `Your shopping basket is currently empty (0 items). Which curated piece would you like to explore or order today? [STATE:show_product]`;
    }
    return `Your order is ready for checkout! Click the Checkout button below to provide your delivery township and address. [ACTION:CHECKOUT][STATE:transaction]`;
  }

  // Product name match
  for (const p of products) {
    const pLower = p.name.toLowerCase().trim();
    const words = pLower.split(/\s+/).filter((w) => w.length >= 3);
    const matches = t.includes(pLower) || words.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "i").test(t));
    if (matches) {
      const stockNote = p.stock > 0 ? `In stock (${p.stock} units available).` : `Currently sold out. [STATE:terminate_notify]`;
      return `${p.name} — ${p.price.toLocaleString()} MMK. ${p.description ? `${p.description} ` : ""}${stockNote} Would you like to add it to your basket? [STATE:will_it_buy][PREF:LIKE, ID:${p.id}]`;
    }
  }

  // Greeting
  if (state === "introduction" || /hello|hi|hey|good morning|good afternoon/.test(t)) {
    const highlights = products.slice(0, 2).map((p) => `${p.name} (${p.price.toLocaleString()} MMK)`).join(", ");
    return `Hello and welcome to ${businessName}. ${highlights ? `Today's featured pieces are: ${highlights}.` : ""} How may I assist your inquiry today? [STATE:intent_classification]`;
  }

  // Browse catalog
  if (/product|catalog|show|list|menu/.test(t)) {
    if (products.length === 0) {
      return `Our catalog will appear here once published. Please ask about any specific pieces! [STATE:show_product]`;
    }
    const list = products.map((p) => `• ${p.name} — ${p.price.toLocaleString()} MMK`).join("\n");
    return `Here is our current catalog of curated pieces:\n${list}\n\nWhich piece would you like to explore? [STATE:show_product]`;
  }

  return `I am Candy from ${businessName}. Feel free to ask about our curated collection or click "Add" to order directly! [STATE:intent_classification]`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShopChatbot({
  shopId,
  businessName,
  ownerName,
  phone,
  address,
  businessCategory,
  paymentInfo = "",
  deliveryInfo = "",
  fullPage = false,
  suggestedPrompts = [],
  products = [],
  deliveryZones = [],
  onOpenInfo,
}: ShopChatbotProps) {
  const local = getState();
  const effectiveBusinessName = businessName || local.config.shopName || "Official Store";
  const effectivePhone = phone || local.config.phone || (local as any).onboardingProfile?.phone || "";
  const effectiveAddress = address || (local as any).onboardingProfile?.business_address || "";
  const effectiveOwner = ownerName || local.config.ownerName || (local as any).onboardingProfile?.owner_name || "";
  const effectiveCategory = businessCategory || (local as any).onboardingProfile?.business_category || (local as any).onboardingProfile?.mainly_sell || "";
  const effectivePayment = paymentInfo || (local as any).onboardingProfile?.payment_method || "";
  const effectiveDelivery = deliveryInfo || (local as any).onboardingProfile?.delivery_method || "";

  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [composerExpanded, setComposerExpanded] = useState(false);

  // Conversation state machine
  const [convState, setConvState] = useState<ConvState>("introduction");
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>(() => {
    try {
      const stored = localStorage.getItem(`shop_cart_${shopId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadPrefs(shopId));

  // Sync cart changes to localStorage during shopping, remove key when empty
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(`shop_cart_${shopId}`, JSON.stringify(cart));
      } else {
        localStorage.removeItem(`shop_cart_${shopId}`);
      }
    } catch {
      // ignore
    }
  }, [cart, shopId]);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const activeZones = useMemo(() => {
    if (deliveryZones && deliveryZones.length > 0) return deliveryZones;
    const local = getState();
    if (Array.isArray(local.deliveryZones) && local.deliveryZones.length > 0) {
      return local.deliveryZones;
    }
    return [];
  }, [deliveryZones]);

  const [selectedTownship, setSelectedTownship] = useState<string>(() => {
    return deliveryZones?.[0]?.township_name || getState().deliveryZones?.[0]?.township_name || "";
  });

  useEffect(() => {
    if (!selectedTownship && activeZones.length > 0) {
      setSelectedTownship(activeZones[0]?.township_name || "");
    }
  }, [activeZones, selectedTownship]);
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "prepay">("cod");
  const [prepayTransactionId, setPrepayTransactionId] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = messages.length > 0;
  const copy = COPY;

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

  // Calculate delivery fee dynamically based on user input delivery zones
  const deliveryFee = useMemo(() => {
    if (!selectedTownship || !activeZones || activeZones.length === 0) return 0;
    const match = activeZones.find(
      (z) =>
        (z?.township_name || (z as any)?.township || "").toLowerCase() ===
        selectedTownship.toLowerCase()
    );
    return match ? (Number(match.rate) || 0) : 0;
  }, [selectedTownship, activeZones]);

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

    const isFirstTime = !prefs.likedProducts.includes(product.id);
    if (isFirstTime) {
      setPrefs((prev) => ({
        ...prev,
        likedProducts: [...prev.likedProducts, product.id],
      }));
    }
  }

  function handleRemoveFromCart(productId: string) {
    setCart((curr) => curr.filter((c) => c.productId !== productId));
  }

  function handleUpdateQuantity(productId: string, delta: number) {
    setCart((curr) =>
      curr
        .map((c) => {
          if (c.productId === productId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as { productId: string; quantity: number }[]
    );
  }

  // Parse action tags from AI response
  function applyTags(raw: string, currentPrefs: UserPrefs) {
    let clean = raw;
    let nextPrefs = { ...currentPrefs };

    const stateMatch = clean.match(/\[STATE:(\w+)\]/);
    if (stateMatch) {
      setConvState(stateMatch[1] as ConvState);
      clean = clean.replace(/\[STATE:\w+\]/g, "");
    }

    const actionMatches = [...clean.matchAll(/\[ACTION:([A-Z_]+)(?:,\s*ID:([a-zA-Z0-9_-]+))?\]/g)];
    for (const match of actionMatches) {
      const actionType = match[1];
      const targetId = match[2];

      if (actionType === "ADD" && targetId) {
        const prod = products.find((p) => p.id === targetId);
        if (prod) handleAddToCart(prod);
      } else if (actionType === "CHECKOUT") {
        setIsCheckoutOpen(true);
      }
    }
    clean = clean.replace(/\[ACTION:[A-Z_]+(?:,\s*ID:[a-zA-Z0-9_-]+)?\]/g, "");

    const prefMatches = [...clean.matchAll(/\[PREF:(LIKE|DISLIKE),\s*ID:([a-zA-Z0-9_-]+)\]/g)];
    for (const match of prefMatches) {
      const prefType = match[1];
      const targetId = match[2];
      if (prefType === "LIKE") {
        nextPrefs.likedProducts = Array.from(new Set([...nextPrefs.likedProducts, targetId]));
      } else if (prefType === "DISLIKE") {
        nextPrefs.dislikedProducts = Array.from(new Set([...nextPrefs.dislikedProducts, targetId]));
      }
    }
    clean = clean.replace(/\[PREF:(LIKE|DISLIKE),\s*ID:[a-zA-Z0-9_-]+\]/g, "");

    return { cleanText: cleanNormalText(clean), newPrefs: nextPrefs };
  }

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setInput("");
    if (composerInputRef.current) {
      composerInputRef.current.style.height = "44px";
      setComposerExpanded(false);
    }

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

          const storeKnowledge = [
            `- Boutique Name: ${effectiveBusinessName}`,
            effectiveOwner ? `- Founder / Owner: ${effectiveOwner}` : "",
            effectiveCategory ? `- Category & Offerings: ${effectiveCategory}` : "",
            effectivePhone ? `- Direct Phone / Hotline: ${effectivePhone}` : "",
            effectiveAddress ? `- Boutique Address: ${effectiveAddress}` : "",
          ].filter(Boolean).join("\n");

          const paymentKnowledge = [
            effectivePayment ? `Accepted Payment Methods: ${effectivePayment}` : "Payment methods: Cash on Delivery (COD) and Mobile Prepayment (KBZPay / WavePay).",
            effectivePhone ? `Mobile Wallet Account (KPay / WavePay): ${effectivePhone}` : "",
            "Settlement: Cash on Delivery is paid to the rider upon receipt. For mobile prepayment, customer provides Transaction ID and receipt proof.",
          ].filter(Boolean).join("\n");

          const deliveryScheduleText = activeZones.length > 0
            ? `Township Delivery Rates:\n${activeZones.map(z => `- ${z.township_name || (z as any).township}: ${(Number(z.rate) || 0).toLocaleString()} MMK (Estimated timeline: ${z.estimated_transit_timeline || "1-2 Days"})`).join("\n")}`
            : "";

          const deliveryKnowledge = [
            effectiveDelivery ? `Dispatch Policy: ${effectiveDelivery}` : "Delivery: Direct doorstep courier.",
            deliveryScheduleText || "Township delivery fees are calculated at checkout based on address.",
          ].filter(Boolean).join("\n\n");

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
                            text: `You are "Candy", an artisanal, warm, and attentive AI sales concierge for ${effectiveBusinessName}.
Customer Language Preference: English.
Language instruction: Respond in welcoming, polite, and refined English.

Store Profile & Contact Information:
${storeKnowledge}

Available Products in Catalog:
${productList}

Payment Options & Mobile Wallet Accounts:
${paymentKnowledge}

Delivery Schedule & Township Rates:
${deliveryKnowledge}

Current Customer Shopping Basket Status:
${cart.length === 0 ? "- The customer's shopping basket is currently completely EMPTY (0 items). Any confirmed order has been processed and the basket cleared." : `- Active Basket (${cart.length} items): ${cart.map(c => { const p = products.find(prod => prod.id === c.productId); return `${p?.name || 'Item'} x${c.quantity}`; }).join(', ')}`}

AUTHORITATIVE STORE KNOWLEDGE INSTRUCTIONS:
- You have complete, direct knowledge of ${effectiveBusinessName}'s entire store: product catalog, stock, prices, payment methods, phone number, address, and delivery matrix above.
- NEVER state that information is "not provided by the merchant" or "unspecified" when answering about items present in the store knowledge above.
- When customers ask about:
  1. Delivery / Shipping / Townships: State the exact fees and transit timelines from the delivery schedule above. If a specific township is asked, give its exact rate.
  2. Payment / KPay / WavePay: Detail the accepted methods and mention the store account phone number (${effectivePhone || "provided at checkout"}).
  3. Phone / Contact / Call: Provide the store phone number (${effectivePhone || "contact directly via chat"}).
  4. Address / Location / Visit: Provide the boutique address (${effectiveAddress || "online boutique with direct courier delivery"}).
  5. Products / Stock / Price:
     - SINGLE PRODUCT INQUIRIES (CRITICAL): When the customer asks about ONE specific product (e.g. asks about "Lamp", "Do you have lamp?", "Is lamp in stock?", "Fan price", "Tell me about the lamp"), you MUST respond with ONLY information about THAT SPECIFIC PRODUCT! Provide that product's exact price, stock availability, and description. DO NOT mention, list, or summarize any other products from the catalog.
     - FULL CATALOG INQUIRIES: ONLY list multiple products or the entire catalog if the customer explicitly asks a broad question like "what do you have?", "show catalog", "list all items", or "what do you sell?".
  6. Ordering / Checkout: Guide the customer to add items to their bag and use the Checkout button.
  7. Basket / Cart / Order status:
     - If the customer asks about their cart or basket and it is empty: State clearly that their shopping basket is currently empty (0 items) and offer to help them find items.
     - If the customer asks about an order that was confirmed: Reassure them that their order has been received and confirmed, and that their shopping basket is now clean.
- Be proactive, warm, and elegant.
- FORMATTING & PLAIN TEXT RULES:
  * Write in normal, clean plain conversational text.
  * NEVER use markdown asterisks (no "**" or "*"), hashtags ("#"), or bolding syntax in your response.
  * When showing a single product:
    Lamp — 4,500 MMK (10 pieces available). Handcrafted desk lamp with warm glow. Would you like to add it to your bag?
  * If broad catalog is requested:
    • Lamp — 4,500 MMK (10 pieces available)
    • Fan — 4,500 MMK (4 pieces available)

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

      // 2. High-speed local rule-based responder (zero lag, strictly user input for delivery & payment)
      const localReply = buildLocalReply(
        trimmed,
        products,
        cart,
        convState,
        effectiveBusinessName,
        activeZones,
        effectivePayment,
        effectiveDelivery,
        effectivePhone,
        effectiveAddress,
        effectiveOwner,
        effectiveCategory
      );
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

  // Confirm order & sync with Supabase and local store
  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your basket is empty. Please add items to checkout.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide customer name and phone number.");
      return;
    }
    if (!selectedTownship.trim()) {
      alert("Please select or specify your delivery township.");
      return;
    }
    if (!addressDetails.trim()) {
      alert("Please provide your delivery address (Street / Building / Room Address).");
      return;
    }

    setOrderSubmitting(true);
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const orderItems: OrderItem[] = cart
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          price: Number(prod.price) || 0,
        };
      })
      .filter(Boolean) as OrderItem[];

    const finalTotal = cartTotal + deliveryFee;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerTelegramId: sessionId || "public_chat_customer",
      township: selectedTownship.trim(),
      addressDetails: addressDetails.trim(),
      deliveryFee,
      paymentMethod,
      totalAmount: finalTotal,
      status: "pending",
      items: orderItems,
      createdAt: new Date().toISOString(),
    };

    try {
      let ownerId: string | null = null;
      let targetShopId = shopId || "";

      if (shopId) {
        const { data: currentShop } = await supabase
          .from("shops")
          .select("id, owner_id, shop_id")
          .or(`shop_id.eq.${shopId},id.eq.${shopId}`)
          .maybeSingle();

        if (currentShop) {
          ownerId = currentShop.owner_id || null;
          targetShopId = currentShop.shop_id || shopId;
        }
      }

      if (!ownerId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          ownerId = authData.user.id;
        }
      }

      const { error: insertErr } = await supabase.from("orders").insert([
        {
          id: newOrder.id,
          invoice_id: invoiceId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_telegram_id: sessionId || "public_chat_customer",
          township: selectedTownship.trim(),
          address_details: addressDetails.trim(),
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          total_amount: finalTotal,
          status: "pending",
          items: orderItems,
          shop_id: targetShopId || "official-store",
          owner_id: ownerId,
        },
      ]);

      if (insertErr) {
        console.warn("[ShopChatbot] Supabase order insert error:", insertErr);
      }

      // Also persist to owner's JSON state in storage if ownerId is known
      if (ownerId) {
        try {
          const ownerState = await getShopState(ownerId);
          ownerState.orders = [newOrder, ...(ownerState.orders || []).filter((o) => o.invoiceId !== invoiceId)];
          await saveShopState(ownerId, ownerState);
        } catch (storageErr) {
          console.warn("[ShopChatbot] Could not sync order to owner storage JSON:", storageErr);
        }
      }

      addOrder(newOrder);

      // Dispatch browser custom event for instant live update if dashboard is open in same window
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sales_brain_order_created", { detail: newOrder }));
      }

      setPrefs((prev) => ({
        ...prev,
        pastOrders: [...prev.pastOrders, invoiceId],
      }));

      // 1. Wipe React cart state
      setCart([]);

      // 2. Wipe persisted / cached cart keys in localStorage & sessionStorage
      try {
        localStorage.removeItem(`shop_cart_${shopId}`);
        localStorage.removeItem(`sales_brain_cart_${shopId}`);
        sessionStorage.removeItem(`shop_cart_${shopId}`);
      } catch {
        // ignore
      }

      // 3. Clear simulated/active session cart in clientStore
      clearSessionCart(sessionId || undefined);

      // 4. Reset checkout form fields
      setAddressDetails("");
      setPrepayTransactionId("");
      setIsCheckoutOpen(false);
      setOrderSuccess(newOrder);

      // 5. Dispatch global cart-cleared event to sync other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sales_brain_cart_cleared", { detail: { shopId, sessionId } }));
      }

      const confirmMessage = `🎉 Thank you, ${customerName.trim()}! Your order (${invoiceId}) has been received.\nDelivery: ${addressDetails.trim()}, ${selectedTownship.trim()}.\nTotal: ${finalTotal.toLocaleString()} MMK (including ${deliveryFee > 0 ? `${deliveryFee.toLocaleString()} MMK delivery` : "delivery"}).\nMethod: ${paymentMethod === "cod" ? "Cash on Delivery" : "Mobile Wallet"}.\nWe will contact you shortly at ${customerPhone.trim()}!`;

      setMessages((curr) => [
        ...curr,
        {
          role: "assistant",
          content: confirmMessage,
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

  function renderProductCardsForMessage(msg: Message) {
    if (msg.role !== "assistant" || !products || products.length === 0) return null;

    const lower = msg.content.toLowerCase();

    // Check if this is a broad catalog request/response
    const isCatalog =
      /catalog|all products|our products|featured pieces|curated pieces|available pieces|what do you sell|what products do you have|browse our/i.test(
        lower
      );

    // Identify which specific products from the merchant catalog are mentioned in the message text
    const matchedProducts = products.filter((p) => {
      const pName = p.name.toLowerCase().trim();
      if (!pName) return false;
      if (lower.includes(pName)) return true;
      const words = pName.split(/\s+/).filter((w) => w.length >= 3);
      for (const w of words) {
        const re = new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "i");
        if (re.test(lower)) return true;
      }
      return false;
    });

    // 1. Single Product Inquiry: render ONLY that single product's card!
    if (matchedProducts.length === 1 && !isCatalog) {
      const single = matchedProducts[0];
      return (
        <div className="w-full max-w-sm pt-1 pl-9">
          <div className="rounded-2xl border border-[#E7E5E4] bg-[#FFFFFF] p-3.5 shadow-2xs hover:border-[#0069FF]/50 transition-all flex items-center gap-3.5">
            <div
              onClick={() => void sendMessage(`Tell me about ${single.name}`)}
              className="w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-[#F3EFEA] cursor-pointer flex items-center justify-center relative group"
            >
              {single.image ? (
                <img src={single.image} alt={single.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
              ) : (
                <span className="text-[10px] text-[#78716C] font-sans px-1 text-center font-medium">
                  {single.name}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  onClick={() => void sendMessage(`Tell me about ${single.name}`)}
                  className="truncate text-sm font-sans font-semibold text-[#1C1917] cursor-pointer hover:underline tracking-tight"
                >
                  {single.name}
                </p>
                {single.stock > 0 ? (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                    {single.stock} in stock
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 shrink-0">
                    Sold Out
                  </span>
                )}
              </div>

              <p className="mt-0.5 line-clamp-1 text-xs text-[#78716C]">
                {single.description || "Authentic quality, sustainably crafted."}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-semibold text-[#1C1917]">
                  {(Number(single.price) || 0).toLocaleString()}{" "}
                  <span className="text-xs text-[#78716C] font-mono">MMK</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleAddToCart(single)}
                  className="bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus size={12} />
                  <span>{copy.addToCart}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. Multiple Products or Catalog Inquiry: render carousel for those items only
    const displayList = matchedProducts.length > 1 ? matchedProducts : isCatalog ? featuredProducts : [];
    if (displayList.length === 0) return null;

    return (
      <div className="w-full max-w-full pt-1 pl-9">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            {matchedProducts.length > 1 ? "Mentioned Pieces" : copy.productsTitle}
          </p>
          <span className="text-xs font-mono text-[#78716C]">
            {displayList.length} items
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
          {displayList.map((product) => (
            <div
              key={product.id}
              className="w-56 shrink-0 rounded-2xl border border-[#E7E5E4] bg-[#FFFFFF] p-3 shadow-2xs hover:border-stone-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => void sendMessage(`Tell me about ${product.name}`)}
                  className="h-28 overflow-hidden rounded-xl bg-[#F3EFEA] cursor-pointer flex items-center justify-center relative group"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <span className="text-xs text-[#78716C] font-sans px-2 text-center font-medium">
                      {product.name}
                    </span>
                  )}
                  {product.stock > 0 ? (
                    <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                      {product.stock} in stock
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                      Sold Out
                    </span>
                  )}
                </div>
                <p
                  onClick={() => void sendMessage(`Tell me about ${product.name}`)}
                  className="mt-2 line-clamp-1 text-sm font-sans font-semibold text-[#1C1917] cursor-pointer hover:underline"
                >
                  {product.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#78716C]">
                  {product.description || "Authentic quality."}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#E7E5E4]/80 flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-[#1C1917]">
                  {(Number(product.price) || 0).toLocaleString()} MMK
                </span>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-3 py-1 rounded-full transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                  <p className="whitespace-pre-line">{cleanNormalText(message.content)}</p>

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
                        {message.orderCard.addressDetails && (
                          <div><span className="text-[#78716C]">Address:</span> {message.orderCard.addressDetails}</div>
                        )}
                        <div><span className="text-[#78716C]">Total:</span> <span className="font-bold text-[#1C1917] font-mono">{message.orderCard.totalAmount.toLocaleString()} MMK</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product card stream: only show the requested product or catalog */}
              {message.role === "assistant" && renderProductCardsForMessage(message)}
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

                {/* Township & Delivery Fee (Only from user input zones) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#57534E] block uppercase tracking-wider">
                      Township / Delivery Area *
                    </label>
                    {deliveryFee > 0 && (
                      <span className="text-xs font-mono font-semibold text-[#0069FF]">
                        +{deliveryFee.toLocaleString()} MMK
                      </span>
                    )}
                  </div>
                  {activeZones && activeZones.length > 0 ? (
                    <select
                      required
                      value={selectedTownship}
                      onChange={(e) => setSelectedTownship(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                    >
                      <option value="">-- Select Township * --</option>
                      {activeZones.map((z) => (
                        <option key={z.id || z.township_name} value={z.township_name}>
                          {z.township_name} ({(Number(z.rate) || 0).toLocaleString()} MMK)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={selectedTownship}
                      onChange={(e) => setSelectedTownship(e.target.value)}
                      placeholder="Enter your township or area *"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                    />
                  )}
                </div>

                {/* Detailed Address (Required) */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] block mb-1 uppercase tracking-wider">
                    Street / Building / Room Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Street name, Building number, Ward *"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] text-[#1C1917] focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20 focus:outline-none"
                  />
                  {!addressDetails.trim() && (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      * Address is required for courier dispatch.
                    </p>
                  )}
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
                      <p className="text-xs font-semibold font-sans text-[#1C1917]">Mobile Wallet Transfer</p>
                      <p className="text-[11px] text-[#78716C] mt-0.5">Prepay via Mobile Banking</p>
                    </button>
                  </div>

                  {paymentMethod === "prepay" && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-xs space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#0069FF]">
                        Merchant Account Info
                      </p>
                      <p className="text-xs font-mono font-semibold text-[#1C1917]">
                        {phone ? `${phone}` : "Please confirm account details with merchant"}
                      </p>
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
                  <span>Shipping ({selectedTownship || "Standard"}):</span>
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
                disabled={
                  orderSubmitting ||
                  cart.length === 0 ||
                  !customerName.trim() ||
                  !customerPhone.trim() ||
                  !selectedTownship.trim() ||
                  !addressDetails.trim()
                }
                className="flex-1 py-2.5 rounded-full bg-[#0069FF] hover:bg-[#0052CC] font-semibold text-xs text-white cursor-pointer transition-all active:scale-[0.98] uppercase tracking-wider shadow-xs disabled:opacity-50"
              >
                {orderSubmitting ? "Confirming..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full w-full">
      {chatShell}
    </div>
  );
}
