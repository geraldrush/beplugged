# Invoicing System - Architecture & File Organization

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTS (Public)                             │
│  - Scan QR Code on Invoice/Quote                               │
│  - View Invoice: /api/invoice/{invoiceId}                      │
│  - View Quote: /api/quote/{quoteId}                            │
│  - Print or Download PDF                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    (No authentication needed)
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│              CLOUDFLARE WORKERS (Backend API)                    │
│                    src/index.js                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Public Routes (no auth)                                   │ │
│  │  - GET  /api/invoice/{id}                                 │ │
│  │  - GET  /api/quote/{id}                                   │ │
│  │  - POST /api/auth/login                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Admin Routes (requires Bearer token)                      │ │
│  │  - GET    /api/admin/invoices                             │ │
│  │  - POST   /api/admin/invoices (auto-generate QR)          │ │
│  │  - PUT    /api/admin/invoices/{id}                        │ │
│  │  - DELETE /api/admin/invoices/{id}                        │ │
│  │  - GET    /api/admin/quotes                               │ │
│  │  - POST   /api/admin/quotes   (auto-generate QR)          │ │
│  │  - GET    /api/admin/clients                              │ │
│  │  - POST   /api/admin/clients                              │ │
│  │  - GET    /api/admin/dashboard                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    (Uses Bearer token)
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│            CLOUDFLARE D1 DATABASE (SQLite)                       │
│                  src/schema.sql                                   │
│  ┌──────────────┬──────────────┬──────────────┐               │
│  │  invoices    │    quotes    │   clients    │               │
│  │  table       │    table     │   table      │               │
│  └──────────────┴──────────────┴──────────────┘               │
│  ┌──────────────────────┬──────────────────────┐              │
│  │  invoice_items       │  payments            │              │
│  │  (line items)        │  (payment tracking)  │              │
│  └──────────────────────┴──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │
                           │ (Store QR codes as data URLs)
                           │
                    (qrcode library)
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                  ADMIN USERS                                      │
│  - Login: /admin/login.html (password protected)               │
│  - Dashboard: /admin/index.html (Bearer token in localStorage)│
│    - Create invoices
│    - View QR codes
│    - Track status
│    - Manage clients
│    - View statistics
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
d:\beplugged\
│
├── 📄 BUILD_SUMMARY.md           ← START HERE (you are here!)
├── 📄 QUICK_START.md             ← 5-minute setup
├── 📄 INVOICING_SETUP.md         ← Full documentation
├── 📄 FEATURES_AND_CONFIG.md     ← Configuration guide
│
├── 📦 package.json               ← Dependencies (wrangler, qrcode)
├── 📦 wrangler.toml              ← Cloudflare config
├── 📄 .env.example               ← Environment variables template
│
├── 📁 src/                        ← Backend code
│   ├── 📄 index.js               ← Main Worker API (all routes)
│   └── 📄 schema.sql             ← Database tables & schema
│
├── 📁 public/                     ← Frontend files
│   ├── 📁 admin/                 ← Admin panel
│   │   ├── 📄 index.html         ← Dashboard (Dashboard, Invoices, Quotes, Clients)
│   │   └── 📄 login.html         ← Login page
│   │
│   ├── 📁 invoices/              ← Public pages (client-facing)
│   │   ├── 📄 index.html         ← Invoice viewer
│   │   └── 📄 quote.html         ← Quote viewer
│   │
│   ├── css/                       ← Existing styles
│   ├── js/                        ← Existing scripts
│   ├── fonts/                     ← Existing fonts
│   └── img/                       ← Existing images
│
├── mail/
│   └── mail.php                   ← (Future email integration)
│
└── ... (existing website files)
```

---

## 🔄 Data Flow Diagrams

### Creating an Invoice

```
Admin fills form
      ↓
POST /api/admin/invoices
      ↓
Server validates data
      ↓
Generate unique ID (inv_<timestamp>)
      ↓
Generate Invoice Number (INV-2024-123456)
      ↓
Generate QR Code → qrcode library
      ↓
QR Code contains: https://your-worker.workers.dev/api/invoice/{id}
      ↓
Store in D1: invoices table
  - id, invoice_number, client_name, amount, qr_code_url, etc.
      ↓
Return to admin with QR code
      ↓
Admin can now share with client!
```

### Client Views Invoice (Via QR Code)

```
Client scans QR code
      ↓
Opens: /api/invoice/{invoiceId}
      ↓
GET /api/invoice/{invoiceId} (no auth needed)
      ↓
Server finds invoice in D1
      ↓
Updates status: invoice.status = 'viewed'
      ↓
Returns JSON invoice data
      ↓
Browser renders public invoice page
      ↓
Client can:
  - View all details
  - Print (Ctrl+P)
  - Download as PDF
```

### Admin Login Flow

```
Admin enters password
      ↓
POST /api/auth/login { password }
      ↓
Server validates: password === env.ADMIN_PASSWORD
      ↓
If valid: return { token: 'Bearer <password>' }
      ↓
Login page stores token in localStorage
      ↓
Redirects to /admin/ (dashboard)
      ↓
Dashboard reads token from localStorage
      ↓
All API calls include: Authorization: Bearer <token>
      ↓
Server validates token on each request
      ↓
If valid: proceed with operation
      ↓
If invalid: return 401 Unauthorized
```

---

## 🗂️ API Route Map

### Authentication
```
POST   /api/auth/login
       Input:  { password }
       Output: { token }
```

### Admin Invoices (Protected)
```
GET    /api/admin/invoices
       Output: [{ invoice }, ...]

GET    /api/admin/invoices/{id}
       Output: { invoice }

POST   /api/admin/invoices
       Input:  { client_name, client_email, amount, tax, items, notes, ... }
       Output: { id, invoice_number, qr_code_url }

PUT    /api/admin/invoices/{id}
       Input:  { client_name, client_email, amount, ... }
       Output: { success: true }

DELETE /api/admin/invoices/{id}
       Output: { success: true } (or error if not draft)
```

### Admin Quotes (Protected)
```
GET    /api/admin/quotes
       Output: [{ quote }, ...]

GET    /api/admin/quotes/{id}
       Output: { quote }

POST   /api/admin/quotes
       Input:  { client_name, client_email, amount, tax, items, ... }
       Output: { id, quote_number, qr_code_url }

PUT    /api/admin/quotes/{id}
       Input:  { client_name, client_email, amount, ... }
       Output: { success: true }

DELETE /api/admin/quotes/{id}
       Output: { success: true }
```

### Admin Clients (Protected)
```
GET    /api/admin/clients
       Output: [{ client }, ...]

POST   /api/admin/clients
       Input:  { name, email, phone, address, ... }
       Output: { id, ... }
```

### Admin Dashboard (Protected)
```
GET    /api/admin/dashboard
       Output: {
         total_invoices: 5,
         total_quotes: 3,
         total_revenue: 1500.00,
         pending_invoices: 2
       }
```

### Public Invoice View (No Auth)
```
GET    /api/invoice/{id}
       Output: { invoice_data }
       Side effect: Marks invoice as 'viewed'
```

### Public Quote View (No Auth)
```
GET    /api/quote/{id}
       Output: { quote_data }
       Side effect: Marks quote as 'viewed'
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────┐
│          UNAUTHENTICATED REQUEST                 │
│  GET /api/admin/invoices                         │
│  (No Authorization header)                       │
└─────────────────────────────────────────────────┘
                      ↓
           ❌ REJECTED (401 Unauthorized)
                      ↓
┌─────────────────────────────────────────────────┐
│        AUTHENTICATED REQUEST (Method 1)          │
│  POST /api/auth/login { password: "foo" }       │
│  ✅ Server validates password                    │
│  ← Returns { token: "Bearer foo" }              │
│                                                   │
│  Then store token in localStorage:              │
│  localStorage.setItem('authToken', token)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        AUTHENTICATED REQUEST (Method 2)          │
│  GET /api/admin/invoices                         │
│  Authorization: Bearer foo                       │
│  ✅ Server validates token == ADMIN_PASSWORD    │
│  ← Request proceeds                             │
└─────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Overview

### Core Tables

```
invoices
├── id (TEXT PRIMARY KEY)
├── invoice_number (TEXT UNIQUE)
├── client_name, client_email, client_address
├── amount, tax (REAL)
├── status (TEXT: draft|sent|viewed|paid)
├── created_at, due_date
├── payment_terms, items (JSON), notes
└── qr_code_url (Data URL)

quotes
├── id (TEXT PRIMARY KEY)
├── quote_number (TEXT UNIQUE)
├── client_name, client_email, client_address
├── amount, tax (REAL)
├── status (TEXT: draft|sent|viewed|accepted|rejected)
├── created_at, expiry_date
├── items (JSON), notes
└── qr_code_url (Data URL)

clients
├── id (TEXT PRIMARY KEY)
├── name (TEXT)
├── email (TEXT UNIQUE)
├── phone, address, city, state, postal_code, country
└── created_at

invoice_items
├── id (TEXT PRIMARY KEY)
├── invoice_id (FOREIGN KEY)
├── description, quantity, rate, amount
└── FOREIGN KEY references invoices(id)

payments
├── id (TEXT PRIMARY KEY)
├── invoice_id (FOREIGN KEY)
├── amount, payment_date
├── payment_method, notes
├── created_at
└── FOREIGN KEY references invoices(id)
```

---

## 🎯 Key Features Map

```
Feature                      Location            Technology
────────────────────────────────────────────────────────────
QR Code Generation          src/index.js        qrcode library
API Backend                 src/index.js        Cloudflare Workers
Database                    D1 (automatic)      SQLite
Authentication              src/index.js        Bearer token
Admin Dashboard            public/admin/        HTML + jQuery
Invoice Viewer             public/invoices/     HTML (pure JS)
Responsive Design          public/ (all)        CSS + Bootstrap
Status Tracking            src/schema.sql       Database triggers
```

---

## 🚀 Deployment Pipeline

```
Local Development
├── npm install
├── wrangler d1 create invoicing
├── npm run dev
└── Test locally at localhost:8787

                    ↓

Configuration
├── wrangler.toml (add database_id)
├── npx wrangler secret put ADMIN_PASSWORD
└── wrangler d1 execute invoicing --file src/schema.sql

                    ↓

Production Deployment
├── npm run deploy
└── Live at https://YOUR_WORKER_NAME.workers.dev

                    ↓

Usage
├── Admin: https://YOUR_WORKER_NAME.workers.dev/admin/login.html
├── Public: https://YOUR_WORKER_NAME.workers.dev/api/invoice/{id}
└── Clients scan QR codes!
```

---

## 📱 Responsive Breakpoints

All pages adapt to:
- 📱 Mobile: < 768px
- 💻 Tablet: 768px - 1024px  
- 🖥️ Desktop: > 1024px

---

## 🔗 File Dependencies

```
src/index.js
├── Depends: wrangler (imported automatically)
├── Depends: qrcode (npm package)
└── Uses: D1 database binding (env.DB)

public/admin/index.html
├── Links: /css/bootstrap.min.css
├── Links: /css/font-awesome.min.css
├── Links: /js/jquery.min.js
└── Calls: /api/admin/* endpoints

public/invoices/index.html
├── Links: /css/bootstrap.min.css
├── Links: /css/font-awesome.min.css
└── Calls: /api/invoice/{id} endpoint
```

---

**Your invoicing system is fully integrated and ready to deploy!**

Start with QUICK_START.md for step-by-step instructions.
