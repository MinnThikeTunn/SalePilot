export type Language = "en" | "my";

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
  messengerBotActivationWorkspace: string;
  connectMessengerBot: string;
  connectFacebookPage: string;
  signInFacebookFirst: string;
  oauthCompleteChoosePage: string;
  activateMessengerBot: string;
  selectPageLabel: string;
  disconnectFacebook: string;
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
    languageMy: "မြန်မာ",
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
    townshipDeliveryRateMatrix: "TOWNSHIP DELIVERY RATE MATRIX",
    defineDeliveryFees: "Configure delivery pricing and transit lead times across Yangon and regional townships.",
    townshipNameLabel: "Township Name in Yangon:",
    rateLabel: "Rate (MMK):",
    addRateRule: "Add rate rule",
    matchedTownship: "Matched Township",
    estimatedTransit: "Estimated transit timeline",
    settingsActions: "Settings Actions",
    removeRule: "Remove Rule",
    townshipSearchPlaceholder: "Type township name (e.g. Yankin, Hledan, Bahan)...",
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
    oneClickOnboardingDesc: "Connect your Telegram Bot token or link your Facebook Messenger business page.",
    storeNameLabel: "Store Name:",
    smeOwnerNameLabel: "SME Owner Name:",
    contactPhoneLabel: "Contact Phone Number:",
    telegramBotUsernameLabel: "Telegram Bot Username (@):",
    saveStoreSettingsBtn: "SAVE STORE SETTINGS & CONNECT BOT",
    messengerBotActivationWorkspace: "MESSENGER BOT ACTIVATION WORKSPACE",
    connectMessengerBot: "Connect Messenger Bot",
    connectFacebookPage: "Connect Facebook Page",
    signInFacebookFirst: "Sign in with Facebook to link your business Page, then choose which Page should run the Messenger bot.",
    oauthCompleteChoosePage: "Facebook sign-in complete. Select the Page you want to use for Messenger:",
    activateMessengerBot: "Activate Messenger Bot",
    selectPageLabel: "Choose your Facebook Page:",
    disconnectFacebook: "Disconnect Messenger Bot",
    connectedActive: "Connected & Active",
    scanQrToConnect: "Scan to open bot in Telegram",

    // Live Support
    liveSupportRoomHeader: "SME CRM LIVE SUPPORT ROOM",
    chatTakeoverDesc: "Monitor real-time customer conversations and seamlessly take over live chat from AI assistant.",
    activeUserSessionsLabel: "ACTIVE USER SESSIONS:",
    supportLabel: "SUPPORT",
    aiAutoLabel: "AI AUTO",
    noMessagesChosen: "No conversation selected",
    activeModeLabel: "Active mode:",
    manualSupportOverrideLabel: "Manual Support Override",
    automatedBotActiveLabel: "Automated Bot active",
    turnOnAiBotLabel: "Turn On AI Bot Agent",
    switchToManualLabel: "Switch to Manual Mode",
    ownerChatInputPlaceholder: "Chat direct with customer here...",
    takeoverPlaceholder: "Takeover session to text with customers personally...",
    sendMessageBtn: "Send Message",
    activeSessionsCount: "Active Sessions",

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
  my: {
    // App & Shell
    appName: "Sales Brain AI",
    appSubtitle: "မြန်မာလုပ်ငန်းရှင်များအတွက် AI လူမှုကူးသန်းရောင်းဝယ်ရေး စနစ်",
    smeHubTab: "လုပ်ငန်းခွင် စင်တာ",
    webhooksActive: "Webhooks အသက်ဝင်နေသည်",
    live: "တိုက်ရိုက်လွှင့်",
    liveBot: "ဘော့တ် အသက်ဝင်နေသည်",
    workspace: "လုပ်ငန်းခွင်",
    landingPage: "ပင်မ မိတ်ဆက်စာမျက်နှာ",
    editProfile: "ပရိုဖိုင် ပြင်ဆင်ရန်",
    editBusinessProfile: "ဆိုင်အချက်အလက် ပြင်ဆင်ရန်",
    signOut: "အကောင့်မှ ထွက်မည်",
    resetDemoState: "မူလ အခြေအနေသို့ ပြန်လည်ထားမည်",
    catalogItems: "ပစ္စည်းစာရင်း အရေအတွက်",
    chooseLanguage: "ဘာသာစကား",
    languageEn: "English",
    languageMy: "မြန်မာ",
    operations: "လုပ်ငန်းလည်ပတ်မှု",
    intelligence: "AI ဆန်းစစ်ချက်",
    channels: "ဆက်သွယ်ရေး လိုင်းများ",

    // Tabs
    tabOrders: "အော်ဒါစာရင်း",
    tabProducts: "ကုန်ပစ္စည်း ကတ်တလောက်",
    tabDelivery: "ပို့ဆောင်ခ နှုန်းထားများ",
    tabInsights: "AI စီးပွားရေး မဟာဗျူဟာ",
    tabSmartMarketing: "စမတ် မားကတ်တင်း",
    tabConfig: "ဘော့တ် ချိတ်ဆက်မှု",
    tabLiveSupport: "တိုက်ရိုက် VIP အကူအညီ",

    // KPIs & Stats
    totalStoreRevenue: "စုစုပေါင်း ရောင်းရငွေ",
    excludesDelivery: "ပို့ဆောင်ခ မပါဝင်သော အသားတင် အရောင်းပမာဏ",
    validatedOrders: "အတည်ပြုပြီး အော်ဒါများ",
    cashOnDeliveryAndPrepay: "အိမ်ရောက်ငွေချေနှင့် စစ်ဆေးပြီး မိုဘိုင်းငွေလွှဲ အော်ဒါများ",
    needsVerification: "စစ်ဆေးရန် လိုအပ်ချက်များ",
    pendingOwnerVerification: "ဆိုင်ရှင် စစ်ဆေးအတည်ပြုရန် ကျန်ရှိသော ငွေလွှဲပြေစာများ",
    stockWarnings: "လက်ကျန် သတိပေးချက်များ",
    lowStockMsg: "ဆိုင်လက်ကျန် ၅ ခုနှင့် အောက် လျော့နည်းနေသော ပစ္စည်းများ",
    allInventoriesHealthy: "ပစ္စည်းလက်ကျန် အားလုံး ကောင်းမွန်ပါသည်",
    webhookAlertTitle: "ငွေလွှဲပြေစာ အသစ် ရောက်ရှိလာပါသည် ({count} စောင်)",
    webhookAlertBody: "ဝယ်သူမှ ငွေလွှဲစလစ် ပေးပို့ထားသဖြင့် ဆိုင်ရှင်၏ အတည်ပြုချက် လိုအပ်ပါသည်။",
    reviewReceipts: "ပြေစာများ စစ်ဆေးရန်",

    // Orders Ledger
    pendingTransactionsLedger: "စစ်ဆေးဆဲ ငွေလွှဲမှုများနှင့် အရောင်းစာရင်း",
    validateSubmittedScreenshots: "ဝယ်သူပေးပို့သော ငွေလွှဲစလစ်များ စစ်ဆေးခြင်း၊ ပို့ဆောင်ခ တွက်ချက်ခြင်းနှင့် အခြေအနေ စီမံခြင်း။",
    exportLedgerCsv: "စာရင်းကို CSV ဖြင့် ထုတ်ယူမည်",
    orderInvoice: "အော်ဒါ ဘောက်ချာ",
    clientCustomer: "ဝယ်သူ အမည်",
    addressLocation: "ပို့ဆောင်ရမည့် လိပ်စာ",
    paymentMethod: "ငွေပေးချေမှု ပုံစံ",
    status: "အခြေအနေ",
    invoiceSum: "စုစုပေါင်း တန်ဖိုး",
    receiptVerification: "ငွေလွှဲစလစ် စစ်ဆေးခြင်း",
    evaluateReceipt: "စလစ် စစ်ဆေးရန်",
    approveCod: "အိမ်ရောက်ငွေချေ အတည်ပြုမည်",
    markCompleted: "ပြီးစီးကြောင်း မှတ်သားမည်",
    noAuditNeeded: "စစ်ဆေးရန် မလိုအပ်ပါ",
    viewReceipt: "ပြေစာ ကြည့်မည်",
    noOrdersFound: "အော်ဒါစာရင်း မရှိသေးပါ။",
    statusPending: "စောင့်ဆိုင်းဆဲ",
    statusVerifying: "စစ်ဆေးဆဲ",
    statusConfirmed: "အတည်ပြုပြီး",
    statusCompleted: "ပြီးစီးပါပြီ",
    statusCancelled: "ပယ်ဖျက်ပြီး",

    // Receipt Modal
    evaluateReceiptHeader: "ငွေလွှဲပြေစာ စစ်ဆေးအတည်ပြုသည့် မျက်နှာပြင်",
    invoiceRef: "ဘောက်ချာ အမှတ်စဉ်",
    transactionId: "ငွေလွှဲ အမှတ် (TxID)",
    paymentChannel: "ငွေလွှဲ ချန်နယ်",
    totalCharged: "ကျသင့်ငွေ စုစုပေါင်း",
    confirmGenerateInvoice: "အတည်ပြုပြီး ဘောက်ချာ ထုတ်ပေးမည်",
    rejectScreenshot: "ပြေစာ ပယ်ဖျက်မည်",
    closeEvalPane: "ပိတ်မည်",
    submittedScreenshotEvidence: "ဝယ်သူ တင်ပြထားသော ငွေလွှဲပြေစာ ပုံရိပ်:",
    noScreenshotUploaded: "ငွေလွှဲပြေစာ တွဲတင်ထားခြင်း မရှိပါ။",
    customerPhone: "ဖုန်းနံပါတ်",
    orderItems: "မှာယူထားသော ပစ္စည်းများ",
    deliveryFee: "ပို့ဆောင်ခ",
    slipAuthenticityVerified: "ငွေလွှဲပြေစာ အမှန်တကယ် စစ်မှန်ပါသည်",

    // Products
    premiumStoreCatalog: "ကုန်ပစ္စည်း စာရင်း",
    controlProductPrices: "ပစ္စည်းအမည်၊ စျေးနှုန်း၊ လက်ကျန်စာရင်းနှင့် အမျိုးအစားများကို စီမံခန့်ခွဲပါ။",
    addNewProduct: "ပစ္စည်းအသစ် ထည့်သွင်းမည်",
    editInfo: "ပြင်ဆင်ရန်",
    delete: "ဖျက်မည်",
    editProductHeader: "ပစ္စည်း အချက်အလက် ပြင်ဆင်ရန်",
    addNewProductHeader: "ပစ္စည်းအသစ် ထည့်သွင်းရန်",
    brandNameLabel: "ပစ္စည်းအမည်:",
    categoryLabel: "အမျိုးအစား:",
    unitPriceLabel: "တစ်ခုချင်း စျေးနှုန်း (ကျပ်):",
    availableStockLabel: "လက်ကျန် အရေအတွက်:",
    imageUrlLabel: "ပစ္စည်း ဓာတ်ပုံ URL:",
    shortDescriptionLabel: "အသေးစိတ် ဖော်ပြချက်:",
    confirmProductRevisions: "ပြင်ဆင်ချက်များ အတည်ပြုမည်",
    addItemCatalog: "ပစ္စည်း ထည့်သွင်းမည်",
    cancel: "မလုပ်တော့ပါ",
    lowStockTag: "လက်ကျန်နည်း",
    unitPriceMmk: "စျေးနှုန်း (ကျပ်)",
    stockLevel: "လက်ကျန် အဆင့်",
    inStock: "ပစ္စည်း ရှိသည်",
    outOfStock: "ပစ္စည်း ကုန်သွားပါပြီ",
    isOnDemand: "အော်ဒါမှာမှ ပြုလုပ်ပေးသော ပစ္စည်း",
    waitingTimeDays: "ကြာမြင့်ချိန် (ရက်)",
    noProductsFound: "ကုန်ပစ္စည်း မရှိသေးပါ။",

    // Delivery
    townshipDeliveryRateMatrix: "မြို့နယ်အလိုက် ပို့ဆောင်ခ နှုန်းထားများ",
    defineDeliveryFees: "ရန်ကုန်မြို့တွင်းနှင့် အခြားမြို့နယ်များအတွက် ပို့ဆောင်ခနှင့် ကြာမြင့်ချိန် သတ်မှတ်ပါ။",
    townshipNameLabel: "မြို့နယ် အမည်:",
    rateLabel: "ပို့ဆောင်ခ (ကျပ်):",
    addRateRule: "နှုန်းထားအသစ် ထည့်မည်",
    matchedTownship: "သက်ဆိုင်ရာ မြို့နယ်",
    estimatedTransit: "ကြာမြင့်ချိန် ခန့်မှန်းချက်",
    settingsActions: "လုပ်ဆောင်ချက်",
    removeRule: "ဖျက်မည်",
    townshipSearchPlaceholder: "မြို့နယ်အမည် ရိုက်ထည့်ပါ (ဥပမာ - ရန်ကင်း၊ လှည်းတန်း၊ ဗဟန်း)...",
    deliveryRateMmk: "ပို့ဆောင်ခ (ကျပ်)",
    totalZonesConfigured: "သတ်မှတ်ထားသော မြို့နယ်များ",

    // Strategy & AI
    salesBrainAdvisorDesk: "SALES BRAIN AI အကြံပေး စင်တာ",
    strategicAnalysisPoweredBySparkles: "Gemini AI မှ တိုက်ရိုက်ဆန်းစစ်ပေးထားသော အရောင်းနှင့် ကုန်ပစ္စည်း စီးပွားရေး လမ်းညွှန်။",
    reEvaluateStrategy: "မဟာဗျူဟာ ပြန်လည်ဆန်းစစ်မည်",
    analyzingPatterns: "Sales Brain မှ ဝယ်သူများ၏ အပြုအမူများကို ဆန်းစစ်နေပါသည်...",
    weeklyStoreVolume: "အပတ်စဉ် အရောင်းပမာဏ ပြောင်းလဲမှု",
    leanAccountingStatsSummary: "ဘဏ္ဍာရေး အနှစ်ချုပ် အချက်အလက်",
    grossSalesValue: "စုစုပေါင်း အရောင်းပမာဏ:",
    ordersCompiled: "လက်ခံပြီး အော်ဒါအရေအတွက်:",
    canceledTransactions: "ပယ်ဖျက်လိုက်သော အရေအတွက်:",
    downloadLedgerCsv: "စာရင်းအစီရင်ခံစာ CSV ဒေါင်းလုဒ်ဆွဲမည်",
    aiBriefingTitle: "လုပ်ငန်းရှင်အတွက် မဟာဗျူဟာ အနှစ်ချုပ် လမ်းညွှန်",
    advisorSubtitle: "အချိန်နှင့်တပြေးညီ တိုးတက်မှု ညွှန်းကိန်းများ၊ ဝယ်ယူမှု အလေ့အထများနှင့် အမြတ်အစွန်း လမ်းညွှန်။",

    // Bot Connection
    telegramBotActivationWorkspace: "TELEGRAM ဘော့တ် ချိတ်ဆက်မှု လုပ်ငန်းခွင်",
    oneClickOnboardingDesc: "Telegram Bot Token ထည့်သွင်းခြင်း သို့မဟုတ် Facebook Messenger စာမျက်နှာနှင့် ချိတ်ဆက်နိုင်ပါသည်။",
    storeNameLabel: "ဆိုင်အမည်:",
    smeOwnerNameLabel: "ဆိုင်ရှင် အမည်:",
    contactPhoneLabel: "ဆက်သွယ်ရန် ဖုန်းနံပါတ်:",
    telegramBotUsernameLabel: "Telegram Bot Username (@):",
    saveStoreSettingsBtn: "ဆိုင်အချက်အလက် သိမ်းဆည်းပြီး ဘော့တ်ကို အသက်သွင်းမည်",
    messengerBotActivationWorkspace: "MESSENGER ဘော့တ် ချိတ်ဆက်မှု လုပ်ငန်းခွင်",
    connectMessengerBot: "Messenger ဘော့တ် ချိတ်ဆက်မည်",
    connectFacebookPage: "Facebook Page ချိတ်ဆက်မည်",
    signInFacebookFirst: "Facebook အကောင့်ဖြင့် အရင်ဝင်ရောက်ပြီး Messenger ဘော့တ် အသုံးပြုမည့် Page ကို ရွေးချယ်ပါ။",
    oauthCompleteChoosePage: "Facebook ဝင်ရောက်မှု အောင်မြင်ပါသည်။ အသုံးပြုမည့် Page ကို ရွေးချယ်ပါ:",
    activateMessengerBot: "Messenger ဘော့တ် အသက်သွင်းမည်",
    selectPageLabel: "အသုံးပြုမည့် Facebook Page ရွေးပါ:",
    disconnectFacebook: "Messenger ဘော့တ် ချိတ်ဆက်မှု ဖြုတ်မည်",
    connectedActive: "ချိတ်ဆက်ပြီး အသက်ဝင်နေပါသည်",
    scanQrToConnect: "Telegram တွင် ဖွင့်ရန် QR ကုဒ်ကို စကင်ဖတ်ပါ",

    // Live Support
    liveSupportRoomHeader: "SME CRM တိုက်ရိုက် VIP အကူအညီပေးခန်း",
    chatTakeoverDesc: "ဝယ်သူများနှင့် စကားပြောဆိုမှုများကို စောင့်ကြည့်ပြီး လိုအပ်ပါက AI လက်မှ ဆိုင်ရှင်ကိုယ်တိုင် တိုက်ရိုက်ဝင်ရောက် ပြောဆိုနိုင်ပါသည်။",
    activeUserSessionsLabel: "လက်ရှိ စကားပြောနေသူများ:",
    supportLabel: "လူကိုယ်တိုင်",
    aiAutoLabel: "AI အလိုအလျောက်",
    noMessagesChosen: "စကားပြောဆိုမှု မရွေးချယ်ရသေးပါ",
    activeModeLabel: "လက်ရှိ ပုံစံ:",
    manualSupportOverrideLabel: "ဆိုင်ရှင် ကိုယ်တိုင် ပြောကြားနေပါသည်",
    automatedBotActiveLabel: "AI ဘော့တ်မှ အလိုအလျောက် ဖြေကြားနေပါသည်",
    turnOnAiBotLabel: "AI ဘော့တ် ဖွင့်မည်",
    switchToManualLabel: "လူကိုယ်တိုင် ဖြေကြားမည့်စနစ်သို့ ပြောင်းမည်",
    ownerChatInputPlaceholder: "ဝယ်သူထံသို့ တိုက်ရိုက် စာပို့ရန်...",
    takeoverPlaceholder: "ဝယ်သူနှင့် ကိုယ်တိုင် စကားပြောရန် အခွင့်အရေး ယူပါ...",
    sendMessageBtn: "စာပို့မည်",
    activeSessionsCount: "လက်ရှိ စကားပြောနေသူ အရေအတွက်",

    // Simulator
    simulationSandboxTitle: "Telegram ဝယ်သူ စမ်းသပ်ခန်း",
    viewSimulatorButton: "ဝယ်သူ စကားပြောခန်း စမ်းသပ်မည်",
    closeSimulatorButton: "စမ်းသပ်ခန်း ပိတ်မည်",
    integrationQuickGuidance: "အသုံးပြုပုံ အကြံပြုချက်",
    quickGuidanceExplanation: "ဘယ်ဘက်ရှိ ကုန်ပစ္စည်းနှင့် ပို့ဆောင်ခ နှုန်းထားများကို ပြင်ဆင်ပြီး ညာဘက် စမ်းသပ်ခန်းတွင် ဝယ်သူအဖြစ် စမ်းသပ်ဝယ်ယူနိုင်ပါသည်။",
    simCheckMenu: "ပစ္စည်းစာရင်း ကြည့်မည်",
    simHowToPay: "ငွေရှင်းပုံ အချက်အလက်",
    simDeliveryInfo: "ပို့ဆောင်ခ အချက်အလက်",
    simTypeMessagePlaceholder: "ဝယ်သူအဖြစ် စာရိုက်ထည့်ပါ...",
    simAttachPaymentSlip: "ငွေလွှဲပြေစာ တွဲတင်ရန်",
    simSelectPaymentMethod: "ငွေပေးချေမှု ပုံစံ",
    simEnterTxId: "ငွေလွှဲနံပါတ် နောက်ဆုံး ၆ လုံး",
    simSendButton: "ပို့မည်",
    simCustomerTitle: "ဝယ်သူ (စမ်းသပ်မှု)",
    simBotTitle: "Candy AI အရောင်းလက်ထောက်",
    simSimulatedOrderComplete: "မှာယူမှု အောင်မြင်ပါသည်!",

    // Landing Page
    landingHeroHeadline: "လူမှုကူးသန်းရောင်းဝယ်ရေးကို AI စနစ်ဖြင့် အလိုအလျောက် ပြုလုပ်ပါ",
    landingHeroSub: "Sales Brain AI သည် Telegram, Messenger နှင့် ဝက်ဘ်ဆိုဒ်များမှ ချတ်များကို အတည်ပြုပြီး အော်ဒါများအဖြစ်သို့ အလိုအလျောက် ပြောင်းလဲပေးပြီး KPay/Wave စလစ် စစ်ဆေးခြင်းနှင့် မြို့နယ် ပို့ဆောင်ခများကို ချက်ချင်း တွက်ချက်ပေးပါသည်။",
    landingGetStarted: "လုပ်ငန်းခွင် စတင်မည်",
    landingViewDemo: "စမ်းသပ်ခန်း ကြည့်ရှုမည်",
    landingFeature1Title: "Candy AI အရောင်းလက်ထောက်",
    landingFeature1Desc: "ဝယ်သူများ၏ ပစ္စည်းမေးမြန်းမှုများကို ၂၄ နာရီ ချက်ချင်း ဖြေကြားပေးပြီး ခြင်းတောင်းထဲ အလိုအလျောက် ထည့်သွင်းပေးပါသည်။",
    landingFeature2Title: "ငွေလွှဲပြေစာ အလိုအလျောက် စစ်ဆေးခြင်း",
    landingFeature2Desc: "KBZPay, WavePay, CBPay, AYA Pay ပြေစာ စခရင်ရှော့များကို တိကျစွာ စစ်ဆေးပေးသည့် စနစ်။",
    landingFeature3Title: "မြို့နယ်အလိုက် ပို့ဆောင်ခ နှုန်းထား",
    landingFeature3Desc: "ရန်ကုန်မြို့နယ်များနှင့် နယ်ဝေးမြို့များအတွက် ပို့ဆောင်ခနှင့် ကြာမြင့်ချိန်ကို အလိုအလျောက် တွက်ချက်ပေးပါသည်။",
    landingFeature4Title: "ဆိုင်ရှင် ကိုယ်တိုင် ဝင်ရောက်ပြောဆိုနိုင်မှု",
    landingFeature4Desc: "AI မှ အလိုအလျောက် ဖြေကြားနေစဉ် လိုအပ်သည့်အချိန်တိုင်း ဆိုင်ရှင်ကိုယ်တိုင် တိုက်ရိုက် ပြောင်းလဲပြောဆိုနိုင်ပါသည်။",
    landingMetrics1: "၁၀ ဆ",
    landingMetrics1Label: "အော်ဒါ တုံ့ပြန်မှု ပိုမိုမြန်ဆန်ခြင်း",
    landingMetrics2: "၉၉.၄%",
    landingMetrics2Label: "ငွေလွှဲပြေစာ စစ်ဆေးမှု တိကျမှု",
    landingMetrics3: "ကျပ်",
    landingMetrics3Label: "မြန်မာကျပ်ငွေနှင့် ပြည်တွင်း ပို့ဆောင်ရေး အံဝင်ခွင်ကျမှု",
    landingCtaTitle: "ယနေ့ပဲ သင့်လုပ်ငန်း၏ အရောင်းစနစ်ကို အဆင့်မြှင့်တင်ပါ",
    landingCtaDesc: "မြန်မာနိုင်ငံတစ်ဝှမ်းရှိ အောင်မြင်သော လုပ်ငန်းရှင်များနှင့်အတူ လက်တွဲပြီး အော်ဒါများကို လွယ်ကူစွာ စီမံလိုက်ပါ။",
    landingLoginBtn: "အကောင့်ဝင်မည်",
    landingDashboardBtn: "လုပ်ငန်းခွင် ဖွင့်မည်",

    // Common & Notifications
    saveChanges: "သိမ်းဆည်းမည်",
    savedSuccessfully: "အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ",
    errorOccurred: "ချို့ယွင်းချက် ဖြစ်ပေါ်နေပါသည်။ ထပ်မံကြိုးစားပါ။",
    copiedToClipboard: "ကူးယူပြီးပါပြီ",
    confirmDelete: "ဤအရာကို ဖျက်ရန် သေချာပါသလား?",
    loading: "လုပ်ဆောင်နေပါသည်...",
  }
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
  "မြန်မာ": "languageMy",
};

export function getTranslation(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  
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
