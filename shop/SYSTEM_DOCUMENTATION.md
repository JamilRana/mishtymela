# Retail Core & ERP — Production-Grade Master System Documentation

**System Version:** 3.0 (Enterprise Retail Core & ERP)  
**Specification Reference:** `modules.txt` Modular Architecture  
**Primary Currency / Timezone:** Bangladeshi Taka (৳ BDT) / `Asia/Dhaka`  
**Primary Language:** বাংলা (Bangla) with instantaneous English toggle  
**Database Engine:** Neon Serverless PostgreSQL (pg16+) with Prisma ORM  
**Application Architecture:** Next.js App Router (React 19, Server Actions, Zustand, Tailwind CSS) + PWA Offline-First Sync Layer  

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Technology Stack & Architectural Standards](#2-technology-stack--architectural-standards)
3. [System Directory Structure](#3-system-directory-structure)
4. [Master Relational Data Architecture (Prisma Schema)](#4-master-relational-data-architecture-prisma-schema)
   - 4.1 [Database Schema Specifications](#41-database-schema-specifications)
   - 4.2 [Neon Serverless PostgreSQL Resilience & Connection Pooling](#42-neon-serverless-postgresql-resilience--connection-pooling)
5. [Role-Based Access Control (RBAC) & Security Architecture](#5-role-based-access-control-rbac--security-architecture)
6. [Bilingual Internationalization (i18n) & Hydration Safety](#6-bilingual-internationalization-i18n--hydration-safety)
7. [Module 01: লেনদেন (Transactions)](#7-module-01-লেনদেন-transactions)
   - 7.1 [নতুন বিক্রয় (POS Terminal & Sales Invoicing)](#71-নতুন-বিক্রয়-pos-terminal--sales-invoicing)
   - 7.2 [নতুন ক্রয় (Purchases, GRN & Inward Stock)](#72-নতুন-ক্রয়-purchases-grn--inward-stock)
   - 7.3 [অর্ডার তৈরি (Advance Orders, Quotations & Pre-orders)](#73-অর্ডার-তৈরি-advance-orders-quotations--pre-orders)
   - 7.4 [নতুন খরচ (Daily Operating Expense Recording)](#74-নতুন-খরচ-daily-operating-expense-recording)
8. [Module 02: রেকর্ড বই (Record Books & Ledgers)](#8-module-02-রেকর্ড-বই-record-books--ledgers)
   - 8.1 [বিক্রয় খাতা (Sales Ledger & Invoices)](#81-বিক্রয়-খাতা-sales-ledger--invoices)
   - 8.2 [বাকি খাতা (Customer & Supplier Due Ledgers)](#82-বাকি-খাতা-customer--supplier-due-ledgers)
   - 8.3 [ক্রয় খাতা (Purchase Ledger & History)](#83-ক্রয়-খাতা-purchase-ledger--history)
   - 8.4 [স্টক সমন্বয় (Stock Adjustments & Shrinkage)](#84-স্টক-সমন্বয়-stock-adjustments--shrinkage)
9. [Module 03: মাস্টার ডেটা (Master Data Management)](#9-module-03-মাস্টার-ডেটা-master-data-management)
   - 9.1 [পণ্যসমূহ (Products, Pricing, Barcodes & Variants)](#91-পণ্যসমূহ-products-pricing-barcodes--variants)
   - 9.2 [ক্যাটাগরি ও ব্র্যান্ড (Categories & Brands)](#92-ক্যাটাগরি-ও-ব্র্যান্ড-categories--brands)
   - 9.3 [ইউনিট (Units of Measurement - UOM)](#93-ইউনিট-units-of-measurement---uom)
   - 9.4 [কন্টাক্টস (Customers, Suppliers & Employees Directory)](#94-কন্টাক্টস-customers-suppliers--employees-directory)
   - 9.5 [লাইভ অ্যাপ প্রিভিউ (Customer-Facing Digital Showcase)](#95-লাইভ-অ্যাপ-প্রিভিউ-customer-facing-digital-showcase)
10. [Module 04: অ্যাকাউন্ট ও স্টক (Accounts & Inventory Control)](#10-module-04-অ্যাকাউন্ট-ও-স্টক-accounts--inventory-control)
    - 10.1 [ক্যাশবক্স ও দৈনিক রিকনসিলিয়েশন (Cashbox & Daily Cash Reconciliation)](#101-ক্যাশবক্স-ও-দৈনিক-রিকনসিলিয়েশন-cashbox--daily-cash-reconciliation)
    - 10.2 [ব্যাংক হিসাব ও এমএফএস (Bank Accounts & MFS Wallets)](#102-ব্যাংক-হিসাব-ও-এমএফএস-bank-accounts--mfs-wallets)
    - 10.3 [বর্তমান লাইভ স্টক ও মূল্যায়ন (Current Live Stock & Valuation)](#103-বর্তমান-লাইভ-স্টক-ও-মূল্যায়ন-current-live-stock--valuation)
    - 10.4 [কর্মচারী বেতন (Payroll & Employee Salary Management)](#104-কর্মচারী-বেতন-payroll--employee-salary-management)
11. [Module 05: ব্যবসায়িক রিপোর্ট (Business Intelligence & Reporting Hub)](#11-module-05-ব্যবসায়িক-রিপোর্ট-business-intelligence--reporting-hub)
    - 11.1 [বিক্রয় ও কর্মীভিত্তিক রিপোর্ট (Sales & Staff Performance Reports)](#111-বিক্রয়-ও-কর্মীভিত্তিক-রিপোর্ট-sales--staff-performance-reports)
    - 11.2 [ক্রয় রেজিস্টার ও সাপ্লাইয়ার বিবরণী (Purchase Register)](#112-ক্রয়-রেজিস্টার-ও-সাপ্লাইয়ার-বিবরণী-purchase-register)
    - 11.3 [Stock IN/OUT লেজার (Stock Movement Ledger)](#113-stock-inout-লেজার-stock-movement-ledger)
    - 11.4 [লাভ ও ক্ষতি এবং পণ্যভিত্তিক মুনাফা (P&L & Itemized Margin Analysis)](#114-লাভ-ও-ক্ষতি-এবং-পণ্যভিত্তিক-মুনাফা-pl--itemized-margin-analysis)
    - 11.5 [খরচ রেজিস্টার ও ক্যাটাগরিভিত্তিক ব্যয় (Expense Analytics)](#115-খরচ-রেজিস্টার-ও-ক্যাটাগরিভিত্তিক-ব্যয়-expense-analytics)
    - 11.6 [বিক্রয় ও ক্রয় ফেরত রেজিস্টার (Returns Management)](#116-বিক্রয়-ও-ক্রয়-ফেরত-রেজিস্টার-returns-management)
12. [Module 06: সেটিংস ও সিস্টেম প্রশাসন (Settings & System Administration)](#12-module-06-সেটিংস-ও-সিস্টেম-প্রশাসন-settings--system-administration)
    - 12.1 [দোকান ও অ্যাপ কনফিগারেশন (Shop Profile & Preferences)](#121-দোকান-ও-অ্যাপ-কনফিগারেশন-shop-profile--preferences)
    - 12.2 [প্রিন্টার সেটআপ (Thermal & Label Printer Engine: ESC/POS)](#122-প্রিন্টার-সেটআপ-thermal--label-printer-engine-escpos)
    - 12.3 [দোকান অ্যাক্সেস ও ইউজার অনুমতি (User Management & Security)](#123-দোকান-অ্যাক্সেস-ও-ইউজার-অনুমতি-user-management--security)
13. [মূল সুবিধা: Core Architectural Highlights](#13-মূল-সুবিধা-core-architectural-highlights)
    - 13.1 [01: POS ও বিক্রয় (Grid & Cart, Barcode, Packaging, Instant Receipt)](#131-01-pos-ও-বিক্রয়-grid--cart-barcode-packaging-instant-receipt)
    - 13.2 [02: অফলাইন-প্রথম আর্কিটেকচার (Offline-First Sync Engine)](#132-02-অফলাইন-প্রথম-আর্কিটেকচার-offline-first-sync-engine)
    - 13.3 [03: স্মার্ট সতর্কতা (Smart Alerts: Low Stock, Expiry, Due Dues, FCM)](#133-03-স্মার্ট-সতর্কতা-smart-alerts-low-stock-expiry-due-dues-fcm)
    - 13.4 [04: রিপোর্ট ও অন্তর্দৃষ্টি (Visual Decision Intelligence)](#134-04-রিপোর্ট-ও-অন্তর্দৃষ্টি-visual-decision-intelligence)
14. [Server Actions, API & Service Contracts](#14-server-actions-api--service-contracts)
15. [Setup, Environment Configuration & Production Deployment](#15-setup-environment-configuration--production-deployment)

---

## 1. Executive Summary & System Architecture

Retail Core & ERP is an enterprise-grade retail automation, inventory control, and financial accounting platform built to power fast-paced retail shops, sweet shops, bakeries, and multi-category trading businesses in Bangladesh.

The platform aligns directly with the 6 operational modules and 4 core capabilities defined in `modules.txt`:

```mermaid
flowchart TB
    subgraph CorePillars["4 Core Pillars (মূল সুবিধা)"]
        P1["01 POS ও বিক্রয় (Dual Grid/Cart, Barcode, Packaging)"]
        P2["02 অফলাইন-প্রথম (Offline-First Sync Engine & Local Storage)"]
        P3["03 স্মার্ট সতর্কতা (Smart Alerts: Low Stock, Expiry, Dues, FCM)"]
        P4["04 রিপোর্ট ও অন্তর্দৃষ্টি (Business Intelligence & Executive Insights)"]
    end

    subgraph Modules["6 Operational Modules (মডিউলসমূহ)"]
        M1["01 লেনদেন<br/>(Transactions: Sales, Purchase, Pre-Orders, Expenses)"]
        M2["02 রেকর্ড বই<br/>(Ledgers: Sales, Dues, Purchases, Stock Adj)"]
        M3["03 মাস্টার ডেটা<br/>(Master Data: Products, Categories, Units, Contacts)"]
        M4["04 অ্যাকাউন্ট ও স্টক<br/>(Cashbox, Banks, Live Stock, Payroll)"]
        M5["05 ব্যবসায়িক রিপোর্ট<br/>(Reports: Sales, Staff, P&L, Margin, Returns)"]
        M6["06 সেটিংস ও সিস্টেম<br/>(Settings: Store, ESC/POS Printers, RBAC)"]
    end

    subgraph DataSync["Data & Sync Engine"]
        LOC["Client IndexedDB / Local Cache"]
        SYNC["Bi-directional Sync Service (Idempotent UUIDs)"]
        SRV["Next.js Server Actions & Domain Services"]
        DB["Neon Serverless PostgreSQL (Prisma ORM)"]
    end

    CorePillars -.-> Modules
    Modules --> LOC
    LOC <--> SYNC
    SYNC <--> SRV
    SRV --> DB
```

### Core Business Axioms
1. **Sales-Driven Operating Revenue:** Operating income is generated strictly from confirmed sales. Manual entries cannot falsify sales volumes. Each sale decrements stock atomically, snapshots weighted-average unit costs, and credits the chosen financial account.
2. **Strict Inventory Segregation & Packaging Auto-Allocation:** Products are classified into `RETAIL` (sellable sweets & confectionery), `RAW_MATERIAL` (flour, sugar, ghee, milk), and `PACKAGING` (sweet boxes, bags). In sweet shops, sweet boxes ($1\text{ kg}, 0.5\text{ kg}$) are automatically decremented from inventory at ৳0.00 to guarantee stock accuracy without billing customers.
3. **Double-Entry Money Ledger with Cutoff Defense:** Money movements between accounts (Cash Drawer, Safe, bKash, Bank) are recorded as two matched ledger rows with a shared `transferId`. When daily trading closes, a cutoff date (`booksClosedThrough`) locks historical records against retrospective edits.
4. **Bangla-First Interface with Zero Hydration Drift:** The default locale is Bengali (`bn`) with instant toggle to English (`en`). All monetary values use Bangladeshi Taka (`৳ BDT`) and dates adhere to `Asia/Dhaka` time.

---

## 2. Technology Stack & Architectural Standards

| Tier | Technology | Version | Purpose & Architecture |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.4` | Server Actions, React Server Components (RSC), Turbopack compiler |
| **Runtime UI** | React / React DOM | `19.0.0` | React 19 concurrent features, transitions (`useTransition`), optimistic state |
| **Type System** | TypeScript | `5.7.3` | Strict null checks, discriminated unions, schema inference |
| **Database** | Neon Serverless PostgreSQL | `v16+` | Serverless PostgreSQL with auto-suspend tolerance and direct connection pooling |
| **ORM** | Prisma Client | `6.19.3` | Type-safe SQL generation, atomic `$transaction`, row-level locking |
| **Client Storage** | IndexedDB / Dexie.js | Latest | Offline-first local catalog, draft sales, and pending transaction outbox |
| **Client State** | Zustand | `5.0.3` | Persisted client stores (`localStorage`) for cart, role, and shop profile |
| **Styling** | Tailwind CSS | `3.4.17` | Utility-first CSS, high-contrast POS typography, print media rules |
| **UI Primitives** | Radix UI | Latest | Accessible dialogs, dropdowns, popovers, and accessible modals |
| **Hardware** | WebUSB / WebBluetooth / WebSerial | Standard | Raw ESC/POS thermal printing (58mm/80mm) and barcode sticker printing |
| **Push Alerts** | Firebase Cloud Messaging (FCM) & Web Push | Standard | Background push notifications for low stock, expiry, and customer dues |
| **Validation** | Zod | `3.24.2` | Complete input validation across forms and Server Action boundaries |

---

## 3. System Directory Structure

```text
shop-management-core/
├── modules.txt                       # Functional Module Specification
├── SYSTEM_DOCUMENTATION.md           # Master System Documentation (This Document)
├── IMPLEMENTATION_PLAN.md            # Phased Technical Execution Roadmap
├── shop/
│   ├── .env                          # Pooled & Direct PostgreSQL connection strings
│   ├── prisma/
│   │   ├── schema.prisma             # Master Database Schema
│   │   ├── migrations/               # Prisma migration history
│   │   └── seed.ts                   # Master seed data (Admin, accounts, products)
│   ├── public/
│   │   ├── manifest.json             # PWA Web App Manifest
│   │   ├── sw.js                     # Offline Service Worker & Push Notification Handler
│   │   └── icons/                    # App icons & badges
│   ├── src/
│   │   ├── actions/                  # Server Actions (Mutations & Queries)
│   │   │   ├── auth.ts               # Login, logout, session verification
│   │   │   ├── contacts.ts           # Customers, Suppliers, Staff CRUD & Ledgers
│   │   │   ├── finance.ts            # Cash, bank, manual expenses & categories
│   │   │   ├── inventory.ts          # Stock adjustments, wastage & valuation
│   │   │   ├── orders.ts             # Pre-orders & advance booking management
│   │   │   ├── payroll.ts            # Employee salary calculations & payouts
│   │   │   ├── products.ts           # Product lifecycle, barcodes & UOM
│   │   │   ├── purchases.ts          # Goods inward, supplier purchase orders & bills
│   │   │   ├── reports.ts            # P&L, sales reports, item margins, returns
│   │   │   ├── returns.ts            # Sales returns & purchase returns management
│   │   │   ├── sales.ts              # POS atomic checkout, invoicing & voids
│   │   │   ├── sync.ts               # Offline transaction sync engine & conflicts
│   │   │   ├── treasury.ts           # Daily open/close reconciliation & cash drawer
│   │   │   └── users.ts              # RBAC user accounts & permissions
│   │   ├── app/                      # Next.js App Router Structure
│   │   │   ├── (admin)/              # Back-office Management Console
│   │   │   │   ├── contacts/         # কন্টাক্টস (কাস্টমার, সাপ্লাইয়ার, কর্মচারী)
│   │   │   │   ├── dashboard/        # Executive overview & KPIs
│   │   │   │   ├── finance/          # ক্যাশবক্স, ব্যাংক ও খরচ
│   │   │   │   ├── inventory/        # বর্তমান স্টক ও স্টক সমন্বয়
│   │   │   │   ├── orders/           # অর্ডার তৈরি ও প্রি-অর্ডার তালিকা
│   │   │   │   ├── payroll/          # কর্মচারী বেতন ও বিতরণ
│   │   │   │   ├── printer/          # প্রিন্টার সেটআপ (থার্মাল ও লেবেল)
│   │   │   │   ├── products/         # পণ্যসমূহ, ক্যাটাগরি, ব্র্যান্ড ও ইউনিট
│   │   │   │   ├── purchases/        # নতুন ক্রয় ও ক্রয় খাতা
│   │   │   │   ├── reports/          # ব্যবসায়িক রিপোর্ট হাব
│   │   │   │   ├── returns/          # বিক্রয় ফেরত ও ক্রয় ফেরত
│   │   │   │   ├── sales/            # বিক্রয় খাতা ও বাকি খাতা
│   │   │   │   └── settings/         # দোকান ও সিস্টেম সেটিংস
│   │   │   ├── (auth)/login/         # Authentication screen
│   │   │   ├── (pos)/pos/            # Fullscreen High-Speed POS Terminal
│   │   │   ├── catalog/              # লাইভ অ্যাপ প্রিভিউ (Customer Showcase)
│   │   │   ├── layout.tsx            # Global HTML layout & font definitions
│   │   │   └── page.tsx              # Root landing & role-based redirector
│   │   ├── components/               # React UI Components
│   │   │   ├── contacts/             # Customer & Supplier ledger dialogs
│   │   │   ├── finance/              # Day open/close wizard, transfer modal
│   │   │   ├── orders/               # Pre-order form & delivery timeline
│   │   │   ├── payroll/              # Monthly salary sheet & payslip modal
│   │   │   ├── pos/                  # POS product grid, keypad & packaging
│   │   │   ├── printer/              # ESC/POS direct tester & label designer
│   │   │   ├── purchases/            # Purchase GRN form & bill entry
│   │   │   ├── reports/              # Visual charts, P&L cards & export buttons
│   │   │   ├── shared/               # AppShell, headers, badges, language switch
│   │   │   └── ui/                   # Button, Dialog, Input, Select, Table
│   │   ├── lib/
│   │   │   ├── escpos.ts             # Direct ESC/POS byte generator & printer drivers
│   │   │   ├── fcm.ts                # Firebase Cloud Messaging push client
│   │   │   ├── i18n.ts               # Bilingual English/Bangla dictionary
│   │   │   ├── offline-sync.ts       # IndexedDB queue & background sync worker
│   │   │   ├── prisma.ts             # Prisma client with Neon cold-start retry
│   │   │   └── utils.ts              # Formatting, currency, date & number helpers
│   │   └── stores/                   # Zustand Reactive Stores
│   │       ├── cart.ts               # POS cart state & packaging calculation
│   │       ├── language.ts           # Persistent i18n state
│   │       ├── offline.ts            # Online/offline network status & sync queue
│   │       └── role.ts               # User RBAC context & permissions
```

---

## 4. Master Relational Data Architecture (Prisma Schema)

The database architecture is designed with relational rigor, referential integrity, and atomic balance guarantees.

```mermaid
erDiagram
    Organization ||--o{ User : "employs"
    Organization ||--o{ Contact : "maintains"
    Organization ||--o{ Product : "stocks"
    Organization ||--o{ Category : "groups"
    Organization ||--o{ Brand : "manages"
    Organization ||--o{ Unit : "defines"
    Organization ||--o{ Sale : "issues"
    Organization ||--o{ Purchase : "orders"
    Organization ||--o{ Order : "books"
    Organization ||--o{ Account : "operates"
    Organization ||--o{ Transaction : "records"
    Organization ||--o{ DaySession : "reconciles"
    Organization ||--o{ PayrollRecord : "processes"
    Organization ||--o{ SalesReturn : "authorizes"
    Organization ||--o{ PurchaseReturn : "dispatches"

    Product ||--o{ StockMovement : "tracks"
    Product ||--o{ SaleItem : "sold_in"
    Product ||--o{ PurchaseItem : "purchased_in"
    Product ||--o{ OrderItem : "reserved_in"

    Contact ||--o{ Sale : "purchased_by"
    Contact ||--o{ Purchase : "supplied_by"
    Contact ||--o{ Order : "placed_by"
    Contact ||--o{ PayrollRecord : "salaried_to"
    Contact ||--o{ ContactLedger : "audits_dues"

    Sale ||--o{ SaleItem : "contains"
    Sale ||--o{ Transaction : "funded_by"
    Sale ||--o{ SalesReturn : "returned_via"

    Purchase ||--o{ PurchaseItem : "contains"
    Purchase ||--o{ Transaction : "settled_by"
    Purchase ||--o{ PurchaseReturn : "returned_via"

    DaySession ||--o{ DayAccountClosing : "summarizes"
    Account ||--o{ Transaction : "logs_movements"
```

### 4.1 Database Schema Specifications

```prisma
// ==========================================
// CORE ENUMS
// ==========================================

enum Role {
  ADMIN
  OWNER
  MANAGER
  CASHIER
  STAFF
}

enum ContactType {
  CUSTOMER
  SUPPLIER
  EMPLOYEE
}

enum ProductType {
  RETAIL
  RAW_MATERIAL
  PACKAGING
}

enum MovementType {
  PURCHASE
  PURCHASE_RETURN
  SALE
  SALE_VOID
  SALE_RETURN
  ADJUSTMENT
  PRODUCTION
  ORDER_RESERVATION
}

enum SaleStatus {
  COMPLETED
  VOID
}

enum OrderStatus {
  PENDING
  CONFIRMED
  IN_PREPARATION
  READY
  DELIVERED
  CANCELLED
}

enum ReturnStatus {
  COMPLETED
  VOID
}

enum TxType {
  INCOME
  EXPENSE
}

enum TxSource {
  SALE
  PURCHASE
  MANUAL
  TRANSFER
  CLOSING_ADJUSTMENT
  REFUND
  CUSTOMER_DUE_PAYMENT
  SUPPLIER_DUE_PAYMENT
  PAYROLL
}

enum AccountType {
  CASH
  MOBILE
  BANK
  SAFE
  OWNER
}

enum SessionStatus {
  OPEN
  CLOSED
}

// ==========================================
// ORGANIZATION & MULTI-TENANCY
// ==========================================

model Organization {
  id                 String          @id @default(uuid())
  name               String
  currency           String          @default("BDT")
  timezone           String          @default("Asia/Dhaka")
  address            String?
  phone              String?
  email              String?
  vatNumber          String?
  receiptFooter      String?
  booksClosedThrough DateTime?
  createdAt          DateTime        @default(now())

  users              User[]
  categories         Category[]
  brands             Brand[]
  units              Unit[]
  contacts           Contact[]
  products           Product[]
  sales              Sale[]
  purchases          Purchase[]
  orders             Order[]
  accounts           Account[]
  txCategories       TxCategory[]
  transactions       Transaction[]
  stockMovements     StockMovement[]
  invoiceSeq         InvoiceSequence?
  daySessions        DaySession[]
  payrollRecords     PayrollRecord[]
  salesReturns       SalesReturn[]
  purchaseReturns    PurchaseReturn[]
  auditLogs          AuditLog[]
  printerSettings    PrinterSetting[]
}

// ==========================================
// CONTACTS (CUSTOMERS, SUPPLIERS, STAFF)
// ==========================================

model Contact {
  id             String          @id @default(uuid())
  organizationId String
  type           ContactType
  name           String
  phone          String
  email          String?
  address        String?
  openingBalance Decimal         @default(0) @db.Decimal(14, 2)
  currentDue     Decimal         @default(0) @db.Decimal(14, 2) // (+) Receivable from customer, (-) Payable to supplier
  creditLimit    Decimal?        @db.Decimal(14, 2)
  monthlySalary  Decimal?        @db.Decimal(14, 2) // For employees
  designation    String?
  active         Boolean         @default(true)
  createdAt      DateTime        @default(now())

  organization   Organization    @relation(fields: [organizationId], references: [id])
  sales          Sale[]
  purchases      Purchase[]
  orders         Order[]
  ledgerEntries  ContactLedger[]
  payrollRecords PayrollRecord[]

  @@index([organizationId, type, phone])
}

model ContactLedger {
  id             String       @id @default(uuid())
  organizationId String
  contactId      String
  date           DateTime     @default(now())
  refType        String       // SALE, PURCHASE, DUE_PAYMENT, RETURN, OPENING
  refId          String?
  description    String?
  debit          Decimal      @default(0) @db.Decimal(14, 2)
  credit         Decimal      @default(0) @db.Decimal(14, 2)
  balanceAfter   Decimal      @db.Decimal(14, 2)
  createdById    String?

  contact        Contact      @relation(fields: [contactId], references: [id])

  @@index([organizationId, contactId, date])
}

// ==========================================
// MASTER DATA: PRODUCTS, BRANDS, UNITS
// ==========================================

model Category {
  id             String       @id @default(uuid())
  organizationId String
  name           String
  organization   Organization @relation(fields: [organizationId], references: [id])
  products       Product[]

  @@unique([organizationId, name])
}

model Brand {
  id             String       @id @default(uuid())
  organizationId String
  name           String
  organization   Organization @relation(fields: [organizationId], references: [id])
  products       Product[]

  @@unique([organizationId, name])
}

model Unit {
  id             String       @id @default(uuid())
  organizationId String
  name           String       // kg, gm, pcs, liter, ml, box, dozen
  shortName      String       // কেজি, গ্রাম, পিস, লিটার, বক্স
  conversionRate Decimal      @default(1.000) @db.Decimal(10, 4) // Relative to base unit
  organization   Organization @relation(fields: [organizationId], references: [id])
  products       Product[]

  @@unique([organizationId, name])
}

model Product {
  id             String          @id @default(uuid())
  organizationId String
  categoryId     String?
  brandId        String?
  unitId         String?
  name           String
  sku            String
  barcode        String?
  imageUrl       String?
  unit           String          @default("pcs")
  productType    ProductType     @default(RETAIL)
  isSellable     Boolean         @default(true)
  sellingPrice   Decimal         @db.Decimal(14, 2)
  wholesalePrice Decimal?        @db.Decimal(14, 2)
  avgCost        Decimal         @default(0) @db.Decimal(14, 4)
  stockQty       Decimal         @default(0) @db.Decimal(14, 3)
  reorderLevel   Decimal         @default(0) @db.Decimal(14, 3)
  expiryDays     Int?            // Shelf-life in days
  active         Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  organization   Organization    @relation(fields: [organizationId], references: [id])
  category       Category?       @relation(fields: [categoryId], references: [id])
  brand          Brand?          @relation(fields: [brandId], references: [id])
  unitRef        Unit?           @relation(fields: [unitId], references: [id])
  movements      StockMovement[]
  saleItems      SaleItem[]
  purchaseItems  PurchaseItem[]
  orderItems     OrderItem[]
  returnItems    SalesReturnItem[]

  @@unique([organizationId, sku])
  @@unique([organizationId, barcode])
  @@index([organizationId, active])
}

model StockMovement {
  id             String       @id @default(uuid())
  organizationId String
  productId      String
  type           MovementType
  quantityDelta  Decimal      @db.Decimal(14, 3) // Signed (+ In, - Out)
  unitCost       Decimal      @db.Decimal(14, 4)
  balanceAfter   Decimal      @db.Decimal(14, 3)
  refType        String?      // SALE, PURCHASE, ADJUSTMENT, RETURN, PRODUCTION
  refId          String?
  note           String?
  batchNo        String?
  expiryDate     DateTime?
  createdById    String?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  product        Product      @relation(fields: [productId], references: [id])

  @@index([organizationId, productId, createdAt])
}

// ==========================================
// TRANSACTIONS: SALES, PURCHASES & ORDERS
// ==========================================

model Sale {
  id             String          @id @default(uuid())
  organizationId String
  invoiceNo      String
  contactId      String?
  customerName   String?
  subtotal       Decimal         @db.Decimal(14, 2)
  discount       Decimal         @default(0) @db.Decimal(14, 2)
  vatAmount      Decimal         @default(0) @db.Decimal(14, 2)
  total          Decimal         @db.Decimal(14, 2)
  paid           Decimal         @default(0) @db.Decimal(14, 2)
  due            Decimal         @default(0) @db.Decimal(14, 2)
  status         SaleStatus      @default(COMPLETED)
  idempotencyKey String?         @unique
  createdById    String?
  createdAt      DateTime        @default(now())
  voidedAt       DateTime?

  organization   Organization    @relation(fields: [organizationId], references: [id])
  contact        Contact?        @relation(fields: [contactId], references: [id])
  items          SaleItem[]
  transactions   Transaction[]
  returns        SalesReturn[]

  @@unique([organizationId, invoiceNo])
  @@index([organizationId, createdAt])
}

model SaleItem {
  id          String   @id @default(uuid())
  saleId      String
  productId   String
  productName String
  quantity    Decimal  @db.Decimal(14, 3)
  unitPrice   Decimal  @db.Decimal(14, 2)
  unitCost    Decimal  @db.Decimal(14, 4)
  discount    Decimal  @default(0) @db.Decimal(14, 2)
  lineTotal   Decimal  @db.Decimal(14, 2)

  sale        Sale     @relation(fields: [saleId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])

  @@index([saleId])
  @@index([productId])
}

model Purchase {
  id             String          @id @default(uuid())
  organizationId String
  billNo         String          // Supplier bill/challan number
  contactId      String          // Supplier Contact
  subtotal       Decimal         @db.Decimal(14, 2)
  taxAmount      Decimal         @default(0) @db.Decimal(14, 2)
  discount       Decimal         @default(0) @db.Decimal(14, 2)
  total          Decimal         @db.Decimal(14, 2)
  paid           Decimal         @default(0) @db.Decimal(14, 2)
  due            Decimal         @default(0) @db.Decimal(14, 2)
  note           String?
  receivedDate   DateTime        @default(now())
  createdById    String?
  createdAt      DateTime        @default(now())

  organization   Organization    @relation(fields: [organizationId], references: [id])
  supplier       Contact         @relation(fields: [contactId], references: [id])
  items          PurchaseItem[]
  transactions   Transaction[]
  returns        PurchaseReturn[]

  @@unique([organizationId, billNo])
  @@index([organizationId, receivedDate])
}

model PurchaseItem {
  id          String   @id @default(uuid())
  purchaseId  String
  productId   String
  productName String
  quantity    Decimal  @db.Decimal(14, 3)
  unitCost    Decimal  @db.Decimal(14, 4)
  lineTotal   Decimal  @db.Decimal(14, 2)
  batchNo     String?
  expiryDate  DateTime?

  purchase    Purchase @relation(fields: [purchaseId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])

  @@index([purchaseId])
}

model Order {
  id             String          @id @default(uuid())
  organizationId String
  orderNo        String
  contactId      String?
  customerName   String
  customerPhone  String
  deliveryDate   DateTime
  subtotal       Decimal         @db.Decimal(14, 2)
  discount       Decimal         @default(0) @db.Decimal(14, 2)
  advancePaid    Decimal         @default(0) @db.Decimal(14, 2)
  total          Decimal         @db.Decimal(14, 2)
  dueBalance     Decimal         @db.Decimal(14, 2)
  status         OrderStatus     @default(PENDING)
  notes          String?
  convertedSaleId String?
  createdById    String?
  createdAt      DateTime        @default(now())

  organization   Organization    @relation(fields: [organizationId], references: [id])
  contact        Contact?        @relation(fields: [contactId], references: [id])
  items          OrderItem[]

  @@unique([organizationId, orderNo])
  @@index([organizationId, deliveryDate])
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  productId   String
  productName String
  quantity    Decimal  @db.Decimal(14, 3)
  unitPrice   Decimal  @db.Decimal(14, 2)
  lineTotal   Decimal  @db.Decimal(14, 2)

  order       Order    @relation(fields: [orderId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
}

// ==========================================
// RETURNS MANAGEMENT
// ==========================================

model SalesReturn {
  id             String            @id @default(uuid())
  organizationId String
  returnNo       String
  saleId         String
  refundAmount   Decimal           @db.Decimal(14, 2)
  accountId      String?           // Account money was refunded from
  reason         String?
  status         ReturnStatus      @default(COMPLETED)
  createdById    String?
  createdAt      DateTime          @default(now())

  organization   Organization      @relation(fields: [organizationId], references: [id])
  sale           Sale              @relation(fields: [saleId], references: [id])
  items          SalesReturnItem[]

  @@unique([organizationId, returnNo])
}

model SalesReturnItem {
  id            String      @id @default(uuid())
  salesReturnId String
  productId     String
  quantity      Decimal     @db.Decimal(14, 3)
  refundRate    Decimal     @db.Decimal(14, 2)
  lineTotal     Decimal     @db.Decimal(14, 2)
  restocked     Boolean     @default(true) // True = returned to inventory, False = discarded/wastage

  salesReturn   SalesReturn @relation(fields: [salesReturnId], references: [id])
  product       Product     @relation(fields: [productId], references: [id])

  @@index([salesReturnId])
}

model PurchaseReturn {
  id             String          @id @default(uuid())
  organizationId String
  returnNo       String
  purchaseId     String
  supplierId     String
  amountCredited Decimal         @db.Decimal(14, 2)
  reason         String?
  status         ReturnStatus    @default(COMPLETED)
  createdById    String?
  createdAt      DateTime        @default(now())

  organization   Organization    @relation(fields: [organizationId], references: [id])
  purchase       Purchase        @relation(fields: [purchaseId], references: [id])

  @@unique([organizationId, returnNo])
}

// ==========================================
// PAYROLL & EMPLOYEE SALARY
// ==========================================

model PayrollRecord {
  id             String       @id @default(uuid())
  organizationId String
  contactId      String       // Employee Contact
  month          Int          // 1 - 12
  year           Int          // 2026
  baseSalary     Decimal      @db.Decimal(14, 2)
  bonus          Decimal      @default(0) @db.Decimal(14, 2)
  deduction      Decimal      @default(0) @db.Decimal(14, 2)
  netPayable     Decimal      @db.Decimal(14, 2)
  paidAmount     Decimal      @default(0) @db.Decimal(14, 2)
  accountId      String?      // Account salary was disbursed from
  paymentDate    DateTime?
  status         String       @default("UNPAID") // UNPAID, PARTIAL, PAID
  notes          String?
  createdById    String?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  employee       Contact      @relation(fields: [contactId], references: [id])

  @@unique([organizationId, contactId, month, year])
  @@index([organizationId, year, month])
}

// ==========================================
// ACCOUNTS, TRANSACTIONS & RECONCILIATION
// ==========================================

model Account {
  id             String              @id @default(uuid())
  organizationId String
  name           String
  type           AccountType
  accountNumber  String?
  branchName     String?
  active         Boolean             @default(true)
  organization   Organization        @relation(fields: [organizationId], references: [id])
  transactions   Transaction[]
  closings       DayAccountClosing[]

  @@unique([organizationId, name])
}

model TxCategory {
  id             String        @id @default(uuid())
  organizationId String
  name           String
  type           TxType
  organization   Organization  @relation(fields: [organizationId], references: [id])
  transactions   Transaction[]

  @@unique([organizationId, name, type])
}

model Transaction {
  id             String        @id @default(uuid())
  organizationId String
  type           TxType
  source         TxSource      @default(MANUAL)
  amount         Decimal       @db.Decimal(14, 2)
  accountId      String
  categoryId     String?
  saleId         String?
  purchaseId     String?
  transferId     String?
  description    String?
  occurredAt     DateTime      @default(now())
  createdById    String?
  voidedAt       DateTime?
  createdAt      DateTime      @default(now())

  organization   Organization  @relation(fields: [organizationId], references: [id])
  account        Account       @relation(fields: [accountId], references: [id])
  category       TxCategory?   @relation(fields: [categoryId], references: [id])
  sale           Sale?         @relation(fields: [saleId], references: [id])
  purchase       Purchase?     @relation(fields: [purchaseId], references: [id])
  createdBy      User?         @relation(fields: [createdById], references: [id])

  @@index([organizationId, occurredAt])
  @@index([organizationId, type, source])
  @@index([organizationId, transferId])
  @@index([organizationId, accountId, occurredAt, id])
}

model DaySession {
  id             String              @id @default(uuid())
  organizationId String
  businessDate   DateTime            @db.Date
  status         SessionStatus       @default(OPEN)
  openedAt       DateTime            @default(now())
  openedById     String
  openedBy       User                @relation("SessionOpenedBy", fields: [openedById], references: [id])
  closedAt       DateTime?
  closedById     String?
  closedBy       User?               @relation("SessionClosedBy", fields: [closedById], references: [id])
  approvedById   String?
  approvedBy     User?               @relation("SessionApprovedBy", fields: [approvedById], references: [id])
  note           String?
  closings       DayAccountClosing[]
  organization   Organization        @relation(fields: [organizationId], references: [id])

  @@index([organizationId, openedAt])
  @@index([organizationId, status])
}

model DayAccountClosing {
  id              String      @id @default(uuid())
  sessionId       String
  accountId       String
  openingBalance  Decimal     @db.Decimal(14, 2)
  salesIn         Decimal     @db.Decimal(14, 2)
  otherIn         Decimal     @db.Decimal(14, 2)
  expensesOut     Decimal     @db.Decimal(14, 2)
  purchasesOut    Decimal     @db.Decimal(14, 2)
  transfersNet    Decimal     @db.Decimal(14, 2)
  expectedBalance Decimal     @db.Decimal(14, 2)
  countedBalance  Decimal     @db.Decimal(14, 2)
  variance        Decimal     @db.Decimal(14, 2)
  varianceReason  String?
  adjustmentTxId  String?
  session         DaySession  @relation(fields: [sessionId], references: [id])
  account         Account     @relation(fields: [accountId], references: [id])

  @@unique([sessionId, accountId])
}

// ==========================================
// HARDWARE & PRINTER SETTINGS
// ==========================================

model PrinterSetting {
  id             String       @id @default(uuid())
  organizationId String
  name           String       // Counter Thermal, Kitchen, Label
  connectionType String       // USB, BLUETOOTH, NETWORK
  paperWidth     Int          @default(80) // 58 or 80 mm
  ipAddress      String?
  port           Int?         @default(9100)
  autoCut        Boolean      @default(true)
  openCashDrawer Boolean      @default(true)
  isDefault      Boolean      @default(false)
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// ==========================================
// SYSTEM AUDIT & SEQUENCES
// ==========================================

model InvoiceSequence {
  organizationId String       @id
  lastNo         Int          @default(0)
  lastPurchaseNo Int          @default(0)
  lastOrderNo    Int          @default(0)
  lastReturnNo   Int          @default(0)
  organization   Organization @relation(fields: [organizationId], references: [id])
}

model AuditLog {
  id             String        @id @default(uuid())
  organizationId String
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  action         String
  entity         String
  entityId       String?
  detail         Json?
  createdAt      DateTime      @default(now())
  organization   Organization  @relation(fields: [organizationId], references: [id])

  @@index([organizationId, createdAt])
  @@index([organizationId, userId])
}
```

### 4.2 Neon Serverless PostgreSQL Resilience & Connection Pooling

Neon dynamically puts serverless compute endpoints into sleep (`auto-suspend`) when idle. When the shop opens or after a quiet period, the compute endpoint takes 2–4 seconds to spin up.

To prevent cold-start crashes in production:
1. **Connection String Timeouts (`.env`):**
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[neon-pooler-host]/[dbname]?sslmode=require&connect_timeout=30&pool_timeout=30"
   DIRECT_URL="postgresql://[user]:[password]@[neon-direct-host]/[dbname]?sslmode=require&connect_timeout=30"
   ```
2. **Transparent Cold-Start Retry Wrapper (`withDbRetry` in `src/lib/prisma.ts`):**
   - Automatically traps transient network error codes (`P1001`, `P1002`, `P1017`) and retries the operation up to 3 times with exponential backoff before bubbling errors.
   - All server actions and server page data fetches use this pattern.

---

## 5. Role-Based Access Control (RBAC) & Security Architecture

The platform enforces a five-tier granular role hierarchy:

| Capability / Resource | OWNER | ADMIN | MANAGER | CASHIER | STAFF |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **POS Checkout & Quick Receipts** | Yes | Yes | Yes | Yes | No |
| **Void Active Sales / Invoices** | Yes | Yes | Yes (Approval) | No | No |
| **View Profit & Loss / Margins** | Yes | Yes | No | No | No |
| **Manual Expenses Recording** | Yes | Yes | Yes | Yes (Limit) | No |
| **Daily Cash Opening / Closing** | Yes | Yes | Yes | View Drawer | No |
| **Reopen Closed Day Session** | Yes (Owner Only) | No | No | No | No |
| **Purchase Inward & GRN** | Yes | Yes | Yes | No | No |
| **Manage Customers & Credit Dues**| Yes | Yes | Yes | View Due | No |
| **Employee Payroll & Salary Pay** | Yes | Yes | No | No | No |
| **Hardware & Printer Settings** | Yes | Yes | Yes | View Only | No |
| **User Role Management & Secrets**| Yes | Yes | No | No | No |

### Security Defense Measures
- **Bcrypt Hash Storage:** Passwords hashed with salt cost 10.
- **Account Lockout:** 5 consecutive failed login attempts trigger an exponential lock for 15 minutes.
- **Strict Row-Level Organization Scoping:** Every Prisma query includes `where: { organizationId }` to guarantee multi-tenant tenant isolation.
- **Immutable Ledger Guarantee:** Financial transactions cannot be mutated or hard deleted. Voids create compensating entries with timestamps and `createdById` attribution.

---

## 6. Bilingual Internationalization (i18n) & Hydration Safety

The system is engineered with zero hydration mismatch for bilingual operations:

```mermaid
flowchart LR
    SSR["Server Component (RSC)<br/>Renders standard skeleton"]
    HYD["Client Hydration<br/>Reads cookie / localStorage"]
    ZST["useHydratedLanguage Store<br/>Hydrated: true"]
    UI["Re-renders with active locale<br/>(Bangla / English)"]

    SSR --> HYD --> ZST --> UI
```

### Translation Mapping Architecture
- All terms are declared in a typed interface `TranslationDictionary` in `src/lib/i18n.ts`.
- `useHydratedLanguage()` exposes:
  - `t(key, fallback)`: Safe dictionary lookup with fallback.
  - `language`: Current language (`'bn'` | `'en'`).
  - `formatMoney(amount)`: Formats with `৳` symbol and Bengali numerals when active.
  - `formatDate(date)`: Formats in `Asia/Dhaka` timezone using localized month names.

---

## 7. Module 01: লেনদেন (Transactions)

Module 01 governs all financial and inventory ingress/egress transactions.

```mermaid
graph TD
    subgraph M01["01: লেনদেন (Transactions)"]
        T1["7.1 নতুন বিক্রয় (POS Terminal)"]
        T2["7.2 নতুন ক্রয় (Purchases & GRN)"]
        T3["7.3 অর্ডার তৈরি (Advance Orders)"]
        T4["7.4 নতুন খরচ (Daily Expenses)"]
    end

    T1 -->|Stock Out + Income| ACC["Account Ledger"]
    T2 -->|Stock In + Accounts Payable| ACC
    T3 -->|Advance Deposit| ACC
    T4 -->|Operating Expense| ACC
```

### 7.1 নতুন বিক্রয় (POS Terminal & Sales Invoicing)
- **High-Speed Dual Mode:** 
  - *Grid Mode:* Categorized photo/tile catalog for touch screens and counter tablets.
  - *Cart/Barcode Mode:* Rapid barcode scanning with instant quantity increments and keyboard shortcuts (`F2`: Focus Barcode, `F4`: Cash Checkout, `Space`: Split Pay).
- **Complimentary Packaging Deduction:** Auto-links sweet weight to box stock (e.g. 1kg Chamcham automatically consumes 1kg Box from inventory at ৳0.00).
- **Split Payment:** Seamless split across Cash, bKash, and Bank in a single checkout.
- **Atomic Execution:**
  1. Decrements product stock and records `StockMovement(SALE)`.
  2. Inserts `Sale` and `SaleItem` rows with snapshot weighted-average unit cost.
  3. Inserts `Transaction(INCOME, SALE)` posting to the active session drawer.
  4. Triggers automatic thermal ESC/POS print.

### 7.2 নতুন ক্রয় (Purchases, GRN & Inward Stock)
- **Goods Received Note (GRN):** Records raw materials (milk, ghee, sugar) or retail finished goods received from registered suppliers.
- **Weighted-Average Cost (WAC) Update:**
  $$\text{New WAC} = \frac{(\text{Current Qty} \times \text{Current WAC}) + (\text{Inward Qty} \times \text{Purchase Rate})}{\text{Current Qty} + \text{Inward Qty}}$$
- **Payment & Due Allocation:** Supports immediate account payment, partial payment, or full credit (auto-posted to Supplier Due Ledger).

### 7.3 অর্ডার তৈরি (Advance Orders, Quotations & Pre-orders)
- **Advance Booking Engine:** Designed for wedding orders, bulk sweets, catering, and festival pre-orders.
- **Workflow State Machine:**
  $$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{IN\_PREPARATION} \longrightarrow \text{READY} \longrightarrow \text{DELIVERED} \longrightarrow \text{CONVERTED\_TO\_SALE}$$
- **Advance Deposit:** Collects booking token payment, issues booking voucher, and locks inventory reservation.

### 7.4 নতুন খরচ (Daily Operating Expense Recording)
- **Expense Logging:** Records shop rent, staff tea/meals, electricity bills, transport, and maintenance.
- **Classification:** Categorized under predefined `TxCategory` with account selection and user attribution.
- **Cutoff Check:** Automatically rejects postings dated at or before `Organization.booksClosedThrough`.

---

## 8. Module 02: রেকর্ড বই (Record Books & Ledgers)

Module 02 provides historical ledgers, audit registers, and receivable/payable ledgers.

```mermaid
graph LR
    subgraph M02["02: রেকর্ড বই (Record Books)"]
        L1["8.1 বিক্রয় খাতা<br/>(Sales Invoices & History)"]
        L2["8.2 বাকি খাতা<br/>(Customer & Supplier Dues)"]
        L3["8.3 ক্রয় খাতা<br/>(Purchase Bills & History)"]
        L4["8.4 স্টক সমন্বয়<br/>(Stock Adjustments & Audit)"]
    end
```

### 8.1 বিক্রয় খাতা (Sales Ledger & Invoices)
- Comprehensive invoice history with date filtering, customer search, cashier badge, and payment method filter.
- Actions: Thermal reprint, PDF invoice download, customer receipt share, and managerial sale voiding.
- Post-close void protection: Voids on closed dates generate a `REFUND` entry dated today.

### 8.2 বাকি খাতা (Customer & Supplier Due Ledgers)
- **Customer Dues (Receivables):**
  - Tracks individual customer balances, credit limits, and aging (0–30 days, 31–60 days, 60+ days).
  - Repayment modal: Records partial/full repayment, issues repayment receipt, and posts money into Cash/Bank account.
- **Supplier Dues (Payables):**
  - Tracks outstanding balances owed to suppliers for raw material and stock purchases.
  - Supplier disbursement modal: Logs payment from designated bank/cash account and adjusts running supplier balance.

### 8.3 ক্রয় খাতা (Purchase Ledger & History)
- Complete register of inward purchase invoices, supplier bills, itemized delivery history, and tax/discount breakdowns.
- Filtering by supplier, date range, payment status (Paid / Partial / Due), and item SKU.

### 8.4 স্টক সমন্বয় (Stock Adjustments & Shrinkage)
- Stock reconciliation tool for physical inventory counts.
- Reason codes: Spoiled sweets, production shrinkage, expiry write-off, counting error.
- Posts signed `StockMovement(ADJUSTMENT)` and updates product `stockQty` atomically.

---

## 9. Module 03: মাস্টার ডেটা (Master Data Management)

Module 03 maintains all primary catalog, unit, contact, and showcase data.

### 9.1 পণ্যসমূহ (Products, Pricing, Barcodes & Variants)
- **Product Lifecycle:** SKU, barcode, category, brand, unit, retail price, wholesale price, average cost, and reorder levels.
- **Barcode Engine:** Auto-generates unique EAN-13 / Code-128 barcodes and prints thermal sticker labels.
- **Shelf-Life & Expiry:** Stores `expiryDays` for perishable sweet items to power smart expiry alerts.

### 9.2 ক্যাটাগরি ও ব্র্যান্ড (Categories & Brands)
- Hierarchical classification of goods (e.g., Traditional Sweets, Premium Sweets, Curd/Doi, Bakery, Raw Ingredients, Packaging Materials).
- Brand and manufacturer association for packaged goods and wholesale supplies.

### 9.3 ইউনিট (Units of Measurement - UOM)
- Multi-unit management with fractional precision:
  - Base units: `kg`, `gm`, `liter`, `ml`, `pcs`, `box`, `dozen`.
  - Conversion rates (e.g. $1\text{ kg} = 1000\text{ gm}$).
- Allows POS checkout in fractions (e.g., 0.250 kg Sweet = 250 grams).

### 9.4 কন্টাক্টস (Customers, Suppliers & Employees Directory)
- Unified contact directory linking every external and internal entity.
- Maintains credit limits, phone numbers, delivery addresses, and designation details.

### 9.5 লাইভ অ্যাপ প্রিভিউ (Customer-Facing Digital Showcase)
- Interactive, responsive digital catalog view for tablets, counter screens, or QR menu browsing.
- Displays live product availability, photos, descriptions, and pricing without administrative controls.

---

## 10. Module 04: অ্যাকাউন্ট ও স্টক (Accounts & Inventory Control)

Module 04 manages physical and digital money balances, treasury reconciliation, live inventory valuation, and payroll.

```mermaid
flowchart TD
    subgraph DayRecon["Daily Cash Reconciliation Routine"]
        OPN["1. Open Day (Confirm Opening Cash Float)"]
        TRD["2. Trading Operations (Sales, Expenses, Transfers)"]
        PRP["3. Prepare Closing (Expected Cash Calculated)"]
        CNT["4. Physical Count Entry (Shortage / Surplus Check)"]
        CLS["5. Confirm Close (Lock Cutoff Date & Post Variances)"]
    end

    OPN --> TRD --> PRP --> CNT --> CLS
```

### 10.1 ক্যাশবক্স ও দৈনিক রিকনসিলিয়েশন (Cashbox & Daily Cash Reconciliation)
- **Single Active Session Rule:** Ensures only one trading session is active at any time.
- **Opening Cash Float:** Confirms morning drawer cash before POS transactions begin.
- **Closing Wizard:**
  1. Computes system expected balance:
     $$\text{Expected} = \text{Opening} + \text{Sales In} + \text{Other In} - \text{Expenses} - \text{Purchases} \pm \text{Transfers}$$
  2. Compares with physical counted cash to find variance:
     $$\text{Variance} = \text{Counted Balance} - \text{Expected Balance}$$
  3. If variance $\neq 0$, requires manager/owner password approval and variance reason.
  4. Automatically posts a `CLOSING_ADJUSTMENT` ledger entry so next day's opening balance equals counted balance.
  5. Advances `Organization.booksClosedThrough` to lock past transactions.

### 10.2 ব্যাংক হিসাব ও এমএফএস (Bank Accounts & MFS Wallets)
- Multi-account management: Cash Drawer, Shop Safe, Bank Accounts (DBBL, City Bank, etc.), and MFS (bKash Merchant, Nagad).
- **Atomic Mid-Day Transfers:** Moves cash drops from Cash Drawer to Safe or Bank without altering profit or expenses.

### 10.3 বর্তমান লাইভ স্টক ও মূল্যায়ন (Current Live Stock & Valuation)
- Live inventory dashboard showing stock on hand, committed stock (pre-orders), and available stock.
- **Inventory Valuation:**
  - Asset Value at Cost: $\sum (\text{Stock Qty} \times \text{Avg Cost})$
  - Retail Sales Value: $\sum (\text{Stock Qty} \times \text{Selling Price})$
  - Expected Gross Profit Margin.

### 10.4 কর্মচারী বেতন (Payroll & Employee Salary Management)
- Staff salary profiles with monthly base salary, attendance deductions, and performance bonuses.
- Salary sheet generator: Computes monthly net payable for all employees.
- Disbursement action: Disburses salary from Cash or Bank account, logs `Transaction(EXPENSE, PAYROLL)`, and generates printable payslips.

---

## 11. Module 05: ব্যবসায়িক রিপোর্ট (Business Intelligence & Reporting Hub)

Module 05 aggregates data across the organization into actionable financial intelligence and executive dashboards.

```mermaid
flowchart LR
    SALES["Total Sales Revenue"] --> GP["Gross Profit"]
    COGS["Cost of Goods Sold (COGS)"] --> GP
    GP --> NP["Net Operating Profit"]
    OPEX["Operating Expenses"] --> NP
```

### 11.1 বিক্রয় ও কর্মীভিত্তিক রিপোর্ট (Sales & Staff Performance Reports)
- **Time-Based Sales:** Hourly sales heatmaps, daily breakdowns, monthly trends, and year-over-year growth.
- **Staff/User Sales:** Cashier sales volume, invoice count, average transaction value, and void counts.

### 11.2 ক্রয় রেজিস্টার ও সাপ্লাইয়ার বিবরণী (Purchase Register)
- Summary of all inward purchase bills, supplier dues, itemized costs, and purchase tax.

### 11.3 Stock IN/OUT লেজার (Stock Movement Ledger)
- Chronological stock card for every product:
  - Inflows: Purchases, Production, Adjustments (+), Sales Returns.
  - Outflows: POS Sales, Wastage/Damaged, Adjustments (-), Purchase Returns.

### 11.4 লাভ ও ক্ষতি এবং পণ্যভিত্তিক মুনাফা (P&L & Itemized Margin Analysis)
- **Standard Financial P&L:**
  $$\text{Net Sales} = \text{Subtotal} - \text{Discounts}$$
  $$\text{Gross Profit} = \text{Net Sales} - \text{COGS}$$
  $$\text{Net Operating Profit} = \text{Gross Profit} - \text{Operating Expenses}$$
- **Per-Product Profitability:**
  - Ranks items by total profit contribution and gross margin percentage:
    $$\text{Margin } \% = \frac{\text{Selling Price} - \text{Unit Cost}}{\text{Selling Price}} \times 100$$

### 11.5 খরচ রেজিস্টার ও ক্যাটাগরিভিত্তিক ব্যয় (Expense Analytics)
- Visual pie and bar charts showing expense distribution across categories (Rent, Utilities, Staff Meals, Maintenance).

### 11.6 বিক্রয় ও ক্রয় ফেরত রেজিস্টার (Returns Management)
- Register of all returned retail items and supplier returns with reasons, restocking audits, and refund tracking.

---

## 12. Module 06: সেটিংস ও সিস্টেম প্রশাসন (Settings & System Administration)

Module 06 configures hardware, application behaviors, and security permissions.

### 12.1 দোকান ও অ্যাপ কনফিগারেশন (Shop Profile & Preferences)
- Shop Name, legal address, phone number, VAT/BIN registration number.
- Invoice prefixes (`INV-`, `PUR-`, `ORD-`), default currency (`৳ BDT`), timezone, and receipt header/footer messages.

### 12.2 প্রিন্টার সেটআপ (Thermal & Label Printer Engine: ESC/POS)
- **Supported Hardware:** 58mm & 80mm thermal receipt printers, USB barcode sticker printers, ESC/POS Bluetooth printers.
- **Direct ESC/POS Driver:** Browser-based raw ESC/POS command generator supporting:
  - Text formatting: Bold, double-height, double-width, centered alignment.
  - Bengali receipt rendering via canvas rasterization or localized thermal font ROM.
  - Automated paper cut command (`GS V 66 0`) and cash drawer kick pulse (`ESC p 0 25 250`).

### 12.3 দোকান অ্যাক্সেস ও ইউজার অনুমতি (User Management & Security)
- User directory, role assignment, active/inactive toggle, password resets, and session revocation.
- Comprehensive audit log viewer logging security actions, logins, voids, and day closures.

---

## 13. মূল সুবিধা: Core Architectural Highlights

The 4 core pillars defined in `modules.txt` represent the architectural differentiators of the system.

### 13.1 01: POS ও বিক্রয় (Grid & Cart, Barcode, Packaging, Instant Receipt)
- **Speed-Optimized Counter UX:** Optimized for under-3-second counter checkouts.
- **Integrated Packaging:** Zero manual counting of packaging boxes; sweet boxes deduct automatically.
- **Keyboard-First Shortcuts:** Full counter operation without touching a mouse.

### 13.2 02: অফলাইন-প্রথম আর্কিটেকচার (Offline-First Sync Engine)

To guarantee uninterrupted store operations during internet outages, the system implements an offline-first architecture:

```mermaid
sequenceDiagram
    participant UI as POS UI
    participant IDB as Local IndexedDB
    participant SW as Sync Worker
    participant SRV as Cloud Next.js API
    participant DB as Neon PostgreSQL

    Note over UI,IDB: Store trades offline
    UI->>IDB: Save Sale (UUID + status: 'PENDING')
    UI->>IDB: Decrement Local Stock
    UI-->>UI: Print Receipt Immediately

    Note over SW,SRV: Internet Restored
    SW->>IDB: Read 'PENDING' transactions
    SW->>SRV: Post Batch with Idempotency Keys
    SRV->>DB: Atomic Commit & Verify Sequences
    SRV-->>SW: Batch Acknowledged (syncedAt)
    SW->>IDB: Update status: 'SYNCED'
```

1. **Local Catalog & Draft Store:** All products, categories, active accounts, and prices are cached locally in IndexedDB via Dexie.js.
2. **Offline Checkout:** When offline, POS generates client UUIDs (`idempotencyKey`) and appends transactions to a local `outbox` queue.
3. **Background Sync Worker:** A Service Worker monitors `navigator.onLine` and `window.addEventListener('online')` to sync queued sales when connectivity resumes.
4. **Conflict Resolution:** Sales are idempotent; server rejects duplicate UUIDs while preserving exact timestamps and cash attribution.

### 13.3 03: স্মার্ট সতর্কতা (Smart Alerts: Low Stock, Expiry, Due Dues, FCM)
- **Low Stock Alerts:** Automatically triggers warning badges and notifications when `stockQty <= reorderLevel`.
- **Expiry Date Watcher:** Daily cron alerts managers 7 days before perishable products reach expiration.
- **Customer Due Reminders:** Identifies customers with dues exceeding credit limits or outstanding > 30 days.
- **Notification Channels:** In-app notification center, browser Web Push, and Firebase Cloud Messaging (FCM) to mobile devices.

### 13.4 04: রিপোর্ট ও অন্তর্দৃষ্টি (Visual Decision Intelligence)
- Real-time KPI summary cards: Today's Revenue, Gross Profit, Total Dues, Cash in Hand.
- Predictive reordering recommendations based on 30-day sales velocity.
- Multi-store readiness through unified data aggregation.

---

## 14. Server Actions, API & Service Contracts

| Action / Service | File Location | Responsibility |
| :--- | :--- | :--- |
| `createSaleAction` | `src/actions/sales.ts` | Atomically executes POS sale, packaging deduction, stock out, and revenue posting |
| `voidSaleAction` | `src/actions/sales.ts` | Reverses sale, restores inventory stock, posts void or refund transaction |
| `createPurchaseAction` | `src/actions/purchases.ts` | Records inward purchase GRN, updates weighted average cost, records accounts payable |
| `createOrderAction` | `src/actions/orders.ts` | Registers pre-order, collects advance deposit, issues booking voucher |
| `convertOrderToSaleAction` | `src/actions/orders.ts` | Converts delivered pre-order into confirmed sale invoice and settles balance |
| `recordExpenseAction` | `src/actions/finance.ts` | Logs operational expense with category, account deduction, and cutoff guard |
| `openDayAction` | `src/actions/treasury.ts` | Initializes daily session with morning cash float and difference transfer |
| `closeDayAction` | `src/actions/treasury.ts` | Reconciles counted cash vs system expected, records variance, and advances cutoff |
| `reopenLastDayAction` | `src/actions/treasury.ts` | Restores prior cutoff date and reopens latest session (Owner only) |
| `transferFundsAction` | `src/actions/treasury.ts` | Executes neutral inter-account funds transfer with overdraft check |
| `recordDuePaymentAction` | `src/actions/contacts.ts` | Records customer credit repayment or supplier disbursement and updates ledger |
| `processPayrollAction` | `src/actions/payroll.ts` | Generates monthly salary records and posts disbursement expense |
| `processSalesReturnAction`| `src/actions/returns.ts` | Processes customer return, issues refund, and restocks undamaged goods |
| `syncOfflineBatchAction` | `src/actions/sync.ts` | Ingests offline-queued sales batches with idempotency validation |
| `withDbRetry` | `src/lib/prisma.ts` | Transparent query wrapper handling Neon cold-start retries |

---

## 15. Setup, Environment Configuration & Production Deployment

### 15.1 Environment Configuration (`shop/.env`)

```env
# Neon PostgreSQL Connection URLs
DATABASE_URL="postgresql://[user]:[password]@[neon-pooler-host]/[dbname]?sslmode=require&connect_timeout=30&pool_timeout=30"
DIRECT_URL="postgresql://[user]:[password]@[neon-direct-host]/[dbname]?sslmode=require&connect_timeout=30"

# Application Settings
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://pos.yourdomain.com"
NEXT_PUBLIC_DEFAULT_LOCALE="bn"
NEXT_PUBLIC_TIMEZONE="Asia/Dhaka"

# Session & Security Secrets
SESSION_SECRET="generate-a-secure-random-64-character-hex-string"

# Firebase Cloud Messaging (FCM) Push Notifications
FCM_PROJECT_ID="your-fcm-project-id"
FCM_CLIENT_EMAIL="firebase-adminsdk@your-fcm-project-id.iam.gserviceaccount.com"
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FCM_VAPID_KEY="your-public-vapid-key"
```

### 15.2 Production Build & Deployment Checklist

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply relational migrations to Neon PostgreSQL
npx prisma migrate deploy

# 4. Seed master database (Initial organization, accounts, admin user)
npm run seed

# 5. Build Next.js production bundle with Turbopack
npm run build

# 6. Launch production server
npm start
```

### 15.3 Database Backup & Cold-Start Monitoring
- **Point-in-Time Recovery (PITR):** Enable Neon PITR with a 7-day retention window.
- **Health Check Endpoint:** Configure `/api/health` monitoring to execute `SELECT 1` via `withDbRetry` to ensure database readiness and verify pooler connectivity.
