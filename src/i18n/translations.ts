export type Language = "en";

export interface Translations {
  // App & Shell
  appName: string;
  appSubtitle: string;
  smeHubTab: string;
  webhooksActive: string;
  live: string;
  liveBot: string;
  workspace: string;
  landingPage: string;
  editProfile: string;
  editBusinessProfile: string;
  signOut: string;
  resetDemoState: string;
  catalogItems: string;
  chooseLanguage: string;
  languageEn: string;
  languageMy: string;
  operations: string;
  intelligence: string;
  channels: string;

  // Tabs
  tabOrders: string;
  tabProducts: string;
  tabDelivery: string;
  tabInsights: string;
  tabSmartMarketing: string;
  tabConfig: string;
  tabTelegramBot: string;
  tabWebChatbot: string;
  tabLiveSupport: string;

  // KPIs & Stats
  totalStoreRevenue: string;
  excludesDelivery: string;
  validatedOrders: string;
  cashOnDeliveryAndPrepay: string;
  needsVerification: string;
  pendingOwnerVerification: string;
  stockWarnings: string;
  lowStockMsg: string;
  allInventoriesHealthy: string;
  webhookAlertTitle: string;
  webhookAlertBody: string;
  reviewReceipts: string;

  // Orders Ledger
  pendingTransactionsLedger: string;
  validateSubmittedScreenshots: string;
  exportLedgerCsv: string;
  orderInvoice: string;
  clientCustomer: string;
  addressLocation: string;
  paymentMethod: string;
  status: string;
  invoiceSum: string;
  receiptVerification: string;
  evaluateReceipt: string;
  approveCod: string;
  markCompleted: string;
  noAuditNeeded: string;
  viewReceipt: string;
  noOrdersFound: string;
  statusPending: string;
  statusVerifying: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;

  // Receipt Modal
  evaluateReceiptHeader: string;
  invoiceRef: string;
  transactionId: string;
  paymentChannel: string;
  totalCharged: string;
  confirmGenerateInvoice: string;
  rejectScreenshot: string;
  closeEvalPane: string;
  submittedScreenshotEvidence: string;
  noScreenshotUploaded: string;
  customerPhone: string;
  orderItems: string;
  deliveryFee: string;
  slipAuthenticityVerified: string;

  // Products
  premiumStoreCatalog: string;
  controlProductPrices: string;
  addNewProduct: string;
  editInfo: string;
  delete: string;
  editProductHeader: string;
  addNewProductHeader: string;
  brandNameLabel: string;
  categoryLabel: string;
  unitPriceLabel: string;
  availableStockLabel: string;
  imageUrlLabel: string;
  shortDescriptionLabel: string;
  confirmProductRevisions: string;
  addItemCatalog: string;
  cancel: string;
  lowStockTag: string;
  unitPriceMmk: string;
  stockLevel: string;
  inStock: string;
  outOfStock: string;
  isOnDemand: string;
  waitingTimeDays: string;
  noProductsFound: string;

  // Delivery
  townshipDeliveryRateMatrix: string;
  defineDeliveryFees: string;
  townshipNameLabel: string;
  rateLabel: string;
  addRateRule: string;
  matchedTownship: string;
  estimatedTransit: string;
  settingsActions: string;
  removeRule: string;
  townshipSearchPlaceholder: string;
  deliveryRateMmk: string;
  totalZonesConfigured: string;

  // Strategy & AI
  salesBrainAdvisorDesk: string;
  strategicAnalysisPoweredBySparkles: string;
  reEvaluateStrategy: string;
  analyzingPatterns: string;
  weeklyStoreVolume: string;
  leanAccountingStatsSummary: string;
  grossSalesValue: string;
  ordersCompiled: string;
  canceledTransactions: string;
  downloadLedgerCsv: string;
  aiBriefingTitle: string;
  advisorSubtitle: string;

  // Bot Connection
  telegramBotActivationWorkspace: string;
  oneClickOnboardingDesc: string;
  storeNameLabel: string;
  smeOwnerNameLabel: string;
  contactPhoneLabel: string;
  telegramBotUsernameLabel: string;
  saveStoreSettingsBtn: string;
  connectedActive: string;
  scanQrToConnect: string;

  // Live Support
  liveSupportRoomHeader: string;
  chatTakeoverDesc: string;
  activeUserSessionsLabel: string;
  supportLabel: string;
  aiAutoLabel: string;
  noMessagesChosen: string;
  activeModeLabel: string;
  manualSupportOverrideLabel: string;
  automatedBotActiveLabel: string;
  turnOnAiBotLabel: string;
  switchToManualLabel: string;
  ownerChatInputPlaceholder: string;
  takeoverPlaceholder: string;
  sendMessageBtn: string;
  activeSessionsCount: string;

  // Simulator
  simulationSandboxTitle: string;
  viewSimulatorButton: string;
  closeSimulatorButton: string;
  integrationQuickGuidance: string;
  quickGuidanceExplanation: string;
  simCheckMenu: string;
  simHowToPay: string;
  simDeliveryInfo: string;
  simTypeMessagePlaceholder: string;
  simAttachPaymentSlip: string;
  simSelectPaymentMethod: string;
  simEnterTxId: string;
  simSendButton: string;
  simCustomerTitle: string;
  simBotTitle: string;
  simSimulatedOrderComplete: string;

  // Landing Page
  landingHeroHeadline: string;
  landingHeroSub: string;
  landingGetStarted: string;
  landingViewDemo: string;
  landingFeature1Title: string;
  landingFeature1Desc: string;
  landingFeature2Title: string;
  landingFeature2Desc: string;
  landingFeature3Title: string;
  landingFeature3Desc: string;
  landingFeature4Title: string;
  landingFeature4Desc: string;
  landingMetrics1: string;
  landingMetrics1Label: string;
  landingMetrics2: string;
  landingMetrics2Label: string;
  landingMetrics3: string;
  landingMetrics3Label: string;
  landingCtaTitle: string;
  landingCtaDesc: string;
  landingLoginBtn: string;
  landingDashboardBtn: string;

  // Common & Notifications
  saveChanges: string;
  savedSuccessfully: string;
  errorOccurred: string;
  copiedToClipboard: string;
  confirmDelete: string;
  loading: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // App & Shell
    appName: "Sales Brain AI",
    appSubtitle: "Curated Conversational Commerce for Myanmar SMEs",
    smeHubTab: "SME HUB",
    webhooksActive: "Webhooks Active",
    live: "Live",
    liveBot: "Live Bot",
    workspace: "Workspace",
    landingPage: "Landing Page",
    editProfile: "Edit Profile",
    editBusinessProfile: "Edit Profile Info",
    signOut: "Sign Out",
    resetDemoState: "Reset Demo State",
    catalogItems: "Catalog items",
    chooseLanguage: "Language",
    languageEn: "English",
    languageMy: "English",
    operations: "Operations",
    intelligence: "Intelligence",
    channels: "Channels",

    // Tabs
    tabOrders: "Orders Ledger",
    tabProducts: "Product Catalog",
    tabDelivery: "Delivery Matrix",
    tabInsights: "AI Strategy",
    tabSmartMarketing: "Smart Marketing",
    tabConfig: "Bot Connection",
    tabTelegramBot: "Telegram Bot Connection",
    tabWebChatbot: "Public Web Chatbot Connection",
    tabLiveSupport: "Live VIP Support",

    // KPIs & Stats
    totalStoreRevenue: "Total Store Revenue",
    excludesDelivery: "Net sales excluding courier delivery fees",
    validatedOrders: "Validated Orders",
    cashOnDeliveryAndPrepay: "Cash on delivery & verified mobile wallet prepays",
    needsVerification: "Needs Verification",
    pendingOwnerVerification: "Pending mobile wallet payment screenshots to audit",
    stockWarnings: "Stock Warnings",
    lowStockMsg: "Items with 5 or fewer units remaining in stock",
    allInventoriesHealthy: "All inventories healthy",
    webhookAlertTitle: "New Payment Receipt Proof ({count})",
    webhookAlertBody: "Customer submitted transaction receipt screenshots requiring owner verification.",
    reviewReceipts: "Review Receipts now",

    // Orders Ledger
    pendingTransactionsLedger: "PENDING TRANSACTIONS & SALES LEDGER",
    validateSubmittedScreenshots: "Audit customer transaction proofs, calculate courier shipping, and manage statuses.",
    exportLedgerCsv: "Export Ledger CSV",
    orderInvoice: "Order Invoice",
    clientCustomer: "Client Customer",
    addressLocation: "Address Location",
    paymentMethod: "Payment Method",
    status: "Status",
    invoiceSum: "Invoice Sum",
    receiptVerification: "Receipt Verification",
    evaluateReceipt: "Evaluate Receipt",
    approveCod: "Approve COD order",
    markCompleted: "Mark Completed",
    noAuditNeeded: "No audit action needed",
    viewReceipt: "View Receipt",
    noOrdersFound: "No orders found in ledger.",
    statusPending: "Pending",
    statusVerifying: "Verifying",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",

    // Receipt Modal
    evaluateReceiptHeader: "TRANSACTION EVALUATOR & VERIFICATION PREVIEW",
    invoiceRef: "Invoice Reference",
    transactionId: "Transaction ID",
    paymentChannel: "Payment Channel",
    totalCharged: "Total Charged",
    confirmGenerateInvoice: "Confirm & Generate Invoice",
    rejectScreenshot: "Reject Screenshot",
    closeEvalPane: "Close evaluation pane",
    submittedScreenshotEvidence: "Submitted Screenshot Evidence:",
    noScreenshotUploaded: "No receipt screenshot attached.",
    customerPhone: "Customer Phone",
    orderItems: "Ordered Items",
    deliveryFee: "Delivery Fee",
    slipAuthenticityVerified: "Slip authenticity verified",

    // Products
    premiumStoreCatalog: "PREMIUM STORE CATALOGUE",
    controlProductPrices: "Manage item listings, prices, stock levels, and custom product variants.",
    addNewProduct: "Add New Product",
    editInfo: "Edit Info",
    delete: "Delete",
    editProductHeader: "EDIT PRODUCT",
    addNewProductHeader: "ADD NEW PRODUCT",
    brandNameLabel: "Product Name:",
    categoryLabel: "Category:",
    unitPriceLabel: "Unit Price (MMK):",
    availableStockLabel: "Available stock quantity:",
    imageUrlLabel: "Product Image URL:",
    shortDescriptionLabel: "Short Description details:",
    confirmProductRevisions: "Confirm product revisions",
    addItemCatalog: "Add item catalog",
    cancel: "Cancel",
    lowStockTag: "LOW STOCK",
    unitPriceMmk: "Unit Price (MMK)",
    stockLevel: "Stock level",
    inStock: "In Stock",
    outOfStock: "Sold Out",
    isOnDemand: "Made on Demand / Pre-order",
    waitingTimeDays: "Estimated Preparation (Days)",
    noProductsFound: "No products in store catalog.",

    // Delivery
    townshipDeliveryRateMatrix: "TOWNSHIP & REGIONAL DELIVERY RATE MATRIX",
    defineDeliveryFees: "Configure delivery pricing and transit lead times across local townships and all 14 Myanmar states & regions.",
    townshipNameLabel: "Township / State / Region Name:",
    rateLabel: "Rate (MMK):",
    addRateRule: "Add rate rule",
    matchedTownship: "Matched Destination",
    estimatedTransit: "Estimated transit timeline",
    settingsActions: "Settings Actions",
    removeRule: "Remove Rule",
    townshipSearchPlaceholder: "Type township or state/region (e.g. Kamayut, Chanayethazan, Taunggyi, Mandalay Region)...",
    deliveryRateMmk: "Delivery Fee (MMK)",
    totalZonesConfigured: "Configured Delivery Zones",

    // Strategy & AI
    salesBrainAdvisorDesk: "SALES BRAIN AI ADVISOR DESK",
    strategicAnalysisPoweredBySparkles: "Automated business intelligence and merchandising insights generated by Gemini AI.",
    reEvaluateStrategy: "Re-evaluate strategy",
    analyzingPatterns: "Sales Brain is analyzing customer patterns...",
    weeklyStoreVolume: "Weekly store checkout volume",
    leanAccountingStatsSummary: "LEAN ACCOUNTING STATS SUMMARY",
    grossSalesValue: "Gross sales value:",
    ordersCompiled: "Orders compiled:",
    canceledTransactions: "Canceled transactions:",
    downloadLedgerCsv: "Download Ledger CSV Report",
    aiBriefingTitle: "Merchant Strategic Executive Briefing",
    advisorSubtitle: "Real-time growth signals, customer re-order trends, and margin recommendations.",

    // Bot Connection
    telegramBotActivationWorkspace: "TELEGRAM BOT ACTIVATION WORKSPACE",
    oneClickOnboardingDesc: "Connect your Telegram Bot token to activate automated sales and customer order processing.",
    storeNameLabel: "Store Name:",
    smeOwnerNameLabel: "SME Owner Name:",
    contactPhoneLabel: "Contact Phone Number:",
    telegramBotUsernameLabel: "Telegram Bot Username (@):",
    saveStoreSettingsBtn: "SAVE STORE SETTINGS & CONNECT BOT",
    connectedActive: "Connected & Active",
    scanQrToConnect: "Scan to open bot in Telegram",

    // Live Support
    liveSupportRoomHeader: "Live VIP Concierge",
    chatTakeoverDesc: "Monitor live conversations and step in personally whenever high-touch VIP assistance is needed.",
    activeUserSessionsLabel: "Conversations",
    supportLabel: "Personal",
    aiAutoLabel: "AI Agent",
    noMessagesChosen: "Select a conversation to read message history",
    activeModeLabel: "Status:",
    manualSupportOverrideLabel: "Personal Concierge Active",
    automatedBotActiveLabel: "Candy AI Responding",
    turnOnAiBotLabel: "Hand Back to AI",
    switchToManualLabel: "Take Over Chat",
    ownerChatInputPlaceholder: "Reply directly to customer...",
    takeoverPlaceholder: "Take over chat to reply directly to customer...",
    sendMessageBtn: "Send",
    activeSessionsCount: "Active Chats",

    // Simulator
    simulationSandboxTitle: "Telegram Sandbox Client Simulator",
    viewSimulatorButton: "Simulate Customer Chat",
    closeSimulatorButton: "Hide Chat Simulator",
    integrationQuickGuidance: "INTEGRATION QUICK GUIDANCE",
    quickGuidanceExplanation: "Test customer order flows, try quick-reply buttons, or test payment slip verification right here.",
    simCheckMenu: "Check Menu",
    simHowToPay: "How to Pay?",
    simDeliveryInfo: "Delivery info",
    simTypeMessagePlaceholder: "Message as customer...",
    simAttachPaymentSlip: "Attach Payment Slip",
    simSelectPaymentMethod: "Payment Method",
    simEnterTxId: "Last 6 digits of Tx ID",
    simSendButton: "Send",
    simCustomerTitle: "Customer (Simulated)",
    simBotTitle: "Candy AI Sales Assistant",
    simSimulatedOrderComplete: "Order placed successfully!",

    // Landing Page
    landingHeroHeadline: "Automate Social Selling with Intelligent Commerce",
    landingHeroSub: "Sales Brain AI empowers Myanmar merchants to convert chats into confirmed orders across Telegram, Messenger, and public links with instant payment slip auditing and township delivery fees.",
    landingGetStarted: "Launch Merchant Sanctuary",
    landingViewDemo: "Explore Interactive Demo",
    landingFeature1Title: "Candy AI Sales Concierge",
    landingFeature1Desc: "Autonomous bilingual shopping assistant answering customer product inquiries and capturing carts 24/7.",
    landingFeature2Title: "Payment Slip Verification",
    landingFeature2Desc: "Instant audit workflow for KBZPay, WavePay, CBPay, and AYA Pay transaction screenshots.",
    landingFeature3Title: "Township Delivery Matrix",
    landingFeature3Desc: "Automatic shipping fee calculations across Yangon townships and regional courier transit times.",
    landingFeature4Title: "Live Chat Takeover",
    landingFeature4Desc: "Seamless transition from automated AI responses to personal owner support whenever high-touch care is needed.",
    landingMetrics1: "10x",
    landingMetrics1Label: "Faster order response times",
    landingMetrics2: "99.4%",
    landingMetrics2Label: "Payment slip audit accuracy",
    landingMetrics3: "MMK",
    landingMetrics3Label: "Native Myanmar currency & couriers",
    landingCtaTitle: "Elevate your social commerce operations today",
    landingCtaDesc: "Join independent merchants simplifying order management and delightful customer care across Myanmar.",
    landingLoginBtn: "Sign In",
    landingDashboardBtn: "Open Workspace",

    // Common & Notifications
    saveChanges: "Save Changes",
    savedSuccessfully: "Settings saved successfully",
    errorOccurred: "An error occurred. Please try again.",
    copiedToClipboard: "Copied to clipboard",
    confirmDelete: "Are you sure you want to delete this?",
    loading: "Loading...",
  },
};

/** Exact English phrases lookup to support direct string calls like t("Client Customer") */
const EXACT_PHRASE_MAP: Record<string, keyof Translations> = {
  "Sales Brain AI": "appName",
  "SME HUB": "smeHubTab",
  "Orders Ledger": "tabOrders",
  "Product Catalog": "tabProducts",
  "Delivery Matrix": "tabDelivery",
  "AI Strategy": "tabInsights",
  "Smart Marketing": "tabSmartMarketing",
  "Bot Connection": "tabConfig",
  "Telegram Bot Connection": "tabTelegramBot",
  "Public Web Chatbot Connection": "tabWebChatbot",
  "Live VIP Support": "tabLiveSupport",
  "Total Store Revenue": "totalStoreRevenue",
  "Validated Orders": "validatedOrders",
  "Needs Verification": "needsVerification",
  "Stock Warnings": "stockWarnings",
  "Order Invoice": "orderInvoice",
  "Client Customer": "clientCustomer",
  "Address Location": "addressLocation",
  "Payment Method": "paymentMethod",
  "Status": "status",
  "Invoice Sum": "invoiceSum",
  "Receipt Verification": "receiptVerification",
  "Evaluate Receipt": "evaluateReceipt",
  "Approve COD order": "approveCod",
  "Mark Completed": "markCompleted",
  "Add New Product": "addNewProduct",
  "Edit Info": "editInfo",
  "Delete": "delete",
  "Edit Profile Info": "editBusinessProfile",
  "Edit Profile": "editProfile",
  "Landing Page": "landingPage",
  "Sign Out": "signOut",
  "Reset Demo State": "resetDemoState",
  "Live Bot": "liveBot",
  "Simulate Customer Chat": "viewSimulatorButton",
  "Hide Chat Simulator": "closeSimulatorButton",
  "Review Receipts now": "reviewReceipts",
  "Export Ledger CSV": "exportLedgerCsv",
  "Confirm & Generate Invoice": "confirmGenerateInvoice",
  "Reject Screenshot": "rejectScreenshot",
  "Add rate rule": "addRateRule",
  "Remove Rule": "removeRule",
  "Re-evaluate strategy": "reEvaluateStrategy",
  "Send Message": "sendMessageBtn",
  "Save Changes": "saveChanges",
  "Cancel": "cancel",
  "Language": "chooseLanguage",
  "English": "languageEn",
};

export function getTranslation(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations.en;
  
  // 1. Direct key match (e.g. t("tabOrders"))
  if (key in currentDict) {
    let text = (currentDict as any)[key] as string;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }
    return text;
  }

  // 2. Exact English phrase match (e.g. t("Client Customer"))
  const mappedKey = EXACT_PHRASE_MAP[key];
  if (mappedKey && mappedKey in currentDict) {
    let text = (currentDict as any)[mappedKey] as string;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }
    return text;
  }

  // Fallback to English dict or original key
  if (key in translations.en) {
    let text = (translations.en as any)[key] as string;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }
    return text;
  }

  return key;
}
