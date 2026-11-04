export type Language = "bn" | "en";

export interface TranslationDictionary {
  // Brand & Shell
  shopTitle: string;
  tagline: string;
  online: string;
  back: string;
  cashierCounter: string;
  dhakaTime: string;

  // Navigation
  dashboard: string;
  pos: string;
  sales: string;
  products: string;
  inventory: string;
  finance: string;
  reports: string;
  settings: string;

  // Roles & Access
  roleAdmin: string;
  roleManager: string;
  roleCashier: string;
  activeRole: string;
  testRole: string;
  accessDeniedTitle: string;
  accessDeniedCashier: string;
  accessDeniedManager: string;
  goToPos: string;

  // POS Terminal
  searchProduct: string;
  allCategories: string;
  outOfStock: string;
  inStock: string;
  currentOrder: string;
  emptyCart: string;
  browseCatalogPrompt: string;
  clearCart: string;
  subtotal: string;
  discount: string;
  totalAmount: string;
  paymentMethod: string;
  cash: string;
  bkash: string;
  bank: string;
  amountReceived: string;
  customerNameOptional: string;
  walkInCustomer: string;
  changeGiven: string;
  creditDue: string;
  completeSale: string;
  processingSale: string;
  saleCompleted: string;
  printThermalReceipt: string;
  nextSale: string;
  viewCartAndPay: string;
  catalogTab: string;
  orderTab: string;
  itemCount: string;

  // Common Actions
  save: string;
  saving: string;
  cancel: string;
  edit: string;
  delete: string;
  active: string;
  disabled: string;
  status: string;
  actions: string;
  date: string;
  total: string;
  paid: string;
  due: string;

  // Invoice & Shop Info
  invoice: string;
  invoiceNo: string;
  printInvoice: string;
  customer: string;
  itemName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  shopProfileTitle: string;
  shopProfileSubtitle: string;
  shopNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  vatLabel: string;
  receiptFooterLabel: string;

  // Authentication
  signInTitle: string;
  signInSubtitle: string;
  emailAddress: string;
  password: string;
  signInBtn: string;
  signingIn: string;
  signOut: string;
  demoAccounts: string;
}

export const bnTranslations: TranslationDictionary = {
  // Brand & Shell
  shopTitle: "মিষ্টি মেলা",
  tagline: "মিষ্টির দোকান ম্যানেজমেন্ট",
  online: "অনলাইন",
  back: "ফিরে যান",
  cashierCounter: "মিষ্টি কাউন্টার",
  dhakaTime: "ঢাকা সময়",

  // Navigation
  dashboard: "ড্যাশবোর্ড",
  pos: "পিওএস কাউন্টার",
  sales: "বিক্রয় ও ইনভয়েস",
  products: "মিষ্টি ও পণ্য তালিকা",
  inventory: "স্টক ও কাঁচামাল",
  finance: "হিসাব ও লেনদেন",
  reports: "লাভ-ক্ষতির রিপোর্ট",
  settings: "দোকান ও স্টাফ সেটিংস",

  // Roles & Access
  roleAdmin: "অ্যাডমিন / মালিক",
  roleManager: "স্টোর ম্যানেজার",
  roleCashier: "কাউন্টার ক্যাশিয়ার",
  activeRole: "বর্তমান রোল",
  testRole: "রোল পরিবর্তন",
  accessDeniedTitle: "প্রবেশাধিকার সংরক্ষিত",
  accessDeniedCashier: "ক্যাশিয়ার রোলে শুধুমাত্র পিওএস কাউন্টার ব্যবহারের অনুমতি রয়েছে।",
  accessDeniedManager: "ম্যানেজার রোলে শুধুমাত্র পিওএস, পণ্য ও স্টক ব্যবস্থাপনার অনুমতি রয়েছে।",
  goToPos: "পিওএস কাউন্টারে যান",

  // POS Terminal
  searchProduct: "মিষ্টি অনুসন্ধান, SKU বা বারকোড স্ক্যান (F2)...",
  allCategories: "সকল মিষ্টি",
  outOfStock: "স্টক নেই",
  inStock: "স্টকে আছে",
  currentOrder: "বর্তমান অর্ডার",
  emptyCart: "আপনার কার্ট খালি",
  browseCatalogPrompt: "অর্ডারে মিষ্টি যোগ করতে ক্যাটালগ দেখুন",
  clearCart: "কার্ট পরিষ্কার",
  subtotal: "সাবটোটাল",
  discount: "মূল্যছাড় (৳)",
  totalAmount: "মোট প্রদেয় বিল",
  paymentMethod: "পেমেন্ট মাধ্যম",
  cash: "নগদ (Cash)",
  bkash: "বিকাশ (bKash)",
  bank: "ব্যাংক (Bank)",
  amountReceived: "গ্রহণকৃত টাকা (৳)",
  customerNameOptional: "কাস্টমার নাম (ঐচ্ছিক)",
  walkInCustomer: "খুচরা ক্রেতা",
  changeGiven: "কাস্টমারকে ফেরত",
  creditDue: "বাকি টাকা",
  completeSale: "বিক্রয় সম্পন্ন করুন",
  processingSale: "বিল সংরক্ষণ হচ্ছে...",
  saleCompleted: "বিক্রয় সফলভাবে সম্পন্ন হয়েছে",
  printThermalReceipt: "রশিদ প্রিন্ট (58/80mm)",
  nextSale: "পরবর্তী বিক্রয়",
  viewCartAndPay: "কার্ট ও পেমেন্ট",
  catalogTab: "ক্যাটালগ",
  orderTab: "অর্ডার",
  itemCount: "আইটেম",

  // Common Actions
  save: "সংরক্ষণ করুন",
  saving: "সংরক্ষণ হচ্ছে...",
  cancel: "বাতিল",
  edit: "সম্পাদনা",
  delete: "মুছে ফেলুন",
  active: "সক্রিয়",
  disabled: "নিষ্ক্রিয়",
  status: "অবস্থা",
  actions: "অ্যাকশন",
  date: "তারিখ",
  total: "মোট",
  paid: "পরিশোধ",
  due: "বাকি",

  // Invoice & Shop Info
  invoice: "ইনভয়েস",
  invoiceNo: "ইনভয়েস নং",
  printInvoice: "ইনভয়েস প্রিন্ট",
  customer: "কাস্টমার",
  itemName: "পণ্য / মিষ্টির নাম",
  quantity: "পরিমাণ",
  unitPrice: "দর (৳)",
  lineTotal: "মোট (৳)",
  shopProfileTitle: "দোকানের তথ্য ও যোগাযোগের ঠিকানা",
  shopProfileSubtitle: "এই তথ্যগুলো সকল বিক্রয় ইনভয়েস, পিওএস রশিদ ও রিপোর্টে প্রদর্শিত হবে",
  shopNameLabel: "দোকানের নাম (Shop Name)",
  phoneLabel: "মোবাইল / যোগাযোগের নম্বর (Contact Phone)",
  emailLabel: "ইমেইল ঠিকানা (Email Address)",
  addressLabel: "দোকানের পূর্ণ ঠিকানা - ইনভয়েস ও রশিদে প্রিন্ট হবে (Store Address)",
  vatLabel: "ট্রেড লাইসেন্স / ভ্যাট রেজি: BIN (Trade License / BIN)",
  receiptFooterLabel: "রশিদের শেষের বার্তা (Receipt Footer Message)",

  // Authentication
  signInTitle: "লগইন করুন",
  signInSubtitle: "আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন",
  emailAddress: "ইমেইল ঠিকানা",
  password: "পাসওয়ার্ড",
  signInBtn: "লগইন করুন",
  signingIn: "লগইন হচ্ছে...",
  signOut: "লগআউট",
  demoAccounts: "ডেমো অ্যাকাউন্ট বেছে নিন",
};

export const enTranslations: TranslationDictionary = {
  // Brand & Shell
  shopTitle: "Mishty Mela",
  tagline: "Sweet Shop Retail Core",
  online: "Online",
  back: "Back",
  cashierCounter: "Sweet Counter",
  dhakaTime: "Dhaka Time",

  // Navigation
  dashboard: "Dashboard",
  pos: "POS Terminal",
  sales: "Sales & Invoices",
  products: "Products & Sweets",
  inventory: "Inventory & Stock",
  finance: "Finance & Accounts",
  reports: "Reports & P&L",
  settings: "Shop & Staff Settings",

  // Roles & Access
  roleAdmin: "Admin / Owner",
  roleManager: "Store Manager",
  roleCashier: "POS Cashier",
  activeRole: "Active Role",
  testRole: "Switch Role",
  accessDeniedTitle: "Access Restricted",
  accessDeniedCashier: "Cashier role only has permission to access the POS Terminal.",
  accessDeniedManager: "Manager role only has permission to access POS, Products, and Inventory.",
  goToPos: "Go to POS Terminal",

  // POS Terminal
  searchProduct: "Search product, SKU, or scan barcode (F2)...",
  allCategories: "All Items",
  outOfStock: "Out of Stock",
  inStock: "in stock",
  currentOrder: "Current Order",
  emptyCart: "Your cart is empty",
  browseCatalogPrompt: "Browse catalog to add items",
  clearCart: "Clear Cart",
  subtotal: "Subtotal",
  discount: "Discount (৳)",
  totalAmount: "Total Amount",
  paymentMethod: "Payment Method",
  cash: "Cash",
  bkash: "bKash",
  bank: "Bank",
  amountReceived: "Amount Received (৳)",
  customerNameOptional: "Customer (Optional)",
  walkInCustomer: "Walk-in Customer",
  changeGiven: "Change Given",
  creditDue: "Credit Due",
  completeSale: "Complete Sale",
  processingSale: "Processing Sale...",
  saleCompleted: "Sale Completed",
  printThermalReceipt: "Print Receipt (58/80mm)",
  nextSale: "Next Sale",
  viewCartAndPay: "View Cart & Pay",
  catalogTab: "Catalog",
  orderTab: "Order",
  itemCount: "items",

  // Common Actions
  save: "Save Changes",
  saving: "Saving...",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  active: "Active",
  disabled: "Disabled",
  status: "Status",
  actions: "Actions",
  date: "Date",
  total: "Total",
  paid: "Paid",
  due: "Due",

  // Invoice & Shop Info
  invoice: "Invoice",
  invoiceNo: "Invoice No",
  printInvoice: "Print Invoice",
  customer: "Customer",
  itemName: "Item Name",
  quantity: "Quantity",
  unitPrice: "Unit Price",
  lineTotal: "Line Total",
  shopProfileTitle: "Shop Profile & Contact Info",
  shopProfileSubtitle: "These details will appear on all sales invoices, POS receipts, and reports",
  shopNameLabel: "Shop / Business Name",
  phoneLabel: "Contact Phone",
  emailLabel: "Email Address",
  addressLabel: "Store Address (Prints on Invoices & Receipts)",
  vatLabel: "Trade License / VAT BIN",
  receiptFooterLabel: "Thermal Receipt Footer Note",

  // Authentication
  signInTitle: "Sign In",
  signInSubtitle: "Enter your credentials to access your account",
  emailAddress: "Email Address",
  password: "Password",
  signInBtn: "Sign In",
  signingIn: "Signing in...",
  signOut: "Sign Out",
  demoAccounts: "Quick Demo Accounts",
};
