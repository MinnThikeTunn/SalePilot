import type { ChatMessage, Order, SystemState, TelegramSession } from "../types";

type SimParams = {
  content?: string;
  base64Image?: string;
  transactionId?: string;
  township?: string;
  payMethod?: string;
  checkoutOption?: string;
};

function pushCustomerMessage(session: TelegramSession, content: string, imageUrl?: string) {
  session.messages.push({
    id: `mc-${Date.now()}`,
    sender: "customer",
    content: content || "Submitted order details",
    timestamp: new Date().toISOString(),
    imageUrl,
  });
}

function pushBotMessage(session: TelegramSession, content: string, extra: Partial<ChatMessage> = {}) {
  session.messages.push({
    id: `ms-${Date.now()}`,
    sender: "bot",
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

export function processCustomerMessage(
  state: SystemState,
  sessionId: string,
  params: SimParams
): { success: boolean; session: TelegramSession; status?: string } {
  const { content, base64Image, transactionId, township, payMethod, checkoutOption } = params;

  if (!state.sessions[sessionId]) {
    state.sessions[sessionId] = {
      sessionId,
      customerName: "New Customer",
      customerPhone: "",
      customerTelegramId: `tg_${sessionId}`,
      messages: [],
      lastActive: new Date().toISOString(),
      currentStep: "greeting",
      cart: [],
      liveTakeoverActive: false,
    };
  }

  const session = state.sessions[sessionId];
  session.lastActive = new Date().toISOString();
  pushCustomerMessage(session, content || "", base64Image);

  if (session.liveTakeoverActive) {
    return { success: true, session, status: "live_takeover" };
  }

  const trimmed = (content || "").trim().toLowerCase();

  if (trimmed.startsWith("/start") || trimmed === "menu" || trimmed === "hello" || trimmed === "hi") {
    session.currentStep = "greeting";
    session.cart = [];
    const productList = state.products.length > 0
      ? state.products.map((p, idx) => `${idx + 1}. ${p.name} - ${p.price.toLocaleString()} MMK`).join("\n")
      : "Browse items in our catalog or ask Candy for assistance.";
    const welcomeText =
      `Mingalabar shin! Welcome to ${state.config.shopName || "our store"}! Candy is happy to assist you today.\n\n` +
      productList +
      (state.products.length > 0 ? `\n\nReply with "Add ${state.products[0]?.name || "item"}" or ask for details!` : "");
    pushBotMessage(session, welcomeText);
    return { success: true, session };
  }

  if (content?.startsWith("add_")) {
    const prodId = content.replace("add_", "");
    const prod = state.products.find((p) => p.id === prodId);
    if (prod) {
      const existing = session.cart.find((c) => c.productId === prodId);
      if (existing) existing.quantity += 1;
      else session.cart.push({ productId: prodId, quantity: 1 });
      pushBotMessage(
        session,
        `Added ${prod.name} to your basket! Choose Cash on Delivery or Mobile Prepayment when ready.`
      );
      return { success: true, session };
    }
  }

  if (checkoutOption === "prepay" || checkoutOption === "cod" || content === "payment_cod" || content === "payment_prepay") {
    const opt = checkoutOption || (content === "payment_prepay" ? "prepay" : "cod");
    session.currentStep = "selecting_township";
    session.tempPayMethod = opt;
    const towns = state.deliveryZones.map((z) => z.township_name);
    pushBotMessage(session, `Great! You chose ${opt === "prepay" ? "Prepay" : "Cash on Delivery"}. Select your township:`, {
      interactiveOptions: towns,
    });
    return { success: true, session };
  }

  if (township || content?.startsWith("township_")) {
    const townName = township || content!.replace("township_", "");
    const matchedZone = state.deliveryZones.find((z) =>
      z.township_name.toLowerCase().includes(townName.toLowerCase())
    );
    const finalTownship = matchedZone?.township_name ?? "General Yangon";
    const deliveryCost = matchedZone?.rate ?? 3000;

    let cartTotal = 0;
    const itemsList = session.cart.map((item) => {
      const prod = state.products.find((p) => p.id === item.productId);
      const sub = (prod?.price ?? 0) * item.quantity;
      cartTotal += sub;
      return {
        productId: item.productId,
        productName: prod?.name ?? "Unknown Item",
        price: prod?.price ?? 0,
        quantity: item.quantity,
      };
    });

    if (itemsList.length === 0) {
      pushBotMessage(session, "Your cart is empty. Say hello or pick a product first!");
      return { success: true, session };
    }

    const totalBill = cartTotal + deliveryCost;
    const orderId = `ord-${1000 + state.orders.length + 1}`;
    const invoiceId = `INV-2026-0${100 + state.orders.length + 1}`;
    const mappedPayMethod = (payMethod || session.tempPayMethod || "cod") as "cod" | "prepay";

    const newOrder: Order = {
      id: orderId,
      invoiceId,
      customerName: session.customerName || "Customer",
      customerPhone: session.customerPhone || "",
      customerTelegramId: session.customerTelegramId,
      township: finalTownship,
      deliveryFee: deliveryCost,
      paymentMethod: mappedPayMethod,
      totalAmount: totalBill,
      status: mappedPayMethod === "prepay" ? "pending" : "confirmed",
      items: itemsList,
      createdAt: new Date().toISOString(),
    };

    if (mappedPayMethod === "cod") {
      newOrder.paymentDetails = { method: "CoD", transactionId: "CASH_ON_DELIVERY" };
    }

    state.orders.push(newOrder);
    session.activeOrderId = orderId;

    if (mappedPayMethod === "cod") {
      session.currentStep = "completed";
      pushBotMessage(session, `Order placed via Cash on Delivery! Total: ${totalBill.toLocaleString()} MMK`, {
        invoiceData: newOrder,
      });
      session.cart = [];
    } else {
      session.currentStep = "prepayment_pending";
      pushBotMessage(
        session,
        `Prepayment total: ${totalBill.toLocaleString()} MMK${state.config.phone ? ` to ${state.config.phone}` : ""}. Send TxID and receipt screenshot.`,
        { paymentDetailsNeeded: true }
      );
    }
    return { success: true, session };
  }

  if (session.currentStep === "prepayment_pending" && (transactionId || base64Image)) {
    const activeOrder = state.orders.find((o) => o.id === session.activeOrderId);
    if (activeOrder) {
      activeOrder.status = "verifying";
      activeOrder.paymentDetails = {
        method: (payMethod as "KPay") || "KPay",
        transactionId: transactionId || "UNKNOWN",
        screenshotUrl:
          base64Image ||
          "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&q=80&w=200",
      };
      session.currentStep = "verifying";
      pushBotMessage(session, "Payment proof received! Owner will verify shortly.");
      session.cart = [];
    }
    return { success: true, session };
  }

  let responseText = `Mingalabar! Candy is here to help with ${state.config.shopName || "our store"}. Ask about products or say "checkout" when ready.`;
  const lContent = (content || "").toLowerCase();

  const matchedProd = state.products.find((p) =>
    lContent.includes(p.name.toLowerCase()) ||
    (p.category && lContent.includes(p.category.toLowerCase()))
  );

  if (matchedProd) {
    const existing = session.cart.find((c) => c.productId === matchedProd.id);
    if (existing) existing.quantity += 1;
    else session.cart.push({ productId: matchedProd.id, quantity: 1 });
    responseText = `Added ${matchedProd.name} to your basket! Choose COD or Prepay when you are ready to checkout.`;
  } else if (lContent.includes("checkout") || lContent.includes("buy") || lContent.includes("order")) {
    responseText = session.cart.length > 0
      ? "Ready to checkout! Tap Cash on Delivery or Mobile Prepay buttons below."
      : "Your cart is empty. Please add a product first before checking out.";
  } else if (lContent.includes("human") || lContent.includes("agent")) {
    session.liveTakeoverActive = false;
    responseText = "Candy is still here! For live owner chat, use the SME Hub takeover button.";
  }

  state.products.forEach((p) => {
    if (lContent.includes(p.name.toLowerCase().split(" ")[0])) {
      const existing = session.cart.find((c) => c.productId === p.id);
      if (existing) existing.quantity += 1;
      else session.cart.push({ productId: p.id, quantity: 1 });
    }
  });

  pushBotMessage(session, responseText);
  return { success: true, session };
}
