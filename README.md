# RONVEX — Complete E-Commerce & Affiliate Platform

A modern, production-grade e-commerce and affiliate management web application engineered for the Bangladesh retail market with international expansion readiness.

---

## 1. Key Features

### Public E-Commerce Storefront
- **Direct Catalog & Filterable Shop**: High-definition product showcases, category filtering, search, and sorting.
- **Cash on Delivery (COD) Checkout**: Optimized for all 64 districts of Bangladesh with automatic delivery charge calculation (Inside Dhaka: ৳80, Outside Dhaka: ৳150, Free shipping above ৳3,500).
- **Public Parcel Tracker**: Order ID + recipient phone verification to protect customer privacy and PII.

### Individual Affiliate Storefronts & Tracking
- **Dedicated Storefront URLs**: Scalable `/affiliate/{affiliateSlug}` structure.
- **Custom Affiliate Pricing**: Permitted selling price within admin-defined limits (`adminBasePrice <= sellingPrice <= adminBasePrice + maxAffiliateIncrease`).
- **Attribution Engine**: 30-day first-party attribution tracking preserved through product browsing, cart, and checkout.
- **Immutable Order Snapshots**: Historical pricing, commission amounts, and attribution captured permanently at order creation.

### Affiliate Partner Portal
- **Financial & Order Pipeline Dashboard**: Lifetime gross sales, pending commission, payable balance, and order status counts.
- **Interactive Price Manager**: Base price, permitted range, custom price setter, and live gross margin calculator.
- **Monthly Target & ৳800 Bonus System**: Tracks eligible delivered sales toward the ৳100,000 monthly target in Bangladesh timezone (UTC+6).
- **Weekly Manual Payouts**: Balance validation, withdrawal requests for any positive available balance (no minimum payout threshold) via bKash, Nagad, or Bank Transfer.

### Executive Administration Console
- **Product Inventory & Pricing Authority**: Add/edit products, stock, active state, and maximum affiliate markup limit.
- **Order Fulfillment Workflow**: Status transitions (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), courier assignment, and timeline notes.
- **Affiliate Applications**: Review applicant details, assign public storefront slug, approve, reject, or suspend.
- **Disbursement Ledger**: Record bKash/Nagad/Bank transaction reference codes and mark payouts as `PAID`.
- **Live Automated Test Suite**: Run comprehensive business, pricing, and zero-threshold payout assertions in real time with 1 click.

---

## 2. Technology Stack & Database Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Security**: Hardened Firestore Security Rules (Attribute-Based Access Control, Master Gate, zero-trust RBAC)
- **Image Hosting**: External Image Service abstraction (supporting Cloudinary / ImageKit unsigned upload & URL ingestion without Firebase Storage)

---

## 3. Vercel & Firebase Deployment Instructions

### Deploying the Frontend to Vercel
1. Push this repository to GitHub.
2. In Vercel, click **New Project** and import the repository.
3. Framework Preset: **Vite**.
4. Environment Variables:
   - Provide standard client variables if overriding defaults.
   - The app reads configuration directly from `firebase-applet-config.json`.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

### Deploying Firestore Security Rules & Indexes
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore compound indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
cd functions
npm install
firebase deploy --only functions
```

---

## 4. Test Specifications & Verification

All 20 business logic specifications defined in Section 26 of the platform brief are fully implemented and verified via `/src/tests/businessLogic.test.ts`.

You can run the live test suite anytime by clicking **"Run 20 Business Logic Tests"** in the footer or inside the Admin Console.
