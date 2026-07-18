import QRCode from "qrcode";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const INVOICE_STATUSES = new Set([
  "draft",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
]);
const QUOTE_STATUSES = new Set([
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "converted_to_invoice",
]);

class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = getCorsHeaders(request);
    const jsonHeaders = {
      ...corsHeaders,
      ...getSecurityHeaders(),
      "Content-Type": "application/json",
    };

    const preflightHeaders = {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: preflightHeaders });
    }

    try {
      if (path.startsWith("/api/admin/")) {
        const token = request.headers.get("Authorization");
        if (!(await isValidToken(token, env))) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: jsonHeaders,
          });
        }
      }

      if (path === "/api/auth/login" && method === "POST") {
        return await handleLogin(request, env);
      }

      if (path === "/api/admin/dashboard" && method === "GET") {
        return await handleDashboardStats(env);
      }

      if (path === "/api/admin/analytics" && method === "GET") {
        return await handleAnalytics(env);
      }

      if (path.startsWith("/api/admin/invoices")) {
        return await handleInvoices(request, env, path, method);
      }

      if (path.startsWith("/api/admin/quotes")) {
        return await handleQuotes(request, env, path, method);
      }

      if (path.startsWith("/api/admin/clients")) {
        return await handleClients(request, env, path, method);
      }

      if (path.startsWith("/api/admin/receipts")) {
        return await handleReceipts(env);
      }

      if (path.startsWith("/api/invoice/")) {
        const invoiceId = path.split("/")[3];
        return await handlePublicInvoiceView(invoiceId, env);
      }

      if (path.startsWith("/api/quote/")) {
        const quoteId = path.split("/")[3];
        return await handlePublicQuoteView(quoteId, env);
      }

      if (path.startsWith("/api/receipt/")) {
        const paymentId = path.split("/")[3];
        return await handlePublicReceiptView(paymentId, env);
      }

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: jsonHeaders,
      });
    } catch (error) {
      const status = error.status || 500;
      if (status >= 500) {
        console.error("Error:", error);
      }
      return new Response(
        JSON.stringify({
          error: status >= 500 ? "Internal server error" : error.message,
        }),
        {
          status,
          headers: jsonHeaders,
        },
      );
    }
  },
};

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const requestOrigin = new URL(request.url).origin;
  const headers = {
    Vary: "Origin",
  };
  if (origin === requestOrigin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function getSecurityHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...getSecurityHeaders(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function base64UrlEncodeString(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeString(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return base64UrlEncodeString(binary);
}

async function hmacSha256(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function safeCompareText(provided, expected) {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided || "")),
    crypto.subtle.digest("SHA-256", encoder.encode(expected || "")),
  ]);
  const providedBytes = new Uint8Array(providedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let difference = 0;
  for (let i = 0; i < expectedBytes.length; i += 1) {
    difference |= providedBytes[i] ^ expectedBytes[i];
  }
  return difference === 0;
}

function getSessionSecret(env) {
  return env.SESSION_SECRET || env.ADMIN_PASSWORD;
}

async function createSessionToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncodeString(
    JSON.stringify({
      sub: "admin",
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
      nonce: crypto.randomUUID(),
    }),
  );
  const signature = await hmacSha256(payload, getSessionSecret(env));
  return {
    token: `Bearer ${payload}.${signature}`,
    expires_at: new Date((now + SESSION_TTL_SECONDS) * 1000).toISOString(),
  };
}

async function isValidToken(token, env) {
  if (!token || !getSessionSecret(env)) return false;
  const [scheme, credentials] = token.split(" ");
  if (scheme !== "Bearer" || !credentials) return false;
  const [payload, signature] = credentials.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = await hmacSha256(payload, getSessionSecret(env));
  if (!(await safeCompareText(signature, expectedSignature))) {
    return false;
  }

  try {
    const claims = JSON.parse(base64UrlDecodeString(payload));
    const now = Math.floor(Date.now() / 1000);
    return (
      claims.sub === "admin" &&
      Number.isFinite(claims.exp) &&
      claims.exp > now &&
      Number.isFinite(claims.iat) &&
      claims.iat <= now + 60
    );
  } catch {
    return false;
  }
}

function createEntityId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function generateDocumentNumber(prefix) {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = crypto.randomUUID().split("-")[0].toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}

function trimText(value, field, { required = false, maxLength = 500 } = {}) {
  const text = String(value || "").trim();
  if (required && !text) {
    throw new RequestError(`${field} is required`);
  }
  if (text.length > maxLength) {
    throw new RequestError(`${field} is too long`);
  }
  return text;
}

function validateEmail(value, field = "Email") {
  const email = trimText(value, field, { required: true, maxLength: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestError(`${field} is invalid`);
  }
  return email;
}

function amountToCents(value, field, { allowZero = true } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RequestError(`${field} must be a valid non-negative amount`);
  }
  const cents = Math.round(number * 100);
  if (!allowZero && cents <= 0) {
    throw new RequestError(`${field} must be greater than zero`);
  }
  return cents;
}

function centsToAmount(cents) {
  return Number((cents / 100).toFixed(2));
}

function normalizeLineItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new RequestError("At least one line item is required");
  }
  if (rawItems.length > 100) {
    throw new RequestError("Too many line items");
  }

  return rawItems.map((item, index) => {
    const description = trimText(item?.description, `Item ${index + 1} description`, {
      required: true,
      maxLength: 500,
    });
    const quantity = Number(item?.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) {
      throw new RequestError(`Item ${index + 1} quantity must be greater than zero`);
    }
    const rateCents = amountToCents(item?.rate, `Item ${index + 1} rate`);
    const discountCents = amountToCents(
      item?.discount || 0,
      `Item ${index + 1} discount`,
    );
    const grossCents = Math.round(quantity * rateCents);
    if (discountCents > grossCents) {
      throw new RequestError(
        `Item ${index + 1} discount cannot exceed the line amount`,
      );
    }
    return {
      description,
      quantity: Number(quantity.toFixed(4)),
      rate: centsToAmount(rateCents),
      discount: centsToAmount(discountCents),
    };
  });
}

function lineTotalCents(item) {
  return Math.max(
    Math.round(Number(item.quantity || 0) * amountToCents(item.rate || 0, "Rate")) -
      amountToCents(item.discount || 0, "Discount"),
    0,
  );
}

function calculateItemsTotalCents(items) {
  return items.reduce((total, item) => total + lineTotalCents(item), 0);
}

function normalizeInvoicePayload(data) {
  const items = normalizeLineItems(data.items);
  const amountCents = calculateItemsTotalCents(items);
  const taxCents = amountToCents(data.tax || 0, "Tax");
  return {
    client_name: trimText(data.client_name, "Client name", {
      required: true,
      maxLength: 200,
    }),
    client_email: validateEmail(data.client_email, "Client email"),
    client_address: trimText(data.client_address, "Client address", {
      maxLength: 1000,
    }),
    amount: centsToAmount(amountCents),
    amount_cents: amountCents,
    tax: centsToAmount(taxCents),
    tax_cents: taxCents,
    due_date: trimText(data.due_date, "Due date", { maxLength: 30 }) || null,
    payment_terms: trimText(data.payment_terms, "Banking info", {
      maxLength: 2000,
    }),
    notes: trimText(data.notes, "Notes", { maxLength: 2000 }),
    items,
  };
}

function normalizeQuotePayload(data) {
  const items = Array.isArray(data.items) && data.items.length
    ? normalizeLineItems(data.items)
    : [];
  const amountCents = items.length
    ? calculateItemsTotalCents(items)
    : amountToCents(data.amount, "Amount", { allowZero: false });
  const taxCents = amountToCents(data.tax || 0, "Tax");
  return {
    client_name: trimText(data.client_name, "Client name", {
      required: true,
      maxLength: 200,
    }),
    client_email: validateEmail(data.client_email, "Client email"),
    client_address: trimText(data.client_address, "Client address", {
      maxLength: 1000,
    }),
    amount: centsToAmount(amountCents),
    amount_cents: amountCents,
    tax: centsToAmount(taxCents),
    tax_cents: taxCents,
    expiry_date: trimText(data.expiry_date, "Expiry date", { maxLength: 30 }) || null,
    notes: trimText(data.notes, "Notes", { maxLength: 2000 }),
    items,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlWithBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

// Schema setup is idempotent but involves several DDL/PRAGMA round-trips, so we
// run it at most once per isolate. The promise is cached; a failure clears it
// so the next request retries.
let schemaReadyPromise = null;

function ensureSchema(env) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = runSchemaSetup(env).catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }
  return schemaReadyPromise;
}

// Backwards-compatible aliases so existing call sites keep working; both now
// route through the memoized setup above.
function ensureOperationalSchema(env) {
  return ensureSchema(env);
}

function ensurePaymentsTable(env) {
  return ensureSchema(env);
}

async function runSchemaSetup(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      payment_date DATE,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_number TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at)",
  ).run();
  await ensureColumn(env, "invoices", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "invoices", "tax_cents", "tax_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "quotes", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "quotes", "tax_cents", "tax_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "payments", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
}

async function ensureColumn(env, tableName, columnName, columnDefinition) {
  const allowedTables = new Set(["invoices", "quotes", "payments"]);
  if (!allowedTables.has(tableName)) {
    throw new Error("Invalid schema table");
  }
  const columns = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!(columns.results || []).length) {
    return;
  }
  if ((columns.results || []).some((column) => column.name === columnName)) {
    return;
  }
  try {
    await env.DB.prepare(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`,
    ).run();
  } catch (error) {
    if (!/duplicate column/i.test(String(error?.message || ""))) {
      throw error;
    }
  }
}

async function recordAudit(env, entry) {
  await ensureOperationalSchema(env);
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, entity_number, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      createEntityId("audit"),
      entry.actor || "admin",
      entry.action,
      entry.entity_type,
      entry.entity_id,
      entry.entity_number || "",
      JSON.stringify(entry.details || {}),
    )
    .run();
}

function assertValidInvoiceStatus(status) {
  if (!INVOICE_STATUSES.has(status)) {
    throw new RequestError("Invalid invoice status");
  }
}

function assertValidQuoteStatus(status) {
  if (!QUOTE_STATUSES.has(status)) {
    throw new RequestError("Invalid quote status");
  }
}

async function requireInvoice(env, invoiceId) {
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(invoiceId)
    .first();
  if (!invoice) {
    throw new RequestError("Invoice not found", 404);
  }
  assertValidInvoiceStatus(invoice.status || "draft");
  return invoice;
}

async function requireQuote(env, quoteId) {
  const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
    .bind(quoteId)
    .first();
  if (!quote) {
    throw new RequestError("Quote not found", 404);
  }
  assertValidQuoteStatus(quote.status || "draft");
  return quote;
}

function invoicePublicUrl(request, invoiceId) {
  return `${new URL(request.url).origin}/invoices/index.html?id=${encodeURIComponent(
    invoiceId,
  )}`;
}

function quotePublicUrl(request, quoteId) {
  return `${new URL(request.url).origin}/invoices/quote.html?id=${encodeURIComponent(
    quoteId,
  )}`;
}

async function issueInvoice(env, request, invoice, actor = "admin") {
  if (invoice.status !== "draft") {
    return {
      ...invoice,
      public_url: invoicePublicUrl(request, invoice.id),
    };
  }

  await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
    .bind("sent", invoice.id)
    .run();
  await recordAudit(env, {
    actor,
    action: "issued",
    entity_type: "invoice",
    entity_id: invoice.id,
    entity_number: invoice.invoice_number,
  });

  return {
    ...invoice,
    status: "sent",
    public_url: invoicePublicUrl(request, invoice.id),
  };
}

async function issueQuote(env, request, quote, actor = "admin") {
  if (quote.status !== "draft") {
    return {
      ...quote,
      public_url: quotePublicUrl(request, quote.id),
    };
  }

  await env.DB.prepare("UPDATE quotes SET status = ? WHERE id = ?")
    .bind("sent", quote.id)
    .run();
  await recordAudit(env, {
    actor,
    action: "issued",
    entity_type: "quote",
    entity_id: quote.id,
    entity_number: quote.quote_number,
  });

  return {
    ...quote,
    status: "sent",
    public_url: quotePublicUrl(request, quote.id),
  };
}

async function parseRequestJson(request) {
  try {
    return await request.json();
  } catch {
    throw new RequestError("Invalid JSON body");
  }
}

async function parseOptionalJson(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function getInvoiceBalanceCents(env, invoice) {
  const amountCents = persistedCents(invoice, "amount_cents", "amount", "Invoice amount");
  const taxCents = persistedCents(invoice, "tax_cents", "tax", "Invoice tax");
  const totalCents = amountCents + taxCents;
  const paidRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(
      CASE
        WHEN amount_cents IS NOT NULL AND (amount_cents != 0 OR amount = 0)
          THEN amount_cents
        ELSE ROUND(amount * 100)
      END
    ), 0) as paid_cents FROM payments WHERE invoice_id = ?`,
  )
    .bind(invoice.id)
    .first();
  const paidCents = Number(paidRow?.paid_cents || 0);
  return {
    totalCents,
    paidCents,
    balanceCents: Math.max(totalCents - paidCents, 0),
  };
}

function persistedCents(row, centsField, amountField, fieldLabel) {
  const cents = Number(row?.[centsField]);
  const amount = Number(row?.[amountField] || 0);
  if (Number.isFinite(cents) && (cents !== 0 || amount === 0)) {
    return cents;
  }
  return amountToCents(amount, fieldLabel);
}

function paymentReceiptNumber(payment) {
  const year = new Date(payment.created_at || Date.now()).getFullYear();
  const compactId = String(payment.id || "")
    .replace(/^pay_/, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 10)
    .toUpperCase();
  return `RCPT-${year}-${compactId || "0000000000"}`;
}

async function getPayment(env, invoiceId, paymentId) {
  const payment = await env.DB.prepare(
    "SELECT * FROM payments WHERE id = ? AND invoice_id = ?",
  )
    .bind(paymentId, invoiceId)
    .first();
  if (!payment) {
    throw new RequestError("Payment not found", 404);
  }
  return payment;
}

function assertIssuedInvoice(invoice) {
  if ((invoice.status || "draft") === "draft") {
    throw new RequestError("Issue the invoice before recording payments", 409);
  }
}

function parseStoredItems(value) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

function getDefaultBankingInfo(invoiceNumber) {
  return [
    "Bank: FNB",
    "Account Name: Gerald Rushwaya",
    "Account No: 63125701268",
    "Branch Code: 250655",
    `Reference: Invoice #${invoiceNumber}`,
  ].join("<br>");
}

function formatMoney(value) {
  const number = Number(value || 0);
  const parts = number.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${parts[0]}.${parts[1]}`;
}

async function generateQrCodeDataUrl(text) {
  const svg = await QRCode.toString(text, { type: "svg" });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function handleLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }
  const { password } = await parseRequestJson(request);
  if (await safeCompareText(String(password || ""), env.ADMIN_PASSWORD)) {
    return json(await createSessionToken(env));
  }
  return json({ error: "Invalid password" }, { status: 401 });
}

async function handleInvoices(request, env, path, method) {
  await ensureOperationalSchema(env);
  const segments = path.split("/");
  const invoiceId = segments[4];
  const action = segments[5];

  if (invoiceId && action === "payments") {
    const paymentId = segments[6];
    return handleInvoicePayments(request, env, invoiceId, paymentId, method);
  }

  if (method === "GET" && !invoiceId) {
    const result = await env.DB.prepare(
      "SELECT id, invoice_number, client_name, client_email, client_address, amount, tax, status, created_at, due_date FROM invoices ORDER BY created_at DESC LIMIT 100",
    ).all();
    return json(result.results);
  }

  if (method === "GET" && invoiceId) {
    const result = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
      .bind(invoiceId)
      .first();
    if (!result) {
      return json({ error: "Not found" }, { status: 404 });
    }
    const { total, paid, balance } = await getInvoiceBalance(env, result);
    return json({
      ...result,
      total_due: total,
      total_paid: paid,
      balance_due: balance,
    });
  }

  if (method === "POST" && invoiceId && action === "issue") {
    const invoice = await requireInvoice(env, invoiceId);
    const issued = await issueInvoice(env, request, invoice);
    return json({
      success: true,
      status: issued.status,
      public_url: issued.public_url,
    });
  }

  if (method === "POST" && invoiceId && action === "send") {
    return handleSendInvoice(request, env, invoiceId);
  }

  if (method === "POST" && !invoiceId) {
    const data = normalizeInvoicePayload(await parseRequestJson(request));
    const id = createEntityId("inv");
    const invoiceNumber = generateDocumentNumber("INV");

    const qrUrl = invoicePublicUrl(request, id);
    const qrCode = await generateQrCodeDataUrl(qrUrl);

    await env.DB.prepare(
      `INSERT INTO invoices (id, invoice_number, client_name, client_email, client_address, amount, amount_cents, tax, tax_cents, status, due_date, payment_terms, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        invoiceNumber,
        data.client_name,
        data.client_email,
        data.client_address,
        data.amount,
        data.amount_cents,
        data.tax,
        data.tax_cents,
        "draft",
        data.due_date,
        data.payment_terms,
        JSON.stringify(data.items),
        data.notes,
        qrCode,
      )
      .run();

    await recordAudit(env, {
      action: "created",
      entity_type: "invoice",
      entity_id: id,
      entity_number: invoiceNumber,
      details: { amount: data.amount, tax: data.tax },
    });

    return json({ id, invoiceNumber, qr_code_url: qrCode }, { status: 201 });
  }

  if (method === "PUT" && invoiceId) {
    const invoice = await requireInvoice(env, invoiceId);
    if (invoice.status !== "draft") {
      throw new RequestError("Issued invoices cannot be edited", 409);
    }

    const data = normalizeInvoicePayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE invoices SET client_name = ?, client_email = ?, client_address = ?, amount = ?, amount_cents = ?, tax = ?, tax_cents = ?, status = ?, items = ?, notes = ?, due_date = ?, payment_terms = ? WHERE id = ?`,
    )
      .bind(
        data.client_name,
        data.client_email,
        data.client_address,
        data.amount,
        data.amount_cents,
        data.tax,
        data.tax_cents,
        "draft",
        JSON.stringify(data.items),
        data.notes,
        data.due_date,
        data.payment_terms,
        invoiceId,
      )
      .run();

    await recordAudit(env, {
      action: "updated",
      entity_type: "invoice",
      entity_id: invoiceId,
      entity_number: invoice.invoice_number,
      details: { amount: data.amount, tax: data.tax },
    });

    return json({ success: true });
  }

  if (method === "DELETE" && invoiceId) {
    const invoice = await requireInvoice(env, invoiceId);
    if (invoice.status !== "draft") {
      throw new RequestError("Only draft invoices can be deleted", 409);
    }
    const paymentCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM payments WHERE invoice_id = ?",
    )
      .bind(invoiceId)
      .first();
    if (Number(paymentCount?.count || 0) > 0) {
      throw new RequestError("Invoices with payments cannot be deleted", 409);
    }

    await env.DB.prepare("DELETE FROM invoices WHERE id = ?")
      .bind(invoiceId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "invoice",
      entity_id: invoiceId,
      entity_number: invoice.invoice_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleSendInvoice(request, env, invoiceId) {
  await ensureOperationalSchema(env);
  if (!env.BREVO_API_KEY) {
    return json({ error: "Missing BREVO_API_KEY secret" }, { status: 500 });
  }
  if (!env.BREVO_SENDER_EMAIL) {
    return json({ error: "Missing BREVO_SENDER_EMAIL variable" }, { status: 500 });
  }

  const invoice = await requireInvoice(env, invoiceId);

  if (invoice.status === "paid") {
    throw new RequestError("Paid invoices do not need to be sent", 409);
  }

  const body = await parseOptionalJson(request);
  const customMessage = body?.message ? trimText(body.message, "Message", { maxLength: 2000 }) : "";
  const invoiceUrl = invoicePublicUrl(request, invoice.id);

  const items = parseStoredItems(invoice.items);
  const itemsRows = items.length
    ? items
        .map((item) => {
          const quantity = Number(item.quantity || 1);
          const rate = Number(item.rate || 0);
          const discount = Number(item.discount || 0);
          const lineTotal = Math.max(quantity * rate - discount, 0);
          return `<tr>
            <td>${escapeHtml(item.description || "Item")}</td>
            <td style="text-align:center;">${escapeHtml(quantity)}</td>
            <td style="text-align:right;">${formatMoney(rate)}</td>
            <td style="text-align:right;">${formatMoney(discount)}</td>
            <td style="text-align:right;">${formatMoney(lineTotal)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5">Services Rendered</td></tr>`;

  const bankingInfo = invoice.payment_terms
    ? escapeHtmlWithBreaks(
        invoice.payment_terms.replace(/\#\[invoice_number\]/g, invoice.invoice_number),
      )
    : getDefaultBankingInfo(invoice.invoice_number);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #2C2D3F;">
      <h2 style="color:#F05023; margin-bottom: 0;">Invoice ${escapeHtml(invoice.invoice_number)}</h2>
      <p>Hi ${escapeHtml(invoice.client_name || "there")},</p>
      <p>Your invoice is ready. You can view and download it here:</p>
      <p><a href="${escapeHtml(invoiceUrl)}">${escapeHtml(invoiceUrl)}</a></p>
      ${customMessage ? `<p>${escapeHtml(customMessage)}</p>` : ""}
      <h3 style="margin-top: 20px;">Invoice Summary</h3>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <thead style="background:#FFF5F1;">
          <tr>
            <th align="left">Description</th>
            <th align="center">Qty</th>
            <th align="right">Rate</th>
            <th align="right">Discount</th>
            <th align="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <p style="margin-top: 12px;"><strong>Total Due:</strong> ${formatMoney(
        Number(invoice.amount || 0) + Number(invoice.tax || 0),
      )}</p>
      <h3 style="margin-top: 20px;">Banking Details</h3>
      <p>${bankingInfo}</p>
    </div>
  `;

  const payload = {
    sender: {
      name: env.BREVO_SENDER_NAME || "Beplugged Tech",
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: invoice.client_email, name: invoice.client_name || "" }],
    subject: `Invoice ${invoice.invoice_number} from Beplugged Tech`,
    htmlContent,
  };

  if (env.BREVO_REPLY_TO) {
    payload.replyTo = {
      email: env.BREVO_REPLY_TO,
      name: env.BREVO_SENDER_NAME || "Beplugged Tech",
    };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return json(
      { error: "Brevo send failed", details: errorText },
      { status: 502 },
    );
  }

  const issuedInvoice = await issueInvoice(env, request, invoice);
  await recordAudit(env, {
    action: "sent",
    entity_type: "invoice",
    entity_id: invoice.id,
    entity_number: invoice.invoice_number,
    details: { recipient: invoice.client_email },
  });

  const result = await response.json().catch(() => ({}));
  return json({
    success: true,
    result,
    status: issuedInvoice.status,
    public_url: issuedInvoice.public_url,
  });
}

function receiptNumberFor(payment) {
  return paymentReceiptNumber(payment);
}

async function getInvoiceBalance(env, invoice) {
  const { totalCents, paidCents, balanceCents } = await getInvoiceBalanceCents(
    env,
    invoice,
  );
  return {
    total: centsToAmount(totalCents),
    paid: centsToAmount(paidCents),
    balance: centsToAmount(balanceCents),
  };
}

async function reconcileInvoiceStatus(env, invoice) {
  const { totalCents, paidCents, balanceCents } = await getInvoiceBalanceCents(
    env,
    invoice,
  );
  let status = invoice.status;
  if (totalCents > 0 && balanceCents <= 0) {
    status = "paid";
  } else if (paidCents > 0) {
    status = "partially_paid";
  } else if (invoice.status === "paid" || invoice.status === "partially_paid") {
    status = "sent";
  }
  if (status !== invoice.status) {
    await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
      .bind(status, invoice.id)
      .run();
  }
  return {
    status,
    total: centsToAmount(totalCents),
    paid: centsToAmount(paidCents),
    balance: centsToAmount(balanceCents),
  };
}

async function handleInvoicePayments(request, env, invoiceId, paymentId, method) {
  await ensurePaymentsTable(env);
  const invoice = await requireInvoice(env, invoiceId);

  if (method === "GET") {
    const result = await env.DB.prepare(
      "SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC",
    )
      .bind(invoiceId)
      .all();
    const payments = (result.results || []).map((p) => ({
      ...p,
      receipt_number: receiptNumberFor(p),
    }));
    const { total, paid, balance } = await getInvoiceBalance(env, invoice);
    return json({ payments, total, paid, balance });
  }

  if (method === "POST") {
    assertIssuedInvoice(invoice);
    const data = await parseRequestJson(request);
    const amountCents = amountToCents(data.amount, "Payment amount", {
      allowZero: false,
    });
    const { balanceCents } = await getInvoiceBalanceCents(env, invoice);
    if (amountCents > balanceCents) {
      throw new RequestError("Payment amount cannot exceed the balance due");
    }

    const id = createEntityId("pay");
    await env.DB.prepare(
      `INSERT INTO payments (id, invoice_id, amount, amount_cents, payment_date, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        invoiceId,
        centsToAmount(amountCents),
        amountCents,
        trimText(data.payment_date, "Payment date", { maxLength: 30 }) ||
          new Date().toISOString().slice(0, 10),
        trimText(data.payment_method, "Payment method", { maxLength: 100 }),
        trimText(data.notes, "Payment notes", { maxLength: 1000 }),
      )
      .run();

    const { status, total, paid, balance } = await reconcileInvoiceStatus(
      env,
      invoice,
    );
    const payment = await env.DB.prepare("SELECT * FROM payments WHERE id = ?")
      .bind(id)
      .first();
    await recordAudit(env, {
      action: "payment_recorded",
      entity_type: "invoice",
      entity_id: invoice.id,
      entity_number: invoice.invoice_number,
      details: {
        payment_id: id,
        amount: centsToAmount(amountCents),
        payment_method: data.payment_method || "",
      },
    });

    return json(
      {
        success: true,
        payment: { ...payment, receipt_number: receiptNumberFor(payment) },
        status,
        total,
        paid,
        balance,
      },
      { status: 201 },
    );
  }

  if (method === "DELETE" && paymentId) {
    const payment = await getPayment(env, invoiceId, paymentId);
    await env.DB.prepare(
      "DELETE FROM payments WHERE id = ? AND invoice_id = ?",
    )
      .bind(paymentId, invoiceId)
      .run();
    const { status, total, paid, balance } = await reconcileInvoiceStatus(
      env,
      invoice,
    );
    await recordAudit(env, {
      action: "payment_deleted",
      entity_type: "invoice",
      entity_id: invoice.id,
      entity_number: invoice.invoice_number,
      details: {
        payment_id: paymentId,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || "",
      },
    });
    return json({ success: true, status, total, paid, balance });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handlePublicReceiptView(paymentId, env) {
  await ensurePaymentsTable(env);

  const payment = await env.DB.prepare("SELECT * FROM payments WHERE id = ?")
    .bind(paymentId)
    .first();
  if (!payment) {
    return json({ error: "Receipt not found" }, { status: 404 });
  }

  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(payment.invoice_id)
    .first();
  const balance = invoice
    ? await getInvoiceBalance(env, invoice)
    : { total: 0, paid: 0, balance: 0 };

  return json({
      ...payment,
      receipt_number: receiptNumberFor(payment),
      invoice: invoice
        ? {
            invoice_number: invoice.invoice_number,
            client_name: invoice.client_name,
            client_email: invoice.client_email,
            client_address: invoice.client_address,
            payment_terms: invoice.payment_terms,
            qr_code_url: invoice.qr_code_url,
          }
        : null,
      invoice_total: balance.total,
      total_paid: balance.paid,
      balance_due: balance.balance,
    });
}

async function handleReceipts(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT p.id, p.invoice_id, p.amount, p.amount_cents, p.payment_date,
            p.payment_method, p.notes, p.created_at,
            i.invoice_number, i.client_name, i.client_email
     FROM payments p
     LEFT JOIN invoices i ON i.id = p.invoice_id
     ORDER BY p.created_at DESC
     LIMIT 200`,
  ).all();
  const receipts = (result.results || []).map((payment) => ({
    ...payment,
    amount: centsToAmount(
      persistedCents(payment, "amount_cents", "amount", "Payment amount"),
    ),
    receipt_number: receiptNumberFor(payment),
  }));
  return json(receipts);
}

async function handleQuotes(request, env, path, method) {
  await ensureOperationalSchema(env);
  const segments = path.split("/");
  const quoteId = segments[4];
  const action = segments[5];

  if (method === "GET" && !quoteId) {
    const result = await env.DB.prepare(
      "SELECT id, quote_number, client_name, client_email, client_address, amount, tax, status, created_at, expiry_date FROM quotes ORDER BY created_at DESC LIMIT 100",
    ).all();
    return json(result.results);
  }

  if (method === "GET" && quoteId) {
    const result = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
      .bind(quoteId)
      .first();
    return json(result || { error: "Not found" }, result ? {} : { status: 404 });
  }

  if (method === "POST" && quoteId && action === "issue") {
    const quote = await requireQuote(env, quoteId);
    const issued = await issueQuote(env, request, quote);
    return json({
      success: true,
      status: issued.status,
      public_url: issued.public_url,
    });
  }

  if (method === "POST" && !quoteId) {
    const data = normalizeQuotePayload(await parseRequestJson(request));
    const id = createEntityId("quote");
    const quoteNumber = generateDocumentNumber("QUOTE");

    const qrUrl = quotePublicUrl(request, id);
    const qrCode = await generateQrCodeDataUrl(qrUrl);

    await env.DB.prepare(
      `INSERT INTO quotes (id, quote_number, client_name, client_email, client_address, amount, amount_cents, tax, tax_cents, status, expiry_date, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        quoteNumber,
        data.client_name,
        data.client_email,
        data.client_address,
        data.amount,
        data.amount_cents,
        data.tax,
        data.tax_cents,
        "draft",
        data.expiry_date,
        JSON.stringify(data.items),
        data.notes,
        qrCode,
      )
      .run();

    await recordAudit(env, {
      action: "created",
      entity_type: "quote",
      entity_id: id,
      entity_number: quoteNumber,
      details: { amount: data.amount, tax: data.tax },
    });

    return json({ id, quoteNumber, qr_code_url: qrCode }, { status: 201 });
  }

  if (method === "PUT" && quoteId) {
    const existing = await requireQuote(env, quoteId);
    if (existing.status !== "draft") {
      throw new RequestError("Issued quotes cannot be edited", 409);
    }
    const raw = await parseRequestJson(request);
    const data = normalizeQuotePayload(raw);
    await env.DB.prepare(
      `UPDATE quotes SET client_name = ?, client_email = ?, client_address = ?, amount = ?, amount_cents = ?, tax = ?, tax_cents = ?, status = ?, items = ?, notes = ?, expiry_date = ? WHERE id = ?`,
    )
      .bind(
        data.client_name,
        data.client_email,
        data.client_address,
        data.amount,
        data.amount_cents,
        data.tax,
        data.tax_cents,
        "draft",
        JSON.stringify(data.items),
        data.notes,
        data.expiry_date,
        quoteId,
      )
      .run();

    await recordAudit(env, {
      action: "updated",
      entity_type: "quote",
      entity_id: quoteId,
      entity_number: existing.quote_number,
      details: { amount: data.amount, tax: data.tax },
    });

    return json({ success: true });
  }

  if (method === "DELETE" && quoteId) {
    const existing = await requireQuote(env, quoteId);
    if (existing.status !== "draft") {
      throw new RequestError("Only draft quotes can be deleted", 409);
    }
    await env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(quoteId).run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "quote",
      entity_id: quoteId,
      entity_number: existing.quote_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleClients(request, env, path, method) {
  await ensureOperationalSchema(env);
  if (method === "GET") {
    const result = await env.DB.prepare(
      "SELECT * FROM clients ORDER BY name DESC",
    ).all();
    return json(result.results);
  }

  if (method === "POST") {
    const raw = await parseRequestJson(request);
    const data = {
      name: trimText(raw.name, "Client name", { required: true, maxLength: 200 }),
      email: validateEmail(raw.email, "Client email"),
      phone: trimText(raw.phone, "Client phone", { maxLength: 100 }),
      address: trimText(raw.address, "Client address", { maxLength: 1000 }),
      city: trimText(raw.city, "Client city", { maxLength: 100 }),
      state: trimText(raw.state, "Client state", { maxLength: 100 }),
      postal_code: trimText(raw.postal_code, "Client postal code", {
        maxLength: 30,
      }),
      country: trimText(raw.country, "Client country", { maxLength: 100 }),
    };
    const id = createEntityId("client");

    await env.DB.prepare(
      `INSERT INTO clients (id, name, email, phone, address, city, state, postal_code, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.name,
        data.email,
        data.phone || "",
        data.address || "",
        data.city || "",
        data.state || "",
        data.postal_code || "",
        data.country || "",
      )
      .run();

    await recordAudit(env, {
      action: "created",
      entity_type: "client",
      entity_id: id,
      entity_number: data.email,
    });

    return json({ id, ...data }, { status: 201 });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handlePublicInvoiceView(invoiceId, env) {
  await ensureOperationalSchema(env);
  const invoice = await requireInvoice(env, invoiceId);

  if (invoice.status === "draft") {
    return json({ error: "Invoice is not issued yet" }, { status: 404 });
  }

  if (invoice.status === "sent") {
    await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
      .bind("viewed", invoiceId)
      .run();
    await recordAudit(env, {
      actor: "public",
      action: "viewed",
      entity_type: "invoice",
      entity_id: invoiceId,
      entity_number: invoice.invoice_number,
    });
    invoice.status = "viewed";
  }

  const { total, paid, balance } = await getInvoiceBalance(env, invoice);
  return json({
    ...invoice,
    total_due: total,
    total_paid: paid,
    balance_due: balance,
  });
}

async function handlePublicQuoteView(quoteId, env) {
  await ensureOperationalSchema(env);
  const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
    .bind(quoteId)
    .first();

  if (!quote) {
    return json({ error: "Quote not found" }, { status: 404 });
  }

  assertValidQuoteStatus(quote.status || "draft");

  if (quote.status === "draft") {
    return json({ error: "Quote is not issued yet" }, { status: 404 });
  }

  if (quote.status === "sent") {
    await env.DB.prepare("UPDATE quotes SET status = ? WHERE id = ?")
      .bind("viewed", quoteId)
      .run();
    await recordAudit(env, {
      actor: "public",
      action: "viewed",
      entity_type: "quote",
      entity_id: quoteId,
      entity_number: quote.quote_number,
    });
    quote.status = "viewed";
  }

  return json(quote);
}

async function handleDashboardStats(env) {
  await ensurePaymentsTable(env);
  const totalInvoices = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices",
  ).first();
  const totalQuotes = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quotes",
  ).first();
  // Revenue is actual cash collected (includes partial payments and tax).
  const totalRevenue = await env.DB.prepare(
    `SELECT COALESCE(SUM(
      CASE
        WHEN amount_cents IS NOT NULL AND (amount_cents != 0 OR amount = 0)
          THEN amount_cents
        ELSE ROUND(amount * 100)
      END
    ), 0) as total_cents FROM payments`,
  ).first();
  // Pending = issued invoices that are not yet fully paid (drafts excluded).
  const pendingInvoices = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices WHERE status NOT IN ('paid', 'draft')",
  ).first();

  return json({
      total_invoices: totalInvoices.count,
      total_quotes: totalQuotes.count,
      total_revenue: centsToAmount(Number(totalRevenue.total_cents || 0)),
      pending_invoices: pendingInvoices.count,
  });
}

// SQL fragment that reads the integer-cents column but falls back to the legacy
// REAL amount column when cents has not been backfilled (existing prod rows).
const PAYMENT_CENTS_SQL =
  "CASE WHEN amount_cents IS NOT NULL AND (amount_cents != 0 OR amount = 0) THEN amount_cents ELSE ROUND(amount * 100) END";
const INVOICE_AMOUNT_CENTS_SQL =
  "CASE WHEN amount_cents IS NOT NULL AND (amount_cents != 0 OR amount = 0) THEN amount_cents ELSE ROUND(amount * 100) END";
const INVOICE_TAX_CENTS_SQL =
  "CASE WHEN tax_cents IS NOT NULL AND (tax_cents != 0 OR tax = 0) THEN tax_cents ELSE ROUND(tax * 100) END";

function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
    months.push({ key, label });
  }
  return months;
}

async function handleAnalytics(env) {
  await ensureSchema(env);

  const collectedRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(${PAYMENT_CENTS_SQL}), 0) as cents FROM payments`,
  ).first();
  const invoicedRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(${INVOICE_AMOUNT_CENTS_SQL} + ${INVOICE_TAX_CENTS_SQL}), 0) as cents
     FROM invoices WHERE status != 'draft'`,
  ).first();
  const paidCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices WHERE status = 'paid'",
  ).first();
  const pendingCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices WHERE status NOT IN ('paid', 'draft')",
  ).first();

  const collectedCents = Number(collectedRow?.cents || 0);
  const invoicedCents = Number(invoicedRow?.cents || 0);
  const outstandingCents = Math.max(invoicedCents - collectedCents, 0);

  const collectedByMonth = await env.DB.prepare(
    `SELECT strftime('%Y-%m', COALESCE(payment_date, created_at)) as ym,
            COALESCE(SUM(${PAYMENT_CENTS_SQL}), 0) as cents
     FROM payments GROUP BY ym`,
  ).all();
  const invoicedByMonth = await env.DB.prepare(
    `SELECT strftime('%Y-%m', created_at) as ym,
            COALESCE(SUM(${INVOICE_AMOUNT_CENTS_SQL} + ${INVOICE_TAX_CENTS_SQL}), 0) as cents
     FROM invoices WHERE status != 'draft' GROUP BY ym`,
  ).all();

  const collectedMap = new Map(
    (collectedByMonth.results || []).map((r) => [r.ym, Number(r.cents || 0)]),
  );
  const invoicedMap = new Map(
    (invoicedByMonth.results || []).map((r) => [r.ym, Number(r.cents || 0)]),
  );
  const months = lastMonths(12);
  const monthly = months.map((m) => ({
    label: m.label,
    collected: centsToAmount(collectedMap.get(m.key) || 0),
    invoiced: centsToAmount(invoicedMap.get(m.key) || 0),
  }));

  const statusRows = await env.DB.prepare(
    "SELECT status, COUNT(*) as count FROM invoices GROUP BY status",
  ).all();
  const status_breakdown = (statusRows.results || []).map((r) => ({
    status: r.status || "draft",
    count: Number(r.count || 0),
  }));

  const paymentCentsQualified =
    "CASE WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0) THEN p.amount_cents ELSE ROUND(p.amount * 100) END";
  const topClientRows = await env.DB.prepare(
    `SELECT i.client_name as name, COALESCE(SUM(${paymentCentsQualified}), 0) as cents
     FROM payments p JOIN invoices i ON i.id = p.invoice_id
     GROUP BY i.client_name ORDER BY cents DESC LIMIT 6`,
  ).all();
  const top_clients = (topClientRows.results || []).map((r) => ({
    name: r.name || "Unknown",
    collected: centsToAmount(Number(r.cents || 0)),
  }));

  return json({
    kpis: {
      collected: centsToAmount(collectedCents),
      invoiced: centsToAmount(invoicedCents),
      outstanding: centsToAmount(outstandingCents),
      invoices_paid: Number(paidCount?.count || 0),
      invoices_pending: Number(pendingCount?.count || 0),
    },
    monthly,
    status_breakdown,
    top_clients,
  });
}
