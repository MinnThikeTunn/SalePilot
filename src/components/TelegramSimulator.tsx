import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, ShieldAlert, Image, Check, ShoppingBag, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { TelegramSession, Product, DeliveryZone, Order } from "../types";
import { botSimulateInput } from "../services/clientStore";
import { supabase } from "../utils/supabase";
import { cleanNormalText } from "../utils/textUtils";

interface TelegramSimulatorProps {
  session: TelegramSession | undefined;
  products: Product[];
  deliveryZones: DeliveryZone[];
  onStateUpdated: () => void;
  onSendReply?: (text: string) => Promise<void>;
  onTriggerTakeover?: () => Promise<void>;
  onTriggerRelease?: () => Promise<void>;
  isPublic?: boolean;
  shopId?: string;
}

export function TelegramSimulator({
  session: initialSession,
  products,
  deliveryZones,
  onStateUpdated,
  onSendReply,
  onTriggerTakeover,
  onTriggerRelease,
  isPublic = false,
  shopId
}: TelegramSimulatorProps) {

  const [session, setSession] = useState<TelegramSession | undefined>(initialSession);
  const [inputText, setInputText] = useState("");
  const [txIdInput, setTxIdInput] = useState("");
  const [selectedPayMethod, setSelectedPayMethod] = useState<'KPay' | 'WavePay' | 'CBPay' | 'AYA Pay'>('KPay');
  const [mockScreenshotBase64, setMockScreenshotBase64] = useState<string | null>(null);
  const [customAttachBase64, setCustomAttachBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mockReceipts = [
    { name: "KBZPay Success", url: "https://placehold.co/400x600/003399/white?text=KPay+Receipt+Last+6:123456" },
    { name: "WavePay Success", url: "https://placehold.co/400x600/f7931e/white?text=WavePay+Receipt+Last+6:654321" }
  ];

  const suggestions = [
    { label: "Check Menu", text: "Show me the product menu" },
    { label: "How to Pay?", text: "How can I pay for my order?" },
    { label: "Delivery info", text: "What are the delivery charges for Yankin?" }
  ];

  // Sync internal session with prop if not public
  useEffect(() => {
    if (!isPublic) {
      setSession(initialSession);
    }
  }, [initialSession, isPublic]);

  // Listen for realtime session updates (e.g. owner intervention from Merchant Hub)
  useEffect(() => {
    const handleSessionUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<TelegramSession>;
      if (customEvent.detail) {
        if (!session || session.sessionId === customEvent.detail.sessionId) {
          setSession(customEvent.detail);
        }
      }
    };
    window.addEventListener("sales_brain_session_updated", handleSessionUpdated);
    return () => {
      window.removeEventListener("sales_brain_session_updated", handleSessionUpdated);
    };
  }, [session]);

  // Polling for public session updates
  useEffect(() => {
    if (!isPublic || !shopId) return;

    let publicSessionId = localStorage.getItem(`shop_session_${shopId}`);
    if (!publicSessionId) {
      publicSessionId = `pub_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(`shop_session_${shopId}`, publicSessionId);
    }

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("shop", {
          body: { action: "get-state", shopId }
        });
        if (!error && data) {
          // Find the session for this user
          const sessions = data.sessions || {};
          const mySession = Object.values(sessions).find((s: any) => s.sessionId === publicSessionId);
          if (mySession) {
            setSession(mySession as TelegramSession);
          } else if (!session) {
            // Create initial session object if none exists yet
            setSession({
              sessionId: publicSessionId!,
              customerName: "Public Customer",
              customerPhone: "",
              customerTelegramId: `web_${publicSessionId}`,
              messages: [],
              lastActive: new Date().toISOString(),
              currentStep: "greeting",
              cart: [],
              liveTakeoverActive: false
            });
          }
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPublic, shopId]);

  // Auto-scroll chat to latest messages
  useEffect(() => {
    if (scrollRef.current && session) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    const finalImage = customAttachBase64 || mockScreenshotBase64;
    if (!textToSend.trim() && !finalImage) return;

    setLoading(true);
    try {
      let currentSessionId = session?.sessionId || localStorage.getItem(`shop_session_${shopId}`) || "default";

      if (isPublic && shopId) {
        const { data, error } = await supabase.functions.invoke("shop", {
          body: {
            action: "chat",
            shopId,
            sessionId: currentSessionId,
            content: textToSend,
            base64Image: finalImage || undefined,
            transactionId: txIdInput || undefined,
            payMethod: selectedPayMethod,
          }
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
      } else if (session) {
        botSimulateInput({
          sessionId: session.sessionId,
          content: textToSend,
          base64Image: finalImage || undefined,
          transactionId: txIdInput || undefined,
          payMethod: selectedPayMethod,
        });
      }

      setInputText("");
      setTxIdInput("");
      setMockScreenshotBase64(null);
      setCustomAttachBase64(null);
      onStateUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutPath = async (option: "prepay" | "cod") => {
    if (!session) return;
    setLoading(true);
    try {
      if (isPublic && shopId) {
        const { data, error } = await supabase.functions.invoke("shop", {
          body: {
            action: "chat",
            shopId,
            sessionId: session.sessionId,
            checkoutOption: option,
            payMethod: option === "prepay" ? "KPay" : "CoD",
          }
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
      } else {
        botSimulateInput({
          sessionId: session.sessionId,
          checkoutOption: option,
          payMethod: option === "prepay" ? "KPay" : "CoD",
        });
      }
      onStateUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTownshipSelection = async (town: string, payMethodSelected: 'cod' | 'prepay') => {
    if (!session) return;
    setLoading(true);
    try {
      if (isPublic && shopId) {
        const { data, error } = await supabase.functions.invoke("shop", {
          body: {
            action: "chat",
            shopId,
            sessionId: session.sessionId,
            township: town,
            payMethod: payMethodSelected,
          }
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
      } else {
        botSimulateInput({
          sessionId: session.sessionId,
          township: town,
          payMethod: payMethodSelected,
        });
      }
      onStateUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add items via simulator helper buttons to simulate basket growth
  const addToCartViaSim = async (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    
    // Simulate natural dialogue
    await handleSendMessage(`I would like to order "${prod.name}"`);
  };

  return (
    <div className={`w-full max-w-sm mx-auto flex flex-col h-[670px] bg-slate-950 border-4 border-slate-800 rounded-[38px] shadow-2xl relative overflow-hidden ring-4 ring-slate-900/40 `}>
      
      {!session ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-2xl">💤</div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200">
              "No Active Sessions"
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              "When a customer messages your bot on Telegram, their chat will appear here for you to simulate and monitor."
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Phone Notch/Speaker Header */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex items-center justify-center z-40">
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl flex items-center justify-between px-3">
              <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              <div className="w-10 h-1 bg-slate-950 rounded-full"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80"></div>
            </div>
          </div>

      {/* Telegram Status Bar */}
      <div className="pt-6 px-5 pb-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono z-30">
        <div>9:41 AM</div>
        <div className="flex items-center gap-1.5">
          <span>LTE</span>
          <div className="w-4 h-2.5 bg-slate-800 rounded-sm p-0.5 flex relative">
            <div className="bg-emerald-500 w-3 h-full rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* Telegram Message Header with Takeover Indicators */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-30 relative backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Sweet Icon Candy Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center shadow font-bold text-slate-950 text-xs tracking-wider">
            🍭
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-white">
                "Candy AI Assistant"
              </span>
              <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                BOT
              </span>
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1">
              {session.liveTakeoverActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-amber-400 font-medium">
                    "Owner Takeover Active"
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>"responds instantly 24/7"</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Header actions to toggle human intervention manually */}
        <div className="flex items-center">
          {session.liveTakeoverActive ? (
            <button
              onClick={onTriggerRelease}
              className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-1 rounded hover:bg-emerald-900 transition-all cursor-pointer"
            >
              "Start AI"
            </button>
          ) : (
            <button
              onClick={onTriggerTakeover}
              className="text-[10px] font-bold text-amber-400 bg-amber-950 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-900 transition-all cursor-pointer flex items-center gap-1"
            >
              "Takeover"
            </button>
          )}
        </div>
      </div>

      {/* Telegram Wallpaper Custom Chat Box Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-slate-950 relative"
        style={{
          backgroundImage: `radial-gradient(rgba(226, 232, 240, 0.12) 0.75px, transparent 0.75px)`,
          backgroundSize: "16px 16px"
        }}
      >
        
        {/* Help Banner instructions for users */}
        <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-2xl text-[10px] text-indigo-200 text-center space-y-1 mx-2">
          <div className="font-bold flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-400 animate-spin" />
            TELEGRAM CHAT SIMULATOR
          </div>
          <p>This is a live preview of the customer's messaging window. Feel free to interact as a client!</p>
        </div>

        {/* List of dialogue messages */}
        {session.messages.map((msg, index) => {
          const isCustomer = msg.sender === "customer";
          const isSystem = msg.sender === "system";
          const isOwner = msg.sender === "owner";

          if (isSystem) {
            return (
              <div key={msg.id || index} className="flex justify-center my-2">
                <span className="bg-slate-900/90 border border-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded-full text-center max-w-[85%] font-mono">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id || index}
              className={`flex ${isCustomer ? "justify-end" : "justify-start"} items-end gap-1.5`}
            >
              {/* Bot or Owner custom profile Icon spacer */}
              {!isCustomer && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${isOwner ? 'bg-amber-500 text-slate-950' : 'bg-gradient-to-tr from-pink-500 to-amber-400 text-slate-950'}`}>
                  {isOwner ? "🧑‍💼" : "🍭"}
                </div>
              )}

              {/* Message Box */}
              <div className="max-w-[75%] space-y-1">
                <div
                  className={`p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm break-words ${
                    isCustomer
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : isOwner
                      ? "bg-amber-950/80 border border-amber-600/30 text-amber-100 rounded-bl-none"
                      : "bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800"
                  }`}
                >
                  {/* Sender title */}
                  {!isCustomer && (
                    <div className="text-[9px] font-mono mb-1 font-bold tracking-wider flex items-center gap-1 justify-between">
                      <span className={isOwner ? "text-amber-400" : "text-pink-400"}>
                        {isOwner ? `${session.customerName ? "Owner Yoon" : "Owner Yoon"}` : "Candy AI Sales"}
                      </span>
                      <span className="text-slate-500 font-normal">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Body text with quick bullet structures */}
                  <p className="whitespace-pre-line">{cleanNormalText(msg.content)}</p>

                  {/* Render simulated screenshot thumbnails inside messages */}
                  {msg.imageUrl && (
                    <div className="mt-2 border border-slate-700 rounded-lg overflow-hidden">
                      <img src={msg.imageUrl} alt="Uploaded Payment receipt proof" className="w-full h-auto object-cover max-h-36 referrer-policy='no-referrer'" />
                    </div>
                  )}

                  {/* RENDER SMART GENERATED TELEGRAM INVOICE DIRECTLY ATTACHED INSIDE THE CHAT FEED! */}
                  {msg.invoiceData && (
                    <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-indigo-500/30 font-sans text-[11px] space-y-2 text-slate-300">
                      <div className="flex items-center justify-between border-b border-indigo-900/50 pb-1.5 text-[9px] font-mono">
                        <span className="text-indigo-400 font-bold">📄 OFFICIAL INVOICE</span>
                        <span className="text-slate-500">{msg.invoiceData.invoiceId}</span>
                      </div>
                      
                      <div className="space-y-1">
                        {msg.invoiceData.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px]">
                            <span>{item.productName.substring(0, 15)}.. x{item.quantity}</span>
                            <span>{item.price * item.quantity} MMK</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-indigo-900/50 pt-1 text-[10px] space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal:</span>
                          <span>{(msg.invoiceData.totalAmount - msg.invoiceData.deliveryFee).toLocaleString()} MMK</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery:</span>
                          <span>+{msg.invoiceData.deliveryFee.toLocaleString()} MMK</span>
                        </div>
                        <div className="flex justify-between font-bold text-white pt-0.5 border-t border-slate-900">
                          <span>Total Paid:</span>
                          <span className="text-emerald-400">{msg.invoiceData.totalAmount.toLocaleString()} MMK</span>
                        </div>
                      </div>

                      <div className="pt-1.5 text-[9px] flex items-center justify-between bg-slate-900/60 p-1 px-1.5 rounded text-slate-400 border border-slate-800">
                        <span>Payment: <strong className="text-slate-200">{msg.invoiceData.paymentMethod.toUpperCase()}</strong></span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {msg.invoiceData.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Simulated Typing Indicator Bubble */}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-[10px]">🍭</div>
            <div className="bg-slate-900 px-3 py-2 border border-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-1.5">
              <span>Candy is typing</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#70B4FF] rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-[#70B4FF] rounded-full animate-pulse [animation-delay:180ms]"></span>
                <span className="w-1.5 h-1.5 bg-[#70B4FF] rounded-full animate-pulse [animation-delay:360ms]"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* QUICK REPLY DYNAMIC CUSTOMER OPTIONS INTERACTIVE PANELS */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 space-y-2 max-h-40 overflow-y-auto">
        
        {/* Dynamic checkout decision nodes */}
        {session.currentStep === "browsing" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleCheckoutPath("prepay")}
              className="bg-indigo-900 hover:bg-indigo-800 text-indigo-100 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer border border-indigo-700/50 flex items-center gap-1"
            >
              <CreditCard size={10} />
              <span>Choose Prepay Payment Option</span>
            </button>
            <button
              onClick={() => handleCheckoutPath("cod")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer border border-slate-700 flex items-center gap-1"
            >
              <ShoppingBag size={10} />
              <span>Choose Cash on Delivery</span>
            </button>
          </div>
        )}

        {/* Dynamic township selection options */}
        {session.currentStep === "selecting_township" && (
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 font-bold mb-1">
              "Select Delivery Township:"
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {deliveryZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleTownshipSelection(zone.township_name, 'prepay')}
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <MapPin size={10} /> {zone.township_name} (+{zone.rate} MMK)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prepayment Receipt Mock Uploader Interface */}
        {session.currentStep === "prepayment_pending" && (
          <div className="p-1.5 bg-slate-950 rounded-xl border border-dashed border-indigo-500/30 space-y-2 text-[10px]">
            <div className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
              <span>Submit Payment Proof:</span>
              <span className="text-[9px] text-indigo-400 font-mono">
                "STEP 2 OF 3"
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedPayMethod}
                onChange={(e) => setSelectedPayMethod(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-white rounded p-1 text-[10px]"
              >
                <option value="KPay">KPay Mobile</option>
                <option value="WavePay">Wave Pay</option>
                <option value="CBPay">CB Bank Pay</option>
                <option value="AYA Pay">AYA Pay</option>
              </select>

              <input
                type="text"
                maxLength={6}
                placeholder="Last 6 Digits"
                value={txIdInput}
                onChange={(e) => setTxIdInput(e.target.value.replace(/\D/g, ''))}
                className="bg-slate-900 border border-slate-800 text-white rounded p-1 text-[10px] text-center font-mono"
              />
            </div>

            {/* Simulated Screenshot selectors */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 block font-semibold">
                "Prepayment Receipt Action:"
              </span>
              
              {/* Computer file upload trigger */}
              <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg cursor-pointer transition-all relative">
                <Image size={11} className={mockScreenshotBase64 && !mockScreenshotBase64.startsWith("http") ? "text-emerald-400" : "text-slate-400"} />
                <span className="text-[9px] font-medium text-slate-300">
                  {mockScreenshotBase64 && !mockScreenshotBase64.startsWith("http") ? "Custom Receipt Uploaded ✓" : "Upload Receipt File"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setMockScreenshotBase64(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase shrink-0">
                  "Presets:"
                </span>
                <div className="grid grid-cols-2 gap-1 flex-1">
                  {mockReceipts.map((rec) => (
                    <button
                      key={rec.name}
                      type="button"
                      onClick={() => setMockScreenshotBase64(rec.url)}
                      className={`p-1 border text-[8px] rounded font-mono truncate text-center transition-all cursor-pointer ${
                        mockScreenshotBase64 === rec.url
                          ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {rec.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSendMessage("Submitted Pay Receipt Verification Request")}
              disabled={!txIdInput || !mockScreenshotBase64}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-1 rounded text-[10px] font-bold tracking-wider cursor-pointer transition-all"
            >
              "Upload and Verify Receipt ✅"
            </button>
          </div>
        )}

        {/* Suggestion Bubble Row helper for general chit-chat */}
        {session.currentStep !== "prepayment_pending" && session.currentStep !== "selecting_township" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestions.map((sg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sg.text);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all border border-slate-700"
              >
                {sg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ATTACHMENT PREVIEW FLOATING ACCORDION */}
      {customAttachBase64 && (
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img 
              src={customAttachBase64} 
              alt="Custom attachment upload" 
              className="w-8 h-8 object-cover rounded border border-slate-700 shadow"
            />
            <span className="text-[10px] text-slate-400 font-mono truncate">File loaded from computer</span>
          </div>
          <button 
            type="button"
            onClick={() => setCustomAttachBase64(null)}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* FOOTER DIALOG ENTRY BAR */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 pb-6">
        {/* Custom general computer image upload trigger */}
        <label className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-all shrink-0 select-none">
          <Image size={13} className={customAttachBase64 ? "text-indigo-400" : ""} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setCustomAttachBase64(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>

        <input
          type="text"
          aria-label="Customer inquiry input"
          placeholder={session?.liveTakeoverActive ? "Direct message as Customer..." : "Type custom inquiries in English..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-[#0069FF] focus-visible:ring-2 focus-visible:ring-[#0069FF] transition-all font-sans"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() && !customAttachBase64}
          aria-label="Send message"
          title="Send message"
          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#0069FF] hover:bg-[#0052CC] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0069FF]"
        >
          <Send size={13} />
        </button>
      </div>
    </>
    )}

    </div>
  );
}
