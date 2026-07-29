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
const LEAD_STAGES = new Set([
  "new",
  "qualified",
  "meeting",
  "requirements",
  "proposal",
  "won",
  "lost",
]);
const PROJECT_STATUSES = new Set([
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);
const DOCUMENT_STATUSES = new Set([
  "draft",
  "review",
  "approved",
  "archived",
]);
const REQUIREMENT_STATUSES = new Set([
  "draft",
  "discovery",
  "review",
  "approved",
  "converted",
]);
const REQUIREMENT_TEMPLATES = new Set([
  "website",
  "erp",
  "crm",
  "mobile_app",
  "ecommerce",
  "ai_project",
  "government_project",
  "training_platform",
  "school_system",
  "custom",
]);
const QUALITY_RECORD_TYPES = new Set([
  "policy",
  "sop",
  "work_instruction",
  "template",
  "register",
  "internal_audit",
  "external_audit",
  "corrective_action",
  "preventive_action",
  "non_conformity",
  "customer_feedback",
  "management_review",
  "kpi",
  "continuous_improvement",
  "record",
  "lesson_learned",
]);
const QUALITY_STATUSES = new Set([
  "draft",
  "active",
  "review",
  "closed",
  "archived",
]);
const SECURITY_RECORD_TYPES = new Set([
  "asset",
  "asset_register",
  "risk",
  "risk_assessment",
  "access_control",
  "password_management",
  "security_incident",
  "vulnerability",
  "business_continuity",
  "disaster_recovery",
  "backup",
  "recovery_test",
  "security_awareness",
  "risk_register",
  "access_review",
]);
const SECURITY_STATUSES = new Set([
  "open",
  "assessing",
  "active",
  "mitigated",
  "closed",
  "archived",
]);
const RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);
const PRIORITIES = new Set(["low", "medium", "high"]);
const CRM_ACTIVITY_TYPES = new Set([
  "note",
  "call",
  "meeting",
  "email",
  "whatsapp",
  "follow_up",
  "task",
]);
const CRM_ACTIVITY_STATUSES = new Set(["planned", "completed", "cancelled"]);

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
      if (path === "/api/contact") {
        return await handleContactMessage(request, env, method);
      }

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

      if (path.startsWith("/api/admin/company")) {
        return await handleCompanyProfile(request, env, path, method);
      }

      if (path.startsWith("/api/admin/leads")) {
        return await handleLeads(request, env, path, method);
      }

      if (path.startsWith("/api/admin/crm")) {
        return await handleCrm(request, env, path, method);
      }

      if (path.startsWith("/api/admin/requirements")) {
        return await handleRequirements(request, env, path, method);
      }

      if (path.startsWith("/api/admin/projects")) {
        return await handleProjects(request, env, path, method);
      }

      if (path.startsWith("/api/admin/documents")) {
        return await handleDocuments(request, env, path, method);
      }

      if (path.startsWith("/api/admin/quality")) {
        return await handleQualityRecords(request, env, path, method);
      }

      if (path.startsWith("/api/admin/security")) {
        return await handleSecurityRecords(request, env, path, method);
      }

      if (path.startsWith("/api/admin/team")) {
        return await handleTeamMembers(request, env, path, method);
      }

      if (path.startsWith("/api/admin/invoices")) {
        return await handleInvoices(request, env, path, method);
      }

      if (path.startsWith("/api/admin/milestones")) {
        return await handleMilestones(request, env, path, method);
      }

      if (path.startsWith("/api/admin/tasks")) {
        return await handleTasks(request, env, path, method);
      }

      if (path.startsWith("/api/admin/agreements")) {
        return await handleAgreements(request, env, path, method);
      }

      if (path.startsWith("/api/admin/quotes")) {
        return await handleQuotes(request, env, path, method);
      }

      if (path.startsWith("/api/admin/clients")) {
        return await handleClients(request, env, path, method);
      }

      if (path.startsWith("/api/admin/receipts")) {
        return await handleReceipts(request, env, path, method);
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

      // Client-facing intake questionnaire. Reached by an unguessable token
      // rather than a login, so it must never expose anything beyond the one
      // lead the token belongs to.
      if (path.startsWith("/api/progress/")) {
        const token = path.split("/")[3];
        return await handlePublicProgress(env, token);
      }

      if (path.startsWith("/api/agreement/")) {
        const token = path.split("/")[3];
        return await handlePublicAgreement(request, env, token, method);
      }

      if (path.startsWith("/api/questionnaire/")) {
        const token = path.split("/")[3];
        return await handlePublicQuestionnaire(request, env, token, method);
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
  return env.SESSION_SECRET;
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

// D1 surfaces UNIQUE violations as generic errors, which the top-level handler
// would turn into a 500. Callers use this to report a conflict instead.
function isUniqueConstraintError(error) {
  return /UNIQUE constraint failed/i.test(String(error?.message || ""));
}

async function runOrConflict(statement, conflictMessage) {
  try {
    return await statement.run();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RequestError(conflictMessage, 409);
    }
    throw error;
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

function normalizeKey(value, field, allowed, defaultValue) {
  const raw = trimText(value || defaultValue, field, { maxLength: 80 });
  const normalized = raw.toLowerCase().replace(/\s+/g, "_");
  if (!normalized && defaultValue) {
    return defaultValue;
  }
  if (!allowed.has(normalized)) {
    throw new RequestError(`${field} is invalid`);
  }
  return normalized;
}

function normalizeOptionalEmail(value, field = "Email") {
  const email = trimText(value, field, { maxLength: 254 });
  return email ? validateEmail(email, field) : "";
}

function normalizeDate(value, field) {
  const date = trimText(value, field, { maxLength: 30 });
  if (!date) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RequestError(`${field} must use YYYY-MM-DD format`);
  }
  // The pattern only checks shape, so round-trip through Date to reject real
  // nonsense like 2026-02-31 or 2026-13-45, which SQLite would happily store.
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RequestError(`${field} is not a real date`);
  }
  return date;
}

function normalizeOptionalUrl(value, field) {
  const url = trimText(value, field, { maxLength: 1000 });
  if (!url) {
    return "";
  }
  // People paste bare domains, so assume https when no scheme is present. A
  // scheme that is present is kept as-is and still checked below, so this
  // cannot be used to smuggle javascript: past the protocol allowlist.
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new RequestError(`${field} must be a valid URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new RequestError(`${field} must use http or https`);
  }
  return parsed.toString();
}

function normalizeInteger(value, field, { min = 0, max = 100, fallback = 0 } = {}) {
  const hasValue = value !== undefined && value !== null && String(value) !== "";
  const number = Number(hasValue ? value : fallback);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new RequestError(`${field} must be between ${min} and ${max}`);
  }
  return number;
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeStringList(value, field) {
  const rawList = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  const list = rawList.map((item) =>
    trimText(item, field, { required: true, maxLength: 80 }),
  );
  if (list.length > 20) {
    throw new RequestError(`${field} has too many entries`);
  }
  return [...new Set(list)];
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
    lead_id: trimText(data.lead_id, "Lead id", { maxLength: 160 }),
    client_id: trimText(data.client_id, "Client id", { maxLength: 160 }),
    quote_id: trimText(data.quote_id, "Quote id", { maxLength: 160 }),
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
    project_id: trimText(data.project_id, "Project", { maxLength: 160 }),
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
    lead_id: trimText(data.lead_id, "Lead id", { maxLength: 160 }),
    client_id: trimText(data.client_id, "Client id", { maxLength: 160 }),
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

function normalizeCompanyPayload(raw) {
  const defaultTaxRate = Number(raw.default_tax_rate || 0);
  if (!Number.isFinite(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 100) {
    throw new RequestError("Default tax rate must be between 0 and 100");
  }
  const currency = trimText(raw.currency || "ZAR", "Currency", {
    maxLength: 8,
  }).toUpperCase();

  return {
    company_name: trimText(raw.company_name, "Company name", {
      required: true,
      maxLength: 200,
    }),
    registration_number: trimText(raw.registration_number, "Registration number", {
      maxLength: 100,
    }),
    vat_number: trimText(raw.vat_number, "VAT number", { maxLength: 100 }),
    email: normalizeOptionalEmail(raw.email, "Company email"),
    phone: trimText(raw.phone, "Company phone", { maxLength: 100 }),
    website: normalizeOptionalUrl(raw.website, "Website"),
    address: trimText(raw.address, "Address", { maxLength: 1500 }),
    bank_name: trimText(raw.bank_name, "Bank name", { maxLength: 100 }),
    account_name: trimText(raw.account_name, "Account name", { maxLength: 150 }),
    account_number: trimText(raw.account_number, "Account number", {
      maxLength: 100,
    }),
    branch_code: trimText(raw.branch_code, "Branch code", { maxLength: 50 }),
    currency: currency || "ZAR",
    default_tax_rate: Number(defaultTaxRate.toFixed(2)),
  };
}

function defaultCompanyProfile() {
  return {
    id: "default",
    company_name: "Beplugged Tech",
    registration_number: "",
    vat_number: "",
    email: "info@beplugged.co.za",
    phone: "",
    website: "https://beplugged.co.za",
    address: "",
    bank_name: "FNB",
    account_name: "Gerald Rushwaya",
    account_number: "63125701268",
    branch_code: "250655",
    currency: "ZAR",
    default_tax_rate: 0,
  };
}

function normalizeLeadPayload(raw) {
  const estimatedValueCents = amountToCents(raw.estimated_value || 0, "Estimated value");
  return {
    company_name: trimText(raw.company_name, "Company name", {
      required: true,
      maxLength: 200,
    }),
    contact_name: trimText(raw.contact_name, "Contact name", { maxLength: 200 }),
    email: normalizeOptionalEmail(raw.email, "Lead email"),
    phone: trimText(raw.phone, "Lead phone", { maxLength: 100 }),
    source: trimText(raw.source, "Lead source", { maxLength: 100 }),
    stage: normalizeKey(raw.stage, "Lead stage", LEAD_STAGES, "new"),
    priority: normalizeKey(raw.priority, "Lead priority", PRIORITIES, "medium"),
    estimated_value: centsToAmount(estimatedValueCents),
    estimated_value_cents: estimatedValueCents,
    next_follow_up: normalizeDate(raw.next_follow_up, "Next follow-up"),
    notes: trimText(raw.notes, "Lead notes", { maxLength: 3000 }),
  };
}

function normalizeRequirementPayload(raw) {
  return {
    title: trimText(raw.title, "Requirement title", {
      required: true,
      maxLength: 240,
    }),
    client_name: trimText(raw.client_name, "Client name", {
      required: true,
      maxLength: 200,
    }),
    contact_name: trimText(raw.contact_name, "Contact name", { maxLength: 200 }),
    template: normalizeKey(
      raw.template,
      "Requirement template",
      REQUIREMENT_TEMPLATES,
      "website",
    ),
    status: normalizeKey(
      raw.status,
      "Requirement status",
      REQUIREMENT_STATUSES,
      "draft",
    ),
    priority: normalizeKey(raw.priority, "Requirement priority", PRIORITIES, "medium"),
    owner: trimText(raw.owner, "Owner", { maxLength: 200 }),
    due_date: normalizeDate(raw.due_date, "Due date"),
    goals: trimText(raw.goals, "Business goals", { maxLength: 4000 }),
    scope: trimText(raw.scope, "Scope", { maxLength: 4000 }),
    constraints: trimText(raw.constraints, "Constraints", { maxLength: 3000 }),
    notes: trimText(raw.notes, "Requirement notes", { maxLength: 3000 }),
  };
}

function normalizeProjectPayload(raw) {
  const budgetCents = amountToCents(raw.budget || 0, "Budget");
  return {
    name: trimText(raw.name, "Project name", { required: true, maxLength: 200 }),
    client_name: trimText(raw.client_name, "Client name", { maxLength: 200 }),
    status: normalizeKey(raw.status, "Project status", PROJECT_STATUSES, "planning"),
    priority: normalizeKey(raw.priority, "Project priority", PRIORITIES, "medium"),
    owner: trimText(raw.owner, "Project owner", { maxLength: 200 }),
    start_date: normalizeDate(raw.start_date, "Start date"),
    due_date: normalizeDate(raw.due_date, "Due date"),
    budget: centsToAmount(budgetCents),
    budget_cents: budgetCents,
    progress: normalizeInteger(raw.progress, "Progress", {
      min: 0,
      max: 100,
      fallback: 0,
    }),
    notes: trimText(raw.notes, "Project notes", { maxLength: 3000 }),
  };
}

function normalizeDocumentPayload(raw) {
  return {
    title: trimText(raw.title, "Document title", {
      required: true,
      maxLength: 240,
    }),
    category: trimText(raw.category, "Document category", { maxLength: 120 }),
    owner: trimText(raw.owner, "Document owner", { maxLength: 200 }),
    status: normalizeKey(raw.status, "Document status", DOCUMENT_STATUSES, "draft"),
    version: trimText(raw.version || "1.0", "Document version", {
      maxLength: 40,
    }) || "1.0",
    review_date: normalizeDate(raw.review_date, "Review date"),
    linked_type: trimText(raw.linked_type, "Linked type", { maxLength: 80 }),
    linked_id: trimText(raw.linked_id, "Linked id", { maxLength: 160 }),
    location_url: normalizeOptionalUrl(raw.location_url, "Location URL"),
    notes: trimText(raw.notes, "Document notes", { maxLength: 3000 }),
  };
}

function normalizeQualityPayload(raw) {
  return {
    title: trimText(raw.title, "Quality title", {
      required: true,
      maxLength: 240,
    }),
    record_type: normalizeKey(
      raw.record_type,
      "Quality record type",
      QUALITY_RECORD_TYPES,
      "policy",
    ),
    status: normalizeKey(raw.status, "Quality status", QUALITY_STATUSES, "draft"),
    owner: trimText(raw.owner, "Quality owner", { maxLength: 200 }),
    project_name: trimText(raw.project_name, "Project name", { maxLength: 200 }),
    due_date: normalizeDate(raw.due_date, "Due date"),
    review_date: normalizeDate(raw.review_date, "Review date"),
    evidence_url: normalizeOptionalUrl(raw.evidence_url, "Evidence URL"),
    description: trimText(raw.description, "Description", { maxLength: 4000 }),
    notes: trimText(raw.notes, "Quality notes", { maxLength: 3000 }),
    // The document body, in Markdown. Generous limit: a full SOP runs to
    // several thousand words.
    body: trimText(raw.body, "Document body", { maxLength: 100000 }),
  };
}

function normalizeSecurityPayload(raw) {
  return {
    title: trimText(raw.title, "Security title", {
      required: true,
      maxLength: 240,
    }),
    record_type: normalizeKey(
      raw.record_type,
      "Security record type",
      SECURITY_RECORD_TYPES,
      "risk",
    ),
    status: normalizeKey(raw.status, "Security status", SECURITY_STATUSES, "open"),
    risk_level: normalizeKey(raw.risk_level, "Risk level", RISK_LEVELS, "medium"),
    owner: trimText(raw.owner, "Security owner", { maxLength: 200 }),
    asset_name: trimText(raw.asset_name, "Asset name", { maxLength: 200 }),
    due_date: normalizeDate(raw.due_date, "Due date"),
    review_date: normalizeDate(raw.review_date, "Review date"),
    evidence_url: normalizeOptionalUrl(raw.evidence_url, "Evidence URL"),
    description: trimText(raw.description, "Description", { maxLength: 4000 }),
    mitigation: trimText(raw.mitigation, "Mitigation", { maxLength: 4000 }),
    notes: trimText(raw.notes, "Security notes", { maxLength: 3000 }),
    body: trimText(raw.body, "Document body", { maxLength: 100000 }),
  };
}

function normalizeClientPayload(raw) {
  return {
    lead_id: trimText(raw.lead_id, "Lead id", { maxLength: 160 }),
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
}

function normalizeCrmRelation(raw) {
  const leadId = trimText(raw.lead_id, "Lead id", { maxLength: 160 });
  const clientId = trimText(raw.client_id, "Client id", { maxLength: 160 });
  const clientEmail = normalizeOptionalEmail(raw.client_email, "Client email");
  const clientName = trimText(raw.client_name, "Client name", { maxLength: 200 });
  if (!leadId && !clientId && !clientEmail) {
    throw new RequestError("Link this CRM record to a lead or client");
  }
  return {
    lead_id: leadId,
    client_id: clientId,
    client_email: clientEmail,
    client_name: clientName,
  };
}

function normalizeCrmContactPayload(raw) {
  const relation = normalizeCrmRelation(raw);
  return {
    ...relation,
    name: trimText(raw.name, "Contact name", {
      required: true,
      maxLength: 200,
    }),
    email: normalizeOptionalEmail(raw.email, "Contact email"),
    phone: trimText(raw.phone, "Contact phone", { maxLength: 100 }),
    role: trimText(raw.role, "Contact role", { maxLength: 120 }),
    is_primary: normalizeBoolean(raw.is_primary) ? 1 : 0,
    notes: trimText(raw.notes, "Contact notes", { maxLength: 2000 }),
  };
}

function normalizeCrmActivityPayload(raw) {
  const relation = normalizeCrmRelation(raw);
  const activityType = normalizeKey(
    raw.activity_type,
    "Activity type",
    CRM_ACTIVITY_TYPES,
    "note",
  );
  const defaultStatus = activityType === "note" ? "completed" : "planned";
  const status = normalizeKey(
    raw.status,
    "Activity status",
    CRM_ACTIVITY_STATUSES,
    defaultStatus,
  );
  const occurredAt = normalizeDate(raw.occurred_at, "Occurred date");
  const completedAt =
    status === "completed"
      ? normalizeDate(raw.completed_at, "Completed date") ||
        occurredAt ||
        new Date().toISOString().slice(0, 10)
      : normalizeDate(raw.completed_at, "Completed date");

  return {
    ...relation,
    contact_id: trimText(raw.contact_id, "Contact id", { maxLength: 160 }),
    activity_type: activityType,
    status,
    title: trimText(raw.title, "Activity title", {
      required: true,
      maxLength: 240,
    }),
    description: trimText(raw.description, "Activity notes", { maxLength: 4000 }),
    due_date: normalizeDate(raw.due_date, "Due date"),
    occurred_at: occurredAt,
    completed_at: completedAt,
    owner: trimText(raw.owner, "Owner", { maxLength: 160 }),
  };
}

function normalizeTeamMemberPayload(raw) {
  return {
    name: trimText(raw.name, "Name", { required: true, maxLength: 200 }),
    email: validateEmail(raw.email, "Team member email"),
    role: trimText(raw.role, "Role", { required: true, maxLength: 120 }),
    department: trimText(raw.department, "Department", { maxLength: 120 }),
    permissions: normalizeStringList(raw.permissions, "Permissions"),
    active: raw.active === undefined ? true : normalizeBoolean(raw.active),
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
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      lead_id TEXT,
      client_id TEXT,
      quote_id TEXT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_address TEXT,
      amount REAL NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      tax REAL DEFAULT 0,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      payment_terms TEXT,
      items TEXT,
      notes TEXT,
      qr_code_url TEXT
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      quote_number TEXT NOT NULL UNIQUE,
      lead_id TEXT,
      client_id TEXT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_address TEXT,
      amount REAL NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      tax REAL DEFAULT 0,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'converted_to_invoice')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_date DATE,
      items TEXT,
      notes TEXT,
      qr_code_url TEXT
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
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
    `CREATE TABLE IF NOT EXISTS company_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      company_name TEXT NOT NULL,
      registration_number TEXT,
      vat_number TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      address TEXT,
      bank_name TEXT,
      account_name TEXT,
      account_number TEXT,
      branch_code TEXT,
      currency TEXT NOT NULL DEFAULT 'ZAR',
      default_tax_rate REAL NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      source TEXT,
      stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'meeting', 'requirements', 'proposal', 'won', 'lost')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      estimated_value REAL NOT NULL DEFAULT 0,
      estimated_value_cents INTEGER NOT NULL DEFAULT 0,
      next_follow_up DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      client_id TEXT,
      client_email TEXT,
      client_name TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS crm_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      client_id TEXT,
      client_email TEXT,
      client_name TEXT,
      contact_id TEXT,
      activity_type TEXT NOT NULL DEFAULT 'note' CHECK (activity_type IN ('note', 'call', 'meeting', 'email', 'whatsapp', 'follow_up', 'task')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'completed', 'cancelled')),
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      occurred_at DATE,
      completed_at DATE,
      owner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      requirement_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      contact_name TEXT,
      template TEXT NOT NULL DEFAULT 'website' CHECK (template IN ('website', 'erp', 'crm', 'mobile_app', 'ecommerce', 'ai_project', 'government_project', 'training_platform', 'school_system', 'custom')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'discovery', 'review', 'approved', 'converted')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      owner TEXT,
      due_date DATE,
      goals TEXT,
      scope TEXT,
      constraints TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      client_name TEXT,
      status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      owner TEXT,
      start_date DATE,
      due_date DATE,
      budget REAL NOT NULL DEFAULT 0,
      budget_cents INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      owner TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
      version TEXT NOT NULL DEFAULT '1.0',
      review_date DATE,
      linked_type TEXT,
      linked_id TEXT,
      location_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS quality_records (
      id TEXT PRIMARY KEY,
      record_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      record_type TEXT NOT NULL DEFAULT 'policy' CHECK (record_type IN ('policy', 'sop', 'work_instruction', 'template', 'register', 'internal_audit', 'external_audit', 'corrective_action', 'preventive_action', 'non_conformity', 'customer_feedback', 'management_review', 'kpi', 'continuous_improvement', 'record', 'lesson_learned')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'review', 'closed', 'archived')),
      owner TEXT,
      project_name TEXT,
      due_date DATE,
      review_date DATE,
      evidence_url TEXT,
      description TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS security_records (
      id TEXT PRIMARY KEY,
      record_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      record_type TEXT NOT NULL DEFAULT 'risk' CHECK (record_type IN ('asset', 'asset_register', 'risk', 'risk_assessment', 'access_control', 'password_management', 'security_incident', 'vulnerability', 'business_continuity', 'disaster_recovery', 'backup', 'recovery_test', 'security_awareness', 'risk_register', 'access_review')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assessing', 'active', 'mitigated', 'closed', 'archived')),
      risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      owner TEXT,
      asset_name TEXT,
      due_date DATE,
      review_date DATE,
      evidence_url TEXT,
      description TEXT,
      mitigation TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      department TEXT,
      permissions TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads (stage)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads (next_follow_up)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_id ON crm_contacts (lead_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_id ON crm_contacts (client_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_email ON crm_contacts (client_email)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities (lead_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_activities_client_id ON crm_activities (client_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_activities_client_email ON crm_activities (client_email)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_crm_activities_status_due ON crm_activities (status, due_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements (status)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_requirements_due_date ON requirements (due_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects (due_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_documents_review_date ON documents (review_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_quality_records_type ON quality_records (record_type)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_quality_records_status ON quality_records (status)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_quality_records_review_date ON quality_records (review_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_security_records_type ON security_records (record_type)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_security_records_status ON security_records (status)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_security_records_risk_level ON security_records (risk_level)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_security_records_review_date ON security_records (review_date)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members (email)",
  ).run();
  await ensureColumn(env, "invoices", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "invoices", "tax_cents", "tax_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "quotes", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "quotes", "tax_cents", "tax_cents INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(env, "payments", "amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  // The money side and the delivery side had no link, so work that had been
  // invoiced and paid for never appeared as a project.
  await ensureColumn(env, "invoices", "project_id", "project_id TEXT");
  await ensureColumn(env, "quotes", "project_id", "project_id TEXT");
  await ensureColumn(env, "projects", "client_id", "client_id TEXT");
  await ensureColumn(env, "clients", "lead_id", "lead_id TEXT");
  await ensureColumn(env, "quotes", "lead_id", "lead_id TEXT");
  await ensureColumn(env, "quotes", "client_id", "client_id TEXT");
  await ensureColumn(env, "invoices", "lead_id", "lead_id TEXT");
  await ensureColumn(env, "invoices", "client_id", "client_id TEXT");
  await ensureColumn(env, "invoices", "quote_id", "quote_id TEXT");
  // Holds the document itself as Markdown. Policies and SOPs are internal, so
  // they live behind the admin login rather than as public files.
  await ensureColumn(env, "quality_records", "body", "body TEXT");
  await ensureColumn(env, "security_records", "body", "body TEXT");
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients (lead_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes (lead_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes (client_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices (lead_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices (quote_id)",
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS lead_questionnaires (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'sent',
      answers TEXT,
      submitted_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_lead_questionnaires_lead ON lead_questionnaires (lead_id)",
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS scope_agreements (
      id TEXT PRIMARY KEY,
      agreement_number TEXT NOT NULL UNIQUE,
      parent_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      project_name TEXT,
      linked_type TEXT,
      linked_id TEXT,
      body TEXT NOT NULL,
      body_hash TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      token TEXT UNIQUE,
      sent_at DATETIME,
      signed_name TEXT,
      signed_at DATETIME,
      signed_ip TEXT,
      signed_user_agent TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_scope_agreements_parent ON scope_agreements (parent_id)",
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      position INTEGER NOT NULL DEFAULT 0,
      due_date DATE,
      completed_at DATETIME,
      source_type TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS milestone_tasks (
      id TEXT PRIMARY KEY,
      milestone_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      position INTEGER NOT NULL DEFAULT 0,
      owner TEXT,
      due_date DATE,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones (project_id)",
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON milestone_tasks (milestone_id)",
  ).run();
  // Read-only progress link the client can be given, and the review sent at
  // handover. Both are unguessable tokens, like the questionnaire.
  await ensureColumn(env, "projects", "share_token", "share_token TEXT");
  await ensureColumn(env, "projects", "review_token", "review_token TEXT");
  await ensureColumn(env, "projects", "review_sent_at", "review_sent_at DATETIME");
  await ensureColumn(env, "projects", "review_rating", "review_rating INTEGER");
  await ensureColumn(env, "projects", "review_submitted_at", "review_submitted_at DATETIME");
  // Must come after the table exists: ensureColumn returns early when
  // PRAGMA table_info finds nothing.
  await ensureColumn(
    env,
    "scope_agreements",
    "requirement_id",
    "requirement_id TEXT",
  );
  await seedEditableReferenceData(env);
}

async function seedEditableReferenceData(env) {
  const policyCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quality_records WHERE record_type = 'policy'",
  ).first();
  if (Number(policyCount?.count || 0) === 0) {
    const policySeeds = [
      {
        id: "demo_qms_quality_policy",
        record_number: "QMS-2026-POL-001",
        title: "Quality Management Policy",
        record_type: "policy",
        status: "active",
        owner: "Managing Director",
        project_name: "Company-wide",
        due_date: "2026-09-30",
        review_date: "2026-10-31",
        description:
          "ISO 9001 policy covering policies, SOPs, work instructions, templates, registers, internal audits, external audits, corrective actions, preventive actions, non-conformities, customer feedback, management reviews, KPIs, and continuous improvement.",
        notes:
          "Use this as the top-level quality policy. Every project should automatically produce ISO evidence.",
      },
      {
        id: "demo_qms_security_policy",
        record_number: "QMS-2026-POL-002",
        title: "Information Security Policy",
        record_type: "policy",
        status: "review",
        owner: "Security Owner",
        project_name: "Internal Systems",
        due_date: "2026-08-31",
        review_date: "2026-09-30",
        description:
          "ISO 27001 policy covering assets, asset register, risks, risk assessments, access control, password management, security incidents, vulnerabilities, business continuity, disaster recovery, backups, recovery tests, and security awareness.",
        notes:
          "Keep this linked to the Security register so assets, risks, access reviews, incidents, backups, and continuity records stay together.",
      },
    ];
    for (const seed of policySeeds) {
      await insertQualitySeed(env, seed);
    }
  }

  const sopCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quality_records WHERE record_type = 'sop'",
  ).first();
  if (Number(sopCount?.count || 0) === 0) {
    const sopSeeds = [
      {
        id: "demo_qms_project_evidence_sop",
        record_number: "QMS-2026-SOP-001",
        title: "Project ISO Evidence SOP",
        record_type: "sop",
        status: "active",
        owner: "Project Lead",
        project_name: "Project Delivery",
        due_date: "2026-08-15",
        review_date: "2026-10-15",
        description:
          "Procedure for producing ISO evidence from requirements, project delivery, document reviews, lessons learned, corrective actions, and customer feedback.",
        notes:
          "Use this SOP to make sure project work creates quality records without a separate admin exercise.",
      },
      {
        id: "demo_qms_invoice_payment_sop",
        record_number: "QMS-2026-SOP-002",
        title: "Invoice Issue and Payment SOP",
        record_type: "sop",
        status: "active",
        owner: "Finance",
        project_name: "Billing",
        due_date: "2026-08-20",
        review_date: "2026-11-30",
        description:
          "Procedure for creating invoices, issuing client documents, recording partial or full payments, and keeping receipt evidence.",
        notes:
          "Links finance records to customer communication and audit evidence.",
      },
    ];
    for (const seed of sopSeeds) {
      await insertQualitySeed(env, seed);
    }
  }

  const qualityEvidenceCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quality_records WHERE record_type NOT IN ('policy', 'sop')",
  ).first();
  if (Number(qualityEvidenceCount?.count || 0) === 0) {
    const qualitySeeds = [
      {
        id: "demo_qms_customer_feedback",
        record_number: "QMS-2026-FDB-001",
        title: "Customer Satisfaction Register",
        record_type: "customer_feedback",
        status: "active",
        owner: "Operations",
        project_name: "All Projects",
        due_date: "2026-09-15",
        review_date: "2026-10-31",
        description:
          "Register for customer feedback and satisfaction evidence across completed projects and support interactions.",
        notes:
          "Feeds management reviews, KPIs, continuous improvement, corrective actions, and preventive actions.",
      },
      {
        id: "demo_qms_corrective_action",
        record_number: "QMS-2026-CAPA-001",
        title: "Corrective Action: Late Sign-off",
        record_type: "corrective_action",
        status: "draft",
        owner: "Project Lead",
        project_name: "Client Portal Setup",
        due_date: "2026-08-10",
        review_date: "2026-08-31",
        description:
          "Corrective action record for a delayed client sign-off and the process change needed to prevent repeat delivery delays.",
        notes:
          "Use this to track root cause, action owner, due date, verification, and closure evidence.",
      },
      {
        id: "demo_qms_management_review",
        record_number: "QMS-2026-MRV-001",
        title: "Quarterly Management Review",
        record_type: "management_review",
        status: "review",
        owner: "Managing Director",
        project_name: "Quality Management",
        due_date: "2026-09-30",
        review_date: "2026-09-30",
        description:
          "Management review record for KPIs, audit findings, customer feedback, non-conformities, corrective actions, preventive actions, and lessons learned.",
        notes:
          "Use this as the recurring ISO 9001 review agenda and evidence record.",
      },
    ];
    for (const seed of qualitySeeds) {
      await insertQualitySeed(env, seed);
    }
  }

  const securityCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM security_records",
  ).first();
  if (Number(securityCount?.count || 0) === 0) {
    const securitySeeds = [
      {
        id: "demo_sec_access_review",
        record_number: "SEC-2026-ACCESS-001",
        title: "Cloudflare Account Access Review",
        record_type: "access_review",
        status: "assessing",
        risk_level: "high",
        owner: "Security Owner",
        asset_name: "Cloudflare",
        due_date: "2026-08-15",
        review_date: "2026-08-31",
        description:
          "Access review for Cloudflare users, roles, MFA, privileged access, and administrator permissions.",
        mitigation:
          "Review active users monthly, remove unused access, enforce MFA, and record approvals.",
        notes:
          "Links to access control, passwords, assets, risk register, and security awareness.",
      },
      {
        id: "demo_sec_recovery_test",
        record_number: "SEC-2026-DR-001",
        title: "Production Backup Recovery Test",
        record_type: "recovery_test",
        status: "open",
        risk_level: "medium",
        owner: "Operations",
        asset_name: "D1 Database",
        due_date: "2026-08-30",
        review_date: "2026-09-15",
        description:
          "Recovery test record for backups, disaster recovery, and business continuity evidence.",
        mitigation:
          "Document backup location, restore steps, test result, issues found, and next recovery test date.",
        notes:
          "Use this to prove backups are not only configured but recoverable.",
      },
      {
        id: "demo_sec_risk_register",
        record_number: "SEC-2026-RISK-001",
        title: "Client Data Risk Register",
        record_type: "risk_register",
        status: "active",
        risk_level: "critical",
        owner: "Managing Director",
        asset_name: "Client Records",
        due_date: "2026-08-10",
        review_date: "2026-08-31",
        description:
          "Risk register entry for protecting client records, invoices, quotes, receipts, and project information.",
        mitigation:
          "Limit access, review roles, track incidents, test backups, and keep business continuity actions current.",
        notes:
          "Everything should remain linked: assets, risks, access reviews, incidents, backups, recovery tests, and business continuity.",
      },
    ];
    for (const seed of securitySeeds) {
      await insertSecuritySeed(env, seed);
    }
  }
}

async function insertQualitySeed(env, seed) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO quality_records (
       id, record_number, title, record_type, status, owner, project_name,
       due_date, review_date, evidence_url, description, notes
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      seed.id,
      seed.record_number,
      seed.title,
      seed.record_type,
      seed.status,
      seed.owner,
      seed.project_name,
      seed.due_date,
      seed.review_date,
      "",
      seed.description,
      seed.notes,
    )
    .run();
}

async function insertSecuritySeed(env, seed) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO security_records (
       id, record_number, title, record_type, status, risk_level, owner,
       asset_name, due_date, review_date, evidence_url, description,
       mitigation, notes
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      seed.id,
      seed.record_number,
      seed.title,
      seed.record_type,
      seed.status,
      seed.risk_level,
      seed.owner,
      seed.asset_name,
      seed.due_date,
      seed.review_date,
      "",
      seed.description,
      seed.mitigation,
      seed.notes,
    )
    .run();
}

async function ensureColumn(env, tableName, columnName, columnDefinition) {
  const allowedTables = new Set([
    "clients",
    "invoices",
    "quotes",
    "payments",
    "quality_records",
    "security_records",
    "scope_agreements",
    "projects",
  ]);
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

async function parseContactPayload(request) {
  const contentType = request.headers.get("Content-Type") || "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return parseRequestJson(request);
}

function normalizeContactPayload(raw) {
  return {
    name: trimText(raw.name, "Name", { required: true, maxLength: 200 }),
    email: validateEmail(raw.email, "Email"),
    phone: trimText(raw.phone, "Phone", { maxLength: 100 }),
    subject: trimText(raw.subject, "Subject", {
      required: true,
      maxLength: 200,
    }),
    message: trimText(raw.message, "Message", {
      required: true,
      maxLength: 4000,
    }),
    newsletter: Boolean(raw.news),
    website: trimText(raw.website, "Website", { maxLength: 200 }),
  };
}

async function handleContactMessage(request, env, method) {
  if (method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // This endpoint is unauthenticated and sends an email on every request, so
  // throttle by client IP before doing any real work. Limits are per-location
  // and eventually consistent, which is fine for abuse control.
  if (env.CONTACT_LIMITER) {
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.CONTACT_LIMITER.limit({ key: clientIp });
    if (!success) {
      return json(
        { error: "Too many messages sent. Please try again in a minute." },
        { status: 429 },
      );
    }
  } else {
    // Declared in wrangler.toml, so this only happens on a runtime without
    // rate-limit support. Fail open rather than break the form, but be loud.
    console.error(JSON.stringify({ message: "contact_rate_limiter_missing" }));
  }

  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    return json(
      { error: "Contact email is not configured. Please email info@beplugged.co.za." },
      { status: 503 },
    );
  }

  const data = normalizeContactPayload(await parseContactPayload(request));
  if (data.website) {
    return json({ success: true });
  }

  const recipientEmail = env.BREVO_REPLY_TO || env.BREVO_SENDER_EMAIL;
  const safeSubject = data.subject.replace(/\s+/g, " ").trim();
  const bodyHtml = `
    ${emailSectionLabel("Website Enquiry")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;margin:0 0 22px;">
      <tbody>
        <tr><td style="padding:10px 14px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;width:120px;">Name</td><td style="padding:10px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Email</td><td style="padding:10px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtml(data.email)}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Phone</td><td style="padding:10px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtml(data.phone || "-")}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#555555;">Newsletter</td><td style="padding:10px 14px;font-size:13px;color:#2C2D3F;">${data.newsletter ? "Yes" : "No"}</td></tr>
      </tbody>
    </table>
    ${emailSectionLabel("Message")}
    <table role="presentation" width="100%" style="background:#fafafb;border:1px solid #eeeeee;border-radius:8px;">
      <tr><td style="padding:16px 18px;font-size:14px;color:#2C2D3F;line-height:1.8;">${escapeHtmlWithBreaks(data.message)}</td></tr>
    </table>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: env.BREVO_SENDER_NAME || "Beplugged Tech",
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: recipientEmail, name: env.BREVO_SENDER_NAME || "Beplugged Tech" }],
      replyTo: { email: data.email, name: data.name },
      subject: `Website enquiry: ${safeSubject}`,
      htmlContent: emailShell({
        label: "Website Contact",
        accent: "#F05023",
        bodyHtml,
      }),
    }),
  });

  if (!response.ok) {
    console.error(
      JSON.stringify({
        message: "contact_email_failed",
        status: response.status,
        response: await response.text(),
      }),
    );
    return json(
      { error: "Message could not be sent. Please email info@beplugged.co.za." },
      { status: 502 },
    );
  }

  await createLeadFromContact(env, data);

  return json({ success: true });
}

async function createLeadFromContact(env, data) {
  if (!env.DB) {
    return;
  }
  try {
    await ensureSchema(env);
    const id = createEntityId("lead");
    await env.DB.prepare(
      `INSERT INTO leads (id, company_name, contact_name, email, phone, source, stage, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.name,
        data.name,
        data.email,
        data.phone || "",
        "Website",
        "new",
        "medium",
        data.message,
      )
      .run();
    await recordAudit(env, {
      actor: "public",
      action: "created",
      entity_type: "lead",
      entity_id: id,
      entity_number: data.email,
      details: { source: "Website contact" },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "contact_lead_capture_failed",
        error: String(error?.message || error),
      }),
    );
  }
}

async function handleLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }
  if (!env.SESSION_SECRET) {
    return json({ error: "SESSION_SECRET is not configured" }, { status: 500 });
  }
  // Unauthenticated endpoint guarding a single password, so throttle it before
  // the comparison runs. Checked first rather than only on failure: an attacker
  // who guesses correctly should already have been stopped.
  if (env.LOGIN_LIMITER) {
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.LOGIN_LIMITER.limit({ key: clientIp });
    if (!success) {
      return json(
        { error: "Too many login attempts. Please try again shortly." },
        { status: 429 },
      );
    }
  } else {
    console.error(JSON.stringify({ message: "login_rate_limiter_missing" }));
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
      "SELECT id, invoice_number, lead_id, client_id, quote_id, client_name, client_email, client_address, amount, tax, status, created_at, due_date FROM invoices ORDER BY created_at DESC LIMIT 100",
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

  if (method === "POST" && invoiceId && action === "project") {
    return handleCreateProjectFromInvoice(env, invoiceId);
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
      `INSERT INTO invoices (
         id, invoice_number, lead_id, client_id, quote_id, project_id,
         client_name, client_email, client_address, amount, amount_cents, tax,
         tax_cents, status, due_date, payment_terms, items, notes, qr_code_url
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        invoiceNumber,
        data.lead_id,
        data.client_id,
        data.quote_id,
        data.project_id,
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

    if (data.quote_id) {
      await env.DB.prepare(
        "UPDATE quotes SET status = ? WHERE id = ? AND status = ?",
      )
        .bind("converted_to_invoice", data.quote_id, "accepted")
        .run();
      await recordAudit(env, {
        action: "converted_to_invoice",
        entity_type: "quote",
        entity_id: data.quote_id,
        entity_number: invoiceNumber,
        details: { invoice_id: id },
      });
    }

    return json({ id, invoiceNumber, qr_code_url: qrCode }, { status: 201 });
  }

  if (method === "PUT" && invoiceId) {
    const invoice = await requireInvoice(env, invoiceId);
    const paymentCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM payments WHERE invoice_id = ?",
    )
      .bind(invoiceId)
      .first();
    if (Number(paymentCount?.count || 0) > 0) {
      throw new RequestError(
        "Invoices with recorded payments cannot be edited",
        409,
      );
    }

    const data = normalizeInvoicePayload(await parseRequestJson(request));
    // Preserve the current status so editing a sent/viewed invoice does not
    // silently un-issue it.
    await env.DB.prepare(
      `UPDATE invoices SET
         lead_id = ?, client_id = ?, quote_id = ?, project_id = ?,
         client_name = ?,
         client_email = ?, client_address = ?, amount = ?, amount_cents = ?,
         tax = ?, tax_cents = ?, status = ?, items = ?, notes = ?,
         due_date = ?, payment_terms = ?
       WHERE id = ?`,
    )
      .bind(
        data.lead_id,
        data.client_id,
        data.quote_id,
        data.project_id,
        data.client_name,
        data.client_email,
        data.client_address,
        data.amount,
        data.amount_cents,
        data.tax,
        data.tax_cents,
        invoice.status || "draft",
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

// Bulletproof, centered email CTA button (table-based for Outlook/Gmail).
function emailButton(url, label, color = "#F05023") {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 28px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="${color}" style="border-radius:6px;">
            <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
          </td>
        </tr></table>
      </td></tr>
    </table>`;
}

// Section label used above tables/boxes in emails.
function emailSectionLabel(text) {
  return `<div style="margin:0 0 10px;font-size:11px;color:#8a8a8a;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${escapeHtml(text)}</div>`;
}

// Wraps body content in a branded, responsive-ish email shell.
function emailShell({ label, accent = "#F05023", bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <tr><td style="background-color:#ffffff;padding:24px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle;">
              <img src="https://beplugged.co.za/img/logo.png" alt="Beplugged Tech" width="120" height="81" style="display:block;width:120px;max-width:120px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
            <td align="right" style="vertical-align:middle;color:${accent};font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(label)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:4px;background-color:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="background-color:#fafafb;border-top:1px solid #eeeeee;padding:22px 32px;color:#9a9aa0;font-size:12px;line-height:1.7;">
          <strong style="color:#2C2D3F;">Beplugged Tech</strong><br>
          Questions? Just reply to this email or contact <a href="mailto:info@beplugged.co.za" style="color:${accent};text-decoration:none;">info@beplugged.co.za</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Turns invoiced work into a project, so what has been paid for appears on
// the delivery side instead of only in the finance tables.
async function handleCreateProjectFromInvoice(env, invoiceId) {
  const invoice = await requireInvoice(env, invoiceId);
  if (invoice.project_id) {
    throw new RequestError("This invoice already belongs to a project", 409);
  }

  const id = createEntityId("project");
  const projectCode = generateDocumentNumber("PRJ");
  const amountCents = persistedCents(invoice, "amount_cents", "amount", "Invoice amount");
  const taxCents = persistedCents(invoice, "tax_cents", "tax", "Invoice tax");
  const budgetCents = amountCents + taxCents;

  await env.DB.prepare(
    `INSERT INTO projects (
       id, project_code, name, client_name, client_id, status, priority,
       start_date, budget, budget_cents, progress, notes
     ) VALUES (?, ?, ?, ?, ?, 'planning', 'medium', ?, ?, ?, 0, ?)`,
  )
    .bind(
      id,
      projectCode,
      `${invoice.client_name || "Client"} — ${invoice.invoice_number}`,
      invoice.client_name || "",
      invoice.client_id || null,
      new Date().toISOString().slice(0, 10),
      centsToAmount(budgetCents),
      budgetCents,
      `Created from invoice ${invoice.invoice_number}.`,
    )
    .run();

  await env.DB.prepare("UPDATE invoices SET project_id = ? WHERE id = ?")
    .bind(id, invoiceId)
    .run();

  await recordAudit(env, {
    action: "project_created_from_invoice",
    entity_type: "project",
    entity_id: id,
    entity_number: projectCode,
    details: { invoice_id: invoiceId, invoice_number: invoice.invoice_number },
  });

  return json({ success: true, id, project_code: projectCode }, { status: 201 });
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
        .map((item, i) => {
          const quantity = Number(item.quantity || 1);
          const rate = Number(item.rate || 0);
          const discount = Number(item.discount || 0);
          const lineTotal = Math.max(quantity * rate - discount, 0);
          const bg = i % 2 ? "#ffffff" : "#fbfbfc";
          return `<tr style="background:${bg};">
            <td style="padding:10px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtml(item.description || "Item")}</td>
            <td style="padding:10px 14px;font-size:13px;color:#555555;text-align:center;border-bottom:1px solid #eeeeee;">${escapeHtml(quantity)}</td>
            <td style="padding:10px 14px;font-size:13px;color:#555555;text-align:right;border-bottom:1px solid #eeeeee;">${formatMoney(rate)}</td>
            <td style="padding:10px 14px;font-size:13px;color:#2C2D3F;text-align:right;border-bottom:1px solid #eeeeee;">${formatMoney(lineTotal)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" style="padding:10px 14px;font-size:13px;color:#2C2D3F;">Services Rendered</td></tr>`;

  const bankingInfo = invoice.payment_terms
    ? escapeHtmlWithBreaks(
        invoice.payment_terms.replace(/\#\[invoice_number\]/g, invoice.invoice_number),
      )
    : getDefaultBankingInfo(invoice.invoice_number);

  const total = Number(invoice.amount || 0) + Number(invoice.tax || 0);
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Hi ${escapeHtml(invoice.client_name || "there")},</p>
    <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">Thank you for your business. Here is the summary of invoice <strong>${escapeHtml(invoice.invoice_number)}</strong>. Use the button below to view or download the full invoice.</p>
    ${customMessage ? `<table role="presentation" width="100%" style="margin:0 0 22px;"><tr><td style="background:#FFF5F1;border-left:3px solid #F05023;border-radius:4px;padding:12px 16px;font-size:14px;color:#555555;line-height:1.7;">${escapeHtml(customMessage)}</td></tr></table>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F1;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;color:#a06a58;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Amount Due</div>
        <div style="font-size:30px;font-weight:bold;color:#F05023;margin-top:6px;">${formatMoney(total)}</div>
        ${dueDate ? `<div style="font-size:13px;color:#7a7a80;margin-top:6px;">Due by ${escapeHtml(dueDate)}</div>` : ""}
      </td></tr>
    </table>
    ${emailButton(invoiceUrl, "View & Download Invoice")}
    ${emailSectionLabel("Invoice Summary")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <thead><tr style="background:#2C2D3F;">
        <th align="left" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Description</th>
        <th align="center" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Qty</th>
        <th align="right" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Rate</th>
        <th align="right" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Amount</th>
      </tr></thead>
      <tbody>${itemsRows}</tbody>
      <tfoot><tr>
        <td colspan="3" align="right" style="padding:12px 14px;font-size:14px;font-weight:bold;color:#2C2D3F;border-top:2px solid #eeeeee;">Total Due</td>
        <td align="right" style="padding:12px 14px;font-size:15px;font-weight:bold;color:#F05023;border-top:2px solid #eeeeee;">${formatMoney(total)}</td>
      </tr></tfoot>
    </table>
    ${emailSectionLabel("Banking Details")}
    <table role="presentation" width="100%" style="background:#fafafb;border:1px solid #eeeeee;border-radius:8px;">
      <tr><td style="padding:16px 18px;font-size:13px;color:#2C2D3F;line-height:1.9;">${bankingInfo}</td></tr>
    </table>
  `;

  const htmlContent = emailShell({
    label: `Invoice ${invoice.invoice_number}`,
    accent: "#F05023",
    bodyHtml,
  });

  const payload = {
    sender: {
      name: env.BREVO_SENDER_NAME || "Beplugged Tech",
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: invoice.client_email, name: invoice.client_name || "" }],
    subject: `Invoice ${invoice.invoice_number} from Beplugged Tech`,
    htmlContent,
  };

  // Keep a copy of every invoice on file by BCC'ing the business inbox.
  const bccEmail = env.BREVO_BCC_EMAIL || "info@beplugged.co.za";
  if (bccEmail && bccEmail !== invoice.client_email) {
    payload.bcc = [
      { email: bccEmail, name: env.BREVO_SENDER_NAME || "Beplugged Tech" },
    ];
  }

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
    // Fast path with a friendly error. The authoritative check is the guarded
    // INSERT below, which also closes the race between these two statements.
    const { balanceCents } = await getInvoiceBalanceCents(env, invoice);
    if (amountCents > balanceCents) {
      throw new RequestError("Payment amount cannot exceed the balance due", 409);
    }

    const id = createEntityId("pay");
    const paymentDate =
      trimText(data.payment_date, "Payment date", { maxLength: 30 }) ||
      new Date().toISOString().slice(0, 10);
    const paymentMethod = trimText(data.payment_method, "Payment method", {
      maxLength: 100,
    });
    const paymentNotes = trimText(data.notes, "Payment notes", { maxLength: 1000 });
    const insertResult = await env.DB.prepare(
      `INSERT INTO payments (id, invoice_id, amount, amount_cents, payment_date, payment_method, notes)
       SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE ? <= (
         SELECT CASE
           WHEN (
             (CASE WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0) THEN i.amount_cents ELSE ROUND(i.amount * 100) END) +
             (CASE WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0) THEN i.tax_cents ELSE ROUND(i.tax * 100) END) -
             COALESCE((
               SELECT SUM(CASE WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0) THEN p.amount_cents ELSE ROUND(p.amount * 100) END)
               FROM payments p
               WHERE p.invoice_id = i.id
             ), 0)
           ) < 0
           THEN 0
           ELSE (
             (CASE WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0) THEN i.amount_cents ELSE ROUND(i.amount * 100) END) +
             (CASE WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0) THEN i.tax_cents ELSE ROUND(i.tax * 100) END) -
             COALESCE((
               SELECT SUM(CASE WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0) THEN p.amount_cents ELSE ROUND(p.amount * 100) END)
               FROM payments p
               WHERE p.invoice_id = i.id
             ), 0)
           )
         END
         FROM invoices i
         WHERE i.id = ?
       )`,
    )
      .bind(
        id,
        invoiceId,
        centsToAmount(amountCents),
        amountCents,
        paymentDate,
        paymentMethod,
        paymentNotes,
        amountCents,
        invoiceId,
      )
      .run();
    if (Number(insertResult?.meta?.changes || 0) !== 1) {
      throw new RequestError("Payment amount cannot exceed the balance due", 409);
    }

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

function receiptPublicUrl(request, paymentId) {
  return `${new URL(request.url).origin}/receipts/index.html?id=${encodeURIComponent(
    paymentId,
  )}`;
}

async function handleReceipts(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const paymentId = segments[4];
  const action = segments[5];

  if (method === "POST" && paymentId && action === "send") {
    return handleSendReceipt(request, env, paymentId);
  }

  if (method === "GET" && !paymentId) {
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

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleSendReceipt(request, env, paymentId) {
  if (!env.BREVO_API_KEY) {
    return json({ error: "Missing BREVO_API_KEY secret" }, { status: 500 });
  }
  if (!env.BREVO_SENDER_EMAIL) {
    return json({ error: "Missing BREVO_SENDER_EMAIL variable" }, { status: 500 });
  }

  const payment = await env.DB.prepare("SELECT * FROM payments WHERE id = ?")
    .bind(paymentId)
    .first();
  if (!payment) {
    return json({ error: "Receipt not found" }, { status: 404 });
  }
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(payment.invoice_id)
    .first();
  if (!invoice) {
    return json({ error: "Invoice for this receipt not found" }, { status: 404 });
  }
  if (!invoice.client_email) {
    return json(
      { error: "No client email on file for this invoice" },
      { status: 400 },
    );
  }

  const receiptNumber = receiptNumberFor(payment);
  const receiptUrl = receiptPublicUrl(request, payment.id);
  const { total, paid, balance } = await getInvoiceBalance(env, invoice);
  const paymentAmount = centsToAmount(
    persistedCents(payment, "amount_cents", "amount", "Payment amount"),
  );
  const settled = balance <= 0;

  const summaryRow = (labelText, valueText, strong) => `
    <tr>
      <td style="padding:9px 14px;font-size:13px;color:${strong ? "#2C2D3F" : "#555555"};border-bottom:1px solid #eeeeee;${strong ? "font-weight:bold;" : ""}">${escapeHtml(labelText)}</td>
      <td align="right" style="padding:9px 14px;font-size:13px;color:${strong ? "#2C2D3F" : "#555555"};text-align:right;border-bottom:1px solid #eeeeee;${strong ? "font-weight:bold;" : ""}">${valueText}</td>
    </tr>`;

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Hi ${escapeHtml(invoice.client_name || "there")},</p>
    <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">Thank you for your payment${settled ? " — your invoice is now fully settled" : ""}. Here is your receipt for invoice <strong>${escapeHtml(invoice.invoice_number)}</strong>. Use the button below to view or download it.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eefaf2;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;color:#2f7d55;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Payment Received</div>
        <div style="font-size:30px;font-weight:bold;color:#1f8a52;margin-top:6px;">${formatMoney(paymentAmount)}</div>
        <div style="font-size:13px;color:#5a7a68;margin-top:6px;">Receipt ${escapeHtml(receiptNumber)}${payment.payment_method ? ` · ${escapeHtml(payment.payment_method)}` : ""}</div>
      </td></tr>
    </table>
    ${emailButton(receiptUrl, "View & Download Receipt", "#1f8a52")}
    ${emailSectionLabel("Receipt Summary")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;">
      <tbody>
        ${summaryRow("Invoice", escapeHtml(invoice.invoice_number))}
        ${summaryRow("Payment Received", formatMoney(paymentAmount))}
        ${summaryRow("Invoice Total", formatMoney(total))}
        ${summaryRow("Total Paid to Date", formatMoney(paid))}
        ${summaryRow(settled ? "Balance Due" : "Balance Outstanding", `<span style="color:${settled ? "#1f8a52" : "#F05023"};">${formatMoney(balance)}</span>`, true)}
      </tbody>
    </table>
  `;

  const htmlContent = emailShell({
    label: `Receipt ${receiptNumber}`,
    accent: "#1f8a52",
    bodyHtml,
  });

  const payload = {
    sender: {
      name: env.BREVO_SENDER_NAME || "Beplugged Tech",
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: invoice.client_email, name: invoice.client_name || "" }],
    subject: `Receipt ${receiptNumber} from Beplugged Tech`,
    htmlContent,
  };

  // Keep a copy of every receipt on file by BCC'ing the business inbox.
  const bccEmail = env.BREVO_BCC_EMAIL || "info@beplugged.co.za";
  if (bccEmail && bccEmail !== invoice.client_email) {
    payload.bcc = [
      { email: bccEmail, name: env.BREVO_SENDER_NAME || "Beplugged Tech" },
    ];
  }

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
    return json({ error: "Brevo send failed", details: errorText }, { status: 502 });
  }

  await recordAudit(env, {
    action: "receipt_sent",
    entity_type: "invoice",
    entity_id: invoice.id,
    entity_number: invoice.invoice_number,
    details: {
      payment_id: payment.id,
      receipt_number: receiptNumber,
      recipient: invoice.client_email,
    },
  });

  const result = await response.json().catch(() => ({}));
  return json({ success: true, result });
}

async function handleCompanyProfile(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  if (segments[4]) {
    return json({ error: "Not found" }, { status: 404 });
  }

  if (method === "GET") {
    const profile = await env.DB.prepare(
      "SELECT * FROM company_profile WHERE id = ?",
    )
      .bind("default")
      .first();
    return json(profile || defaultCompanyProfile());
  }

  if (method === "PUT" || method === "POST") {
    const data = normalizeCompanyPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `INSERT INTO company_profile (
         id, company_name, registration_number, vat_number, email, phone,
         website, address, bank_name, account_name, account_number,
         branch_code, currency, default_tax_rate, updated_at
       )
       VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         company_name = excluded.company_name,
         registration_number = excluded.registration_number,
         vat_number = excluded.vat_number,
         email = excluded.email,
         phone = excluded.phone,
         website = excluded.website,
         address = excluded.address,
         bank_name = excluded.bank_name,
         account_name = excluded.account_name,
         account_number = excluded.account_number,
         branch_code = excluded.branch_code,
         currency = excluded.currency,
         default_tax_rate = excluded.default_tax_rate,
         updated_at = CURRENT_TIMESTAMP`,
    )
      .bind(
        data.company_name,
        data.registration_number,
        data.vat_number,
        data.email,
        data.phone,
        data.website,
        data.address,
        data.bank_name,
        data.account_name,
        data.account_number,
        data.branch_code,
        data.currency,
        data.default_tax_rate,
      )
      .run();

    await recordAudit(env, {
      action: "updated",
      entity_type: "company_profile",
      entity_id: "default",
      entity_number: data.company_name,
    });

    return json({ success: true, ...data });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

const AGREEMENT_TTL_DAYS = 30;
const AGREEMENT_STATUSES = new Set(["draft", "sent", "signed", "declined", "void"]);

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(text ?? "")),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function agreementUrl(request, token) {
  return `${new URL(request.url).origin}/sign/?t=${encodeURIComponent(token)}`;
}

function normalizeAgreementPayload(raw) {
  return {
    title: trimText(raw.title, "Title", { required: true, maxLength: 240 }),
    client_name: trimText(raw.client_name, "Client name", {
      required: true,
      maxLength: 200,
    }),
    client_email: validateEmail(raw.client_email, "Client email"),
    project_id: trimText(raw.project_id, "Project", {
      required: true,
      maxLength: 160,
    }),
    requirement_id: trimText(raw.requirement_id, "Requirement", {
      maxLength: 160,
    }),
    // The document itself. Written from the meeting minutes.
    body: trimText(raw.body, "Scope text", { required: true, maxLength: 100000 }),
  };
}

// An agreement always belongs to a project, so the signed scope can be traced
// to the work it governs.
async function resolveAgreementProject(env, projectId) {
  const project = await env.DB.prepare(
    "SELECT id, name, project_code, client_name FROM projects WHERE id = ?",
  )
    .bind(projectId)
    .first();
  if (!project) {
    throw new RequestError("Select a valid project", 400);
  }
  return project;
}

function publicAgreement(row) {
  return {
    agreement_number: row.agreement_number,
    version: Number(row.version || 1),
    title: row.title,
    client_name: row.client_name,
    project_name: row.project_name,
    body: row.body,
    status: row.status,
    signed_name: row.signed_name,
    signed_at: row.signed_at,
    // Shown on the client's printed copy so the fingerprint travels with it.
    body_hash: row.body_hash,
  };
}

async function handleAgreements(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const id = segments[4];
  const action = segments[5];

  if (method === "GET" && !id) {
    const result = await env.DB.prepare(
      `SELECT id, agreement_number, parent_id, version, title, client_name,
              client_email, project_name, linked_type, linked_id,
              requirement_id, status,
              sent_at, signed_name, signed_at, expires_at, created_at
       FROM scope_agreements ORDER BY created_at DESC LIMIT 200`,
    ).all();
    return json(result.results || []);
  }

  if (method === "GET" && id) {
    const row = await env.DB.prepare("SELECT * FROM scope_agreements WHERE id = ?")
      .bind(id)
      .first();
    return json(row || { error: "Agreement not found" }, row ? {} : { status: 404 });
  }

  if (method === "POST" && !id) {
    const data = normalizeAgreementPayload(await parseRequestJson(request));
    const project = await resolveAgreementProject(env, data.project_id);
    const newId = createEntityId("agr");
    await env.DB.prepare(
      `INSERT INTO scope_agreements (
         id, agreement_number, version, title, client_name, client_email,
         project_name, linked_type, linked_id, requirement_id, body, status
       ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    )
      .bind(
        newId,
        generateDocumentNumber("SCOPE"),
        data.title,
        data.client_name,
        data.client_email,
        project.name,
        "project",
        project.id,
        data.requirement_id,
        data.body,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "scope_agreement",
      entity_id: newId,
      entity_number: data.title,
    });
    return json({ id: newId, ...data }, { status: 201 });
  }

  const existing = id
    ? await env.DB.prepare("SELECT * FROM scope_agreements WHERE id = ?")
        .bind(id)
        .first()
    : null;
  if (id && !existing) {
    throw new RequestError("Agreement not found", 404);
  }

  // An addendum is how scope changes after signature. The signed document is
  // never edited, so what was agreed at the time stays provable.
  if (method === "POST" && id && action === "addendum") {
    if (existing.status !== "signed") {
      throw new RequestError(
        "Only a signed agreement can be extended with an addendum",
        409,
      );
    }
    const rootId = existing.parent_id || existing.id;
    const raw = await parseRequestJson(request);
    // An addendum belongs to the same project as the agreement it extends.
    const data = normalizeAgreementPayload({
      ...raw,
      project_id: raw.project_id || existing.linked_id,
      requirement_id: raw.requirement_id || existing.requirement_id || "",
    });
    const project = await resolveAgreementProject(env, data.project_id);
    const highest = await env.DB.prepare(
      `SELECT MAX(version) AS v FROM scope_agreements
       WHERE id = ? OR parent_id = ?`,
    )
      .bind(rootId, rootId)
      .first();
    const version = Number(highest?.v || 1) + 1;
    const newId = createEntityId("agr");
    await env.DB.prepare(
      `INSERT INTO scope_agreements (
         id, agreement_number, parent_id, version, title, client_name,
         client_email, project_name, linked_type, linked_id, requirement_id,
         body, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    )
      .bind(
        newId,
        generateDocumentNumber("SCOPE"),
        rootId,
        version,
        data.title,
        data.client_name,
        data.client_email,
        project.name,
        "project",
        project.id,
        data.requirement_id,
        data.body,
      )
      .run();
    await recordAudit(env, {
      action: "addendum_created",
      entity_type: "scope_agreement",
      entity_id: newId,
      entity_number: data.title,
      details: { parent: rootId, version },
    });
    return json({ id: newId, version, parent_id: rootId }, { status: 201 });
  }

  if (method === "PUT" && id) {
    if (existing.status !== "draft") {
      throw new RequestError(
        "Only a draft agreement can be edited. Issue an addendum instead",
        409,
      );
    }
    const data = normalizeAgreementPayload(await parseRequestJson(request));
    const project = await resolveAgreementProject(env, data.project_id);
    await env.DB.prepare(
      `UPDATE scope_agreements SET title = ?, client_name = ?, client_email = ?,
         project_name = ?, linked_type = ?, linked_id = ?, requirement_id = ?,
         body = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.title,
        data.client_name,
        data.client_email,
        project.name,
        "project",
        project.id,
        data.requirement_id,
        data.body,
        id,
      )
      .run();
    return json({ success: true });
  }

  if (method === "POST" && id && action === "send") {
    if (existing.status === "signed") {
      throw new RequestError("This agreement has already been signed", 409);
    }
    // Hash the exact text being sent. What the client saw stays provable even
    // if the source record is later superseded.
    const bodyHash = await sha256Hex(existing.body);
    const token = createQuestionnaireToken();
    const expires = new Date(
      Date.now() + AGREEMENT_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    await env.DB.prepare(
      `UPDATE scope_agreements SET token = ?, body_hash = ?, status = 'sent',
         sent_at = CURRENT_TIMESTAMP, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(token, bodyHash, expires, id)
      .run();

    const url = agreementUrl(request, token);
    const bodyHtml = `
      <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Hi ${escapeHtml(existing.client_name || "there")},</p>
      <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">Please review the scope for <strong>${escapeHtml(existing.title)}</strong> and confirm it is an accurate description of what we will build. Nothing starts until you have confirmed.</p>
      ${emailButton(url, "Review and confirm")}
      <p style="margin:0 0 8px;font-size:13px;color:#7a7a80;line-height:1.7;">If the button does not work, copy this link into your browser:</p>
      <p style="margin:0 0 22px;font-size:12px;color:#7a7a80;word-break:break-all;">${escapeHtml(url)}</p>
      <p style="margin:0;font-size:13px;color:#7a7a80;line-height:1.7;">Reference ${escapeHtml(existing.agreement_number)}${Number(existing.version || 1) > 1 ? ` · addendum ${escapeHtml(existing.version)}` : ""}. This link expires in ${AGREEMENT_TTL_DAYS} days.</p>
    `;
    await sendBrevoEmail(env, {
      to: existing.client_email,
      toName: existing.client_name || "",
      subject: `Please confirm the scope — ${existing.title}`,
      htmlContent: emailShell({
        label: Number(existing.version || 1) > 1 ? "Scope Addendum" : "Scope Confirmation",
        accent: "#F05023",
        bodyHtml,
      }),
    });

    await recordAudit(env, {
      action: "sent_for_signature",
      entity_type: "scope_agreement",
      entity_id: id,
      entity_number: existing.agreement_number,
      details: { recipient: existing.client_email },
    });
    return json({ success: true, url, expires_at: expires });
  }

  if (method === "DELETE" && id) {
    if (existing.status === "signed") {
      throw new RequestError("A signed agreement cannot be deleted", 409);
    }
    await env.DB.prepare("DELETE FROM scope_agreements WHERE id = ?").bind(id).run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "scope_agreement",
      entity_id: id,
      entity_number: existing.agreement_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handlePublicAgreement(request, env, token, method) {
  await ensureSchema(env);
  if (!token) {
    return json({ error: "Not found" }, { status: 404 });
  }

  const row = await env.DB.prepare(
    "SELECT * FROM scope_agreements WHERE token = ?",
  )
    .bind(token)
    .first();

  // Expiry limits how long there is to sign, not how long a completed record
  // can be read. Once signed the link stays valid, since it is the client's
  // copy. Unknown and expired look the same, so the endpoint cannot be probed.
  const expired =
    row &&
    row.status !== "signed" &&
    row.expires_at &&
    new Date(row.expires_at) < new Date();
  if (!row || expired) {
    return json({ error: "This link is no longer valid" }, { status: 404 });
  }

  if (method === "GET") {
    return json(publicAgreement(row));
  }

  if (method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  if (row.status === "signed") {
    return json({ error: "This has already been confirmed" }, { status: 409 });
  }

  if (env.CONTACT_LIMITER) {
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.CONTACT_LIMITER.limit({ key: `a:${clientIp}` });
    if (!success) {
      return json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }
  }

  const payload = await parseRequestJson(request);
  if (!normalizeBoolean(payload?.confirmed)) {
    throw new RequestError("Please tick the confirmation box before signing");
  }
  const signedName = trimText(payload?.signed_name, "Full name", {
    required: true,
    maxLength: 200,
  });
  if (signedName.length < 3) {
    throw new RequestError("Please enter your full name");
  }

  const signedAt = new Date().toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const agent = String(request.headers.get("User-Agent") || "").slice(0, 300);

  const result = await env.DB.prepare(
    `UPDATE scope_agreements
     SET status = 'signed', signed_name = ?, signed_at = ?, signed_ip = ?,
         signed_user_agent = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status != 'signed'`,
  )
    .bind(signedName, signedAt, ip, agent, row.id)
    .run();
  if (Number(result?.meta?.changes || 0) !== 1) {
    return json({ error: "This has already been confirmed" }, { status: 409 });
  }

  await recordAudit(env, {
    actor: "client",
    action: "signed",
    entity_type: "scope_agreement",
    entity_id: row.id,
    entity_number: row.agreement_number,
    details: { signed_name: signedName, ip, body_hash: row.body_hash },
  });

  // A signed agreement becomes planned work on the project it governs.
  try {
    await createMilestoneFromAgreement(env, {
      ...row,
      signed_name: signedName,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "milestone_from_agreement_failed",
        agreement_id: row.id,
        error: String(error?.message || error),
      }),
    );
  }

  // Both parties get a copy. A failure here must not undo a valid signature.
  try {
    await sendSignedCopies(
      env,
      { ...row, signed_name: signedName, signed_at: signedAt, signed_ip: ip },
      agreementUrl(request, row.token),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "agreement_copy_failed",
        agreement_id: row.id,
        error: String(error?.message || error),
      }),
    );
  }

  return json({ success: true, signed_name: signedName, signed_at: signedAt });
}

// Markdown to email-safe HTML. Inline styles only, since email clients drop
// stylesheets, and the source is escaped before parsing so a stored document
// cannot inject markup.
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// A standalone copy of the agreement the client can open in any browser and
// print. Self-contained, so it keeps working with no network and no site.
function agreementAttachmentHtml(row, when) {
  const isAddendum = Number(row.version || 1) > 1;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(row.title)} — ${escapeHtml(row.agreement_number)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
    color:#2C2D3F;line-height:1.65;font-size:14px;max-width:760px;margin:0 auto;padding:32px 20px;}
  .head{border-bottom:3px solid #F05023;padding-bottom:12px;margin-bottom:20px;}
  .head h1{font-size:20px;margin:0 0 4px;}
  .meta{color:#6b6b76;font-size:12px;}
  .sig{border:1px solid #ddd;border-radius:6px;padding:16px 18px;margin:0 0 24px;background:#fafafb;}
  .sig .name{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;}
  .sig .stamp{margin-top:8px;font-size:11px;color:#6b6b76;line-height:1.8;}
  table{border-collapse:collapse;width:100%;margin:0 0 14px;}
  th,td{border:1px solid #eee;padding:7px 10px;font-size:12px;text-align:left;vertical-align:top;}
  th{background:#fafafb;}
  @media print{body{padding:0;} .sig{break-inside:avoid;} table,pre,blockquote{break-inside:avoid;}}
</style></head><body>
<div class="head">
  <h1>${escapeHtml(row.title)}</h1>
  <div class="meta">${escapeHtml(row.agreement_number)}${isAddendum ? ` &middot; addendum ${escapeHtml(row.version)}` : ""}
    &middot; ${escapeHtml(row.client_name || "")}${row.project_name ? ` &middot; ${escapeHtml(row.project_name)}` : ""}</div>
</div>
<div class="sig">
  <div class="name">${escapeHtml(row.signed_name || "")}</div>
  <div class="stamp">Confirmed ${escapeHtml(when)}<br>
    Reference ${escapeHtml(row.agreement_number)}<br>
    Document fingerprint ${escapeHtml(String(row.body_hash || ""))}</div>
</div>
${markdownToEmailHtml(row.body)}
<p style="margin-top:28px;font-size:11px;color:#6b6b76;">
  Beplugged Tech &middot; info@beplugged.co.za. This file is a copy of the
  document confirmed on the date shown. The fingerprint identifies the exact
  text that was agreed.</p>
</body></html>`;
}

function markdownToEmailHtml(src) {
  const lines = escapeHtml(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const inline = (t) =>
    t
      .replace(/`([^`]+)`/g, '<code style="font-family:monospace;font-size:12px;">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(
        /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" style="color:#F05023;">$1</a>',
      );
  const cells = (row) =>
    row.replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
  const H = {
    1: "font-size:18px;margin:18px 0 8px;",
    2: "font-size:15px;margin:16px 0 7px;",
    3: "font-size:14px;margin:14px 0 6px;",
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^```/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre style="background:#f4f4f7;border:1px solid #eeeeee;border-radius:4px;padding:10px 12px;font-size:12px;overflow-x:auto;">${buf.join("\n")}</pre>`);
      continue;
    }
    if (/^\s*(---|===)\s*$/.test(line)) {
      out.push('<hr style="border:0;border-top:1px solid #eeeeee;margin:18px 0;">');
      i++; continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(h[1].length, 3);
      out.push(`<div style="font-weight:bold;color:#2C2D3F;${H[lvl]}">${inline(h[2])}</div>`);
      i++; continue;
    }
    if (
      /^\s*\|.*\|\s*$/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])
    ) {
      const head = cells(line.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++].trim()));
      out.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;"><thead><tr>${head
          .map((x) => `<th align="left" style="border:1px solid #eeeeee;background:#fafafb;padding:7px 10px;font-size:12px;">${inline(x)}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((x) => `<td style="border:1px solid #eeeeee;padding:7px 10px;font-size:12px;vertical-align:top;">${inline(x)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }
    if (/^\s*&gt;\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*&gt;\s?/, ""));
      out.push(`<table role="presentation" width="100%" style="margin:0 0 14px;"><tr><td style="background:#fafafb;border-left:3px solid #F05023;padding:10px 14px;font-size:13px;color:#555555;">${inline(buf.join(" "))}</td></tr></table>`);
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(
          inline(
            lines[i++]
              .replace(/^\s*(?:[-*]|\d+\.)\s+/, "")
              .replace(/^\[( |x)\]\s*/, (m, ch) => (ch === "x" ? "&#9745; " : "&#9744; ")),
          ),
        );
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag} style="margin:0 0 14px 18px;padding:0;font-size:13px;color:#2C2D3F;">${items.map((x) => `<li style="margin-bottom:5px;">${x}</li>`).join("")}</${tag}>`);
      continue;
    }
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|\s*\||\s*&gt;|```|\s*(?:[-*]|\d+\.)\s)/.test(lines[i])
    ) {
      buf.push(lines[i++]);
    }
    out.push(`<p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#2C2D3F;">${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

async function sendSignedCopies(env, row, viewUrl) {
  const when = new Date(row.signed_at).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isAddendum = Number(row.version || 1) > 1;

  // The document is attached rather than inlined. A five page scope makes for
  // an unreadable email, and an attachment is what the client actually files.
  const fileName = `${row.agreement_number || "agreement"}.html`;
  const attachments = [
    {
      name: fileName,
      content: toBase64(agreementAttachmentHtml(row, when)),
    },
  ];

  const signatureBlock = `
    ${emailSectionLabel("Confirmed by")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#2C2D3F;">${escapeHtml(row.signed_name)}</div>
        <div style="margin-top:8px;font-size:12px;color:#8a8a8a;line-height:1.8;">
          ${escapeHtml(when)}<br>
          Reference ${escapeHtml(row.agreement_number)}${isAddendum ? ` &middot; addendum ${escapeHtml(row.version)}` : ""}<br>
          Document fingerprint ${escapeHtml(String(row.body_hash || "").slice(0, 16))}
        </div>
      </td></tr>
    </table>`;

  const attachmentNote = `
    <p style="margin:22px 0 0;font-size:13px;color:#7a7a80;line-height:1.7;">
      The full document is attached as <strong>${escapeHtml(fileName)}</strong>.
      Open it in any browser to read or print it, or use the button above to
      view it online.
    </p>`;

  await sendBrevoEmail(env, {
    to: row.client_email,
    toName: row.client_name || "",
    subject: `Confirmed — ${row.title}`,
    attachments,
    htmlContent: emailShell({
      label: isAddendum ? "Addendum Confirmed" : "Scope Confirmed",
      accent: "#1f8a52",
      bodyHtml: `
        <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Thank you ${escapeHtml(row.signed_name)},</p>
        <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">This confirms what you agreed for <strong>${escapeHtml(row.title)}</strong>. Please keep this for your records.</p>
        ${signatureBlock}
        ${viewUrl ? emailButton(viewUrl, "View online", "#1f8a52") : ""}
        ${attachmentNote}`,
    }),
  });

  const internal = env.BREVO_REPLY_TO || env.BREVO_SENDER_EMAIL;
  if (internal && internal !== row.client_email) {
    await sendBrevoEmail(env, {
      to: internal,
      toName: env.BREVO_SENDER_NAME || "Beplugged Tech",
      subject: `Scope confirmed — ${row.client_name || row.title}`,
      attachments,
      htmlContent: emailShell({
        label: isAddendum ? "Addendum Confirmed" : "Scope Confirmed",
        accent: "#1f8a52",
        bodyHtml: `
          <p style="margin:0 0 22px;font-size:16px;color:#2C2D3F;"><strong>${escapeHtml(row.client_name || "The client")}</strong> has confirmed ${isAddendum ? "an addendum" : "the scope"} for ${escapeHtml(row.title)}${row.project_name ? ` (${escapeHtml(row.project_name)})` : ""}.</p>
          ${signatureBlock}
          ${viewUrl ? emailButton(viewUrl, "View online", "#1f8a52") : ""}
          ${attachmentNote}`,
      }),
    });
  }
}

const QUESTIONNAIRE_TTL_DAYS = 30;

// The questions mirror SOP-CLI-001 Appendix A. Kept server-side so the stored
// answers stay meaningful even if the public page changes.
const QUESTIONNAIRE_FIELDS = [
  { name: "site_type", label: "Type of website", max: 40 },
  { name: "purpose", label: "Main purpose", max: 500 },
  { name: "pages", label: "Pages needed", max: 500 },
  { name: "has_logo", label: "Has logo", max: 40 },
  { name: "logo_files", label: "Logo source files", max: 200 },
  { name: "brand", label: "Brand colours", max: 500 },
  { name: "domain_owned", label: "Owns domain", max: 40 },
  { name: "domain_name", label: "Domain name", max: 253 },
  { name: "domain_access", label: "Has domain access", max: 200 },
  { name: "hosting", label: "Hosting", max: 200 },
  { name: "email_needed", label: "Email on domain", max: 40 },
  { name: "content_by", label: "Who supplies content", max: 200 },
  { name: "contact_phone", label: "Phone", max: 100 },
  { name: "contact_email", label: "Email", max: 254 },
  { name: "contact_whatsapp", label: "WhatsApp", max: 100 },
  { name: "contact_address", label: "Address", max: 500 },
  { name: "socials", label: "Social links", max: 500 },
  { name: "deadline", label: "Deadline", max: 200 },
  { name: "budget", label: "Budget range", max: 200 },
  { name: "anything_else", label: "Anything else", max: 3000 },
];

function createQuestionnaireToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function questionnaireUrl(request, token) {
  return `${new URL(request.url).origin}/start/?t=${encodeURIComponent(token)}`;
}

function normalizeQuestionnaireAnswers(raw) {
  const answers = {};
  for (const field of QUESTIONNAIRE_FIELDS) {
    answers[field.name] = trimText(raw?.[field.name], field.label, {
      maxLength: field.max,
    });
  }
  return answers;
}

function parseAnswers(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Turns the raw answers into the prose the requirements record expects.
function summariseAnswers(answers) {
  const line = (label, value) => (value ? `${label}: ${value}` : "");
  const goals = [
    line("Purpose", answers.purpose),
    line("Site type", answers.site_type),
    line("Pages", answers.pages),
  ].filter(Boolean).join("\n");
  const scope = [
    line("Content supplied by", answers.content_by),
    line("Logo", answers.has_logo),
    line("Logo source files", answers.logo_files),
    line("Brand", answers.brand),
    line("Email on domain", answers.email_needed),
  ].filter(Boolean).join("\n");
  const constraints = [
    line("Deadline", answers.deadline),
    line("Budget", answers.budget),
    line("Domain owned", answers.domain_owned),
    line("Domain", answers.domain_name),
    line("Domain access", answers.domain_access),
    line("Hosting", answers.hosting),
  ].filter(Boolean).join("\n");
  const notes = [
    line("Anything else", answers.anything_else),
    line("Phone", answers.contact_phone),
    line("Email", answers.contact_email),
    line("WhatsApp", answers.contact_whatsapp),
    line("Address", answers.contact_address),
    line("Socials", answers.socials),
  ].filter(Boolean).join("\n");
  return { goals, scope, constraints, notes };
}

async function handleLeadQuestionnaire(request, env, leadId, method, action) {
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
    .bind(leadId)
    .first();
  if (!lead) {
    throw new RequestError("Lead not found", 404);
  }

  if (method === "POST" && action === "send") {
    let row = await env.DB.prepare(
      "SELECT * FROM lead_questionnaires WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(leadId)
      .first();
    // Sending without an existing link mints one, so the admin never has to
    // remember to generate first.
    if (!row || row.status === "submitted") {
      const token = createQuestionnaireToken();
      const expires = new Date(
        Date.now() + QUESTIONNAIRE_TTL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      await env.DB.prepare("DELETE FROM lead_questionnaires WHERE lead_id = ?")
        .bind(leadId)
        .run();
      await env.DB.prepare(
        `INSERT INTO lead_questionnaires (id, lead_id, token, status, expires_at)
         VALUES (?, ?, ?, 'sent', ?)`,
      )
        .bind(createEntityId("lq"), leadId, token, expires)
        .run();
      row = { token };
    }
    return handleSendQuestionnaire(request, env, lead, row.token);
  }

  if (method === "GET") {
    const row = await env.DB.prepare(
      "SELECT * FROM lead_questionnaires WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(leadId)
      .first();
    if (!row) {
      return json({ exists: false });
    }
    return json({
      exists: true,
      status: row.status,
      url: questionnaireUrl(request, row.token),
      sent_at: row.created_at,
      submitted_at: row.submitted_at,
      expires_at: row.expires_at,
      answers: parseAnswers(row.answers),
    });
  }

  if (method === "POST") {
    // Regenerating invalidates the previous link, which is the desired
    // behaviour if a link was sent to the wrong address.
    await env.DB.prepare("DELETE FROM lead_questionnaires WHERE lead_id = ?")
      .bind(leadId)
      .run();
    const token = createQuestionnaireToken();
    const expires = new Date(
      Date.now() + QUESTIONNAIRE_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    await env.DB.prepare(
      `INSERT INTO lead_questionnaires (id, lead_id, token, status, expires_at)
       VALUES (?, ?, ?, 'sent', ?)`,
    )
      .bind(createEntityId("lq"), leadId, token, expires)
      .run();
    await recordAudit(env, {
      action: "questionnaire_link_created",
      entity_type: "lead",
      entity_id: leadId,
      entity_number: lead.company_name,
    });
    return json({
      success: true,
      url: questionnaireUrl(request, token),
      expires_at: expires,
    });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handlePublicQuestionnaire(request, env, token, method) {
  await ensureSchema(env);
  if (!token) {
    return json({ error: "Not found" }, { status: 404 });
  }

  const row = await env.DB.prepare(
    "SELECT * FROM lead_questionnaires WHERE token = ?",
  )
    .bind(token)
    .first();

  // Same response for a bad token and an expired one, so the endpoint cannot
  // be used to test whether a token exists.
  if (!row || (row.expires_at && new Date(row.expires_at) < new Date())) {
    return json({ error: "This link is no longer valid" }, { status: 404 });
  }

  const lead = await env.DB.prepare(
    "SELECT company_name, contact_name FROM leads WHERE id = ?",
  )
    .bind(row.lead_id)
    .first();

  if (method === "GET") {
    return json({
      status: row.status,
      company_name: lead?.company_name || "",
      contact_name: lead?.contact_name || "",
    });
  }

  if (method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  if (row.status === "submitted") {
    return json(
      { error: "This questionnaire has already been submitted" },
      { status: 409 },
    );
  }

  if (env.CONTACT_LIMITER) {
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.CONTACT_LIMITER.limit({
      key: `q:${clientIp}`,
    });
    if (!success) {
      return json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }
  }

  const answers = normalizeQuestionnaireAnswers(await parseRequestJson(request));
  const submittedAt = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE lead_questionnaires
     SET status = 'submitted', answers = ?, submitted_at = ?
     WHERE id = ? AND status != 'submitted'`,
  )
    .bind(JSON.stringify(answers), submittedAt, row.id)
    .run();

  // Move the lead along and record a requirements entry from the answers.
  const summary = summariseAnswers(answers);
  await env.DB.prepare(
    `UPDATE leads SET stage = CASE WHEN stage = 'new' THEN 'qualified' ELSE stage END,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  )
    .bind(row.lead_id)
    .run();

  const requirementId = createEntityId("req");
  await env.DB.prepare(
    `INSERT INTO requirements (
       id, requirement_number, title, client_name, contact_name, template,
       status, goals, scope, constraints, notes
     )
     VALUES (?, ?, ?, ?, ?, 'website', 'discovery', ?, ?, ?, ?)`,
  )
    .bind(
      requirementId,
      generateDocumentNumber("REQ"),
      `Intake — ${lead?.company_name || "Client"}`,
      lead?.company_name || "Client",
      lead?.contact_name || "",
      summary.goals,
      summary.scope,
      summary.constraints,
      summary.notes,
    )
    .run();

  await recordAudit(env, {
    actor: "client",
    action: "questionnaire_submitted",
    entity_type: "lead",
    entity_id: row.lead_id,
    entity_number: lead?.company_name || "",
    details: { requirement_id: requirementId },
  });

  // Notify the business inbox. The client has already submitted successfully,
  // so a failure here must never surface to them as an error.
  try {
    await notifyQuestionnaireSubmitted(request, env, lead, answers);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "questionnaire_notification_failed",
        lead_id: row.lead_id,
        error: String(error?.message || error),
      }),
    );
  }

  return json({ success: true });
}

// Answers worth seeing at a glance, in the order they are asked.
const QUESTIONNAIRE_PREVIEW = [
  ["site_type", "Type of website"],
  ["purpose", "Main purpose"],
  ["pages", "Pages needed"],
  ["has_logo", "Has a logo"],
  ["logo_files", "Logo source files"],
  ["brand", "Brand colours"],
  ["domain_owned", "Owns a domain"],
  ["domain_name", "Domain name"],
  ["domain_access", "Access to domain"],
  ["hosting", "Hosting"],
  ["email_needed", "Email on domain"],
  ["content_by", "Content supplied by"],
  ["deadline", "Deadline"],
  ["budget", "Budget"],
  ["contact_phone", "Phone"],
  ["contact_email", "Email"],
  ["contact_whatsapp", "WhatsApp"],
  ["contact_address", "Address"],
  ["socials", "Social links"],
  ["anything_else", "Anything else"],
];

async function notifyQuestionnaireSubmitted(request, env, lead, answers) {
  const recipient = env.BREVO_REPLY_TO || env.BREVO_SENDER_EMAIL;
  if (!recipient) return;

  const rows = QUESTIONNAIRE_PREVIEW.filter(([key]) =>
    String(answers[key] || "").trim(),
  )
    .map(
      ([key, label], i) => `<tr style="background:${i % 2 ? "#ffffff" : "#fbfbfc"};">
        <td style="padding:9px 14px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:9px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtmlWithBreaks(answers[key])}</td>
      </tr>`,
    )
    .join("");

  // Things that reliably cost money later if missed.
  const flags = [];
  if (/no/i.test(answers.has_logo || "")) flags.push("No logo — design cost likely");
  if (answers.has_logo && /yes/i.test(answers.has_logo) && !answers.logo_files)
    flags.push("Logo source files not confirmed");
  if (/yes/i.test(answers.domain_owned || "") && !/yes/i.test(answers.domain_access || ""))
    flags.push("Owns a domain but access is unclear — start recovery early");
  if (/web app/i.test(answers.site_type || ""))
    flags.push("Web app — do not quote without discovery");
  if (!String(answers.budget || "").trim()) flags.push("No budget indicated");
  if (/beplugged|copywriting|mixture/i.test(answers.content_by || ""))
    flags.push("Content not fully client-supplied — price it");

  const adminUrl = `${new URL(request.url).origin}/admin/`;
  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;"><strong>${escapeHtml(lead?.company_name || "A client")}</strong> has completed the questionnaire.</p>
    <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">${escapeHtml(lead?.contact_name || "")}${lead?.contact_name && lead?.email ? " · " : ""}${escapeHtml(lead?.email || "")}</p>
    ${
      flags.length
        ? `<table role="presentation" width="100%" style="margin:0 0 22px;"><tr><td style="background:#FFF5F1;border-left:3px solid #F05023;border-radius:4px;padding:12px 16px;font-size:13px;color:#555555;line-height:1.8;"><strong style="color:#2C2D3F;">Worth checking</strong><br>${flags.map((f) => `&bull; ${escapeHtml(f)}`).join("<br>")}</td></tr></table>`
        : ""
    }
    ${emailButton(adminUrl, "Open the dashboard")}
    ${emailSectionLabel("Their answers")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;">
      <tbody>${rows || `<tr><td style="padding:10px 14px;font-size:13px;">No answers recorded.</td></tr>`}</tbody>
    </table>
    <p style="margin:22px 0 0;font-size:13px;color:#7a7a80;line-height:1.7;">The lead has moved to <strong>qualified</strong> and a requirements record has been created.</p>
  `;

  await sendBrevoEmail(env, {
    to: recipient,
    toName: env.BREVO_SENDER_NAME || "Beplugged Tech",
    subject: `Questionnaire completed — ${lead?.company_name || "new client"}`,
    htmlContent: emailShell({
      label: "Questionnaire Completed",
      accent: "#1f8a52",
      bodyHtml,
    }),
  });
}

// Shared Brevo send. Invoices and receipts predate this and keep their own
// copies; quotes and questionnaires route through here.
async function sendBrevoEmail(env, { to, toName, subject, htmlContent, attachments }) {
  if (!env.BREVO_API_KEY) {
    throw new RequestError("Missing BREVO_API_KEY secret", 500);
  }
  if (!env.BREVO_SENDER_EMAIL) {
    throw new RequestError("Missing BREVO_SENDER_EMAIL variable", 500);
  }
  if (!to) {
    throw new RequestError("No email address on file for this recipient", 400);
  }

  const senderName = env.BREVO_SENDER_NAME || "Beplugged Tech";
  const payload = {
    sender: { name: senderName, email: env.BREVO_SENDER_EMAIL },
    to: [{ email: to, name: toName || "" }],
    subject,
    htmlContent,
  };
  if (Array.isArray(attachments) && attachments.length) {
    payload.attachment = attachments;
  }

  // Keep a copy on file, as invoices and receipts already do.
  const bccEmail = env.BREVO_BCC_EMAIL || "info@beplugged.co.za";
  if (bccEmail && bccEmail !== to) {
    payload.bcc = [{ email: bccEmail, name: senderName }];
  }
  if (env.BREVO_REPLY_TO) {
    payload.replyTo = { email: env.BREVO_REPLY_TO, name: senderName };
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
    const details = await response.text();
    console.error(
      JSON.stringify({ message: "brevo_send_failed", status: response.status, details }),
    );
    throw new RequestError("Email could not be sent", 502);
  }
  return response.json().catch(() => ({}));
}

async function handleSendQuestionnaire(request, env, lead, token) {
  const url = questionnaireUrl(request, token);
  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Hi ${escapeHtml(lead.contact_name || lead.company_name || "there")},</p>
    <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">Thank you for your interest in working with us. So that we can quote accurately and build what you actually need, please answer a few questions about your project. It takes about five minutes.</p>
    ${emailButton(url, "Answer the questions")}
    <p style="margin:0 0 8px;font-size:13px;color:#7a7a80;line-height:1.7;">If the button does not work, copy this link into your browser:</p>
    <p style="margin:0 0 22px;font-size:12px;color:#7a7a80;word-break:break-all;">${escapeHtml(url)}</p>
    ${emailSectionLabel("What we will ask")}
    <table role="presentation" width="100%" style="background:#fafafb;border:1px solid #eeeeee;border-radius:8px;">
      <tr><td style="padding:16px 18px;font-size:13px;color:#2C2D3F;line-height:1.9;">
        The type of site you need &middot; what it is for &middot; pages &middot; logo and branding &middot;
        domain, hosting and email &middot; who supplies the content &middot; contact details to display &middot;
        timeline and budget
      </td></tr>
    </table>
    <p style="margin:22px 0 0;font-size:13px;color:#7a7a80;line-height:1.7;">This link is personal to you and expires in 30 days.</p>
  `;

  await sendBrevoEmail(env, {
    to: lead.email,
    toName: lead.contact_name || lead.company_name || "",
    subject: "A few questions about your project — Beplugged Tech",
    htmlContent: emailShell({
      label: "Project Questionnaire",
      accent: "#F05023",
      bodyHtml,
    }),
  });

  await recordAudit(env, {
    action: "questionnaire_sent",
    entity_type: "lead",
    entity_id: lead.id,
    entity_number: lead.company_name,
    details: { recipient: lead.email },
  });

  return json({ success: true, url });
}

async function handleSendQuote(request, env, quoteId) {
  await ensureOperationalSchema(env);
  const quote = await requireQuote(env, quoteId);

  const items = parseStoredItems(quote.items);
  const itemsRows = items.length
    ? items
        .map((item, i) => {
          const quantity = Number(item.quantity || 1);
          const rate = Number(item.rate || 0);
          const discount = Number(item.discount || 0);
          const lineTotal = Math.max(quantity * rate - discount, 0);
          const bg = i % 2 ? "#ffffff" : "#fbfbfc";
          return `<tr style="background:${bg};">
            <td style="padding:10px 14px;font-size:13px;color:#2C2D3F;border-bottom:1px solid #eeeeee;">${escapeHtml(item.description || "Item")}</td>
            <td style="padding:10px 14px;font-size:13px;color:#555555;text-align:center;border-bottom:1px solid #eeeeee;">${escapeHtml(quantity)}</td>
            <td style="padding:10px 14px;font-size:13px;color:#555555;text-align:right;border-bottom:1px solid #eeeeee;">${formatMoney(rate)}</td>
            <td style="padding:10px 14px;font-size:13px;color:#2C2D3F;text-align:right;border-bottom:1px solid #eeeeee;">${formatMoney(lineTotal)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" style="padding:10px 14px;font-size:13px;color:#2C2D3F;">${escapeHtml(quote.notes || "As discussed")}</td></tr>`;

  const total = Number(quote.amount || 0) + Number(quote.tax || 0);
  const expiry = quote.expiry_date
    ? new Date(quote.expiry_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const quoteUrl = quotePublicUrl(request, quote.id);

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:16px;color:#2C2D3F;">Hi ${escapeHtml(quote.client_name || "there")},</p>
    <p style="margin:0 0 22px;font-size:14px;color:#555555;line-height:1.7;">Thank you for the opportunity. Here is your quote <strong>${escapeHtml(quote.quote_number)}</strong>. Use the button below to view the full breakdown.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F1;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;color:#a06a58;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Quoted Total</div>
        <div style="font-size:30px;font-weight:bold;color:#F05023;margin-top:6px;">${formatMoney(total)}</div>
        ${expiry ? `<div style="font-size:13px;color:#7a7a80;margin-top:6px;">Valid until ${escapeHtml(expiry)}</div>` : ""}
      </td></tr>
    </table>
    ${emailButton(quoteUrl, "View Quote")}
    ${emailSectionLabel("Quote Summary")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;margin:0 0 20px;">
      <thead><tr style="background:#2C2D3F;">
        <th align="left" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Description</th>
        <th align="center" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Qty</th>
        <th align="right" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Rate</th>
        <th align="right" style="padding:11px 14px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Amount</th>
      </tr></thead>
      <tbody>${itemsRows}</tbody>
      <tfoot><tr>
        <td colspan="3" align="right" style="padding:12px 14px;font-size:14px;font-weight:bold;color:#2C2D3F;border-top:2px solid #eeeeee;">Total</td>
        <td align="right" style="padding:12px 14px;font-size:15px;font-weight:bold;color:#F05023;border-top:2px solid #eeeeee;">${formatMoney(total)}</td>
      </tr></tfoot>
    </table>
    ${quote.notes ? `${emailSectionLabel("Notes")}<table role="presentation" width="100%" style="background:#fafafb;border:1px solid #eeeeee;border-radius:8px;"><tr><td style="padding:16px 18px;font-size:13px;color:#2C2D3F;line-height:1.9;">${escapeHtmlWithBreaks(quote.notes)}</td></tr></table>` : ""}
  `;

  await sendBrevoEmail(env, {
    to: quote.client_email,
    toName: quote.client_name || "",
    subject: `Quote ${quote.quote_number} from Beplugged Tech`,
    htmlContent: emailShell({
      label: `Quote ${quote.quote_number}`,
      accent: "#F05023",
      bodyHtml,
    }),
  });

  const issued = await issueQuote(env, request, quote);
  await recordAudit(env, {
    action: "sent",
    entity_type: "quote",
    entity_id: quote.id,
    entity_number: quote.quote_number,
    details: { recipient: quote.client_email },
  });

  return json({
    success: true,
    status: issued.status,
    public_url: issued.public_url,
  });
}

async function handleLeads(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const leadId = segments[4];

  if (leadId && segments[5] === "questionnaire") {
    return handleLeadQuestionnaire(request, env, leadId, method, segments[6]);
  }

  if (leadId && segments[5] === "overview" && method === "GET") {
    return handleLeadOverview(request, env, leadId);
  }

  if (method === "GET" && !leadId) {
    const result = await env.DB.prepare(
      `SELECT * FROM leads
       ORDER BY
         CASE stage
           WHEN 'new' THEN 1
           WHEN 'qualified' THEN 2
           WHEN 'meeting' THEN 3
           WHEN 'requirements' THEN 4
           WHEN 'proposal' THEN 5
           WHEN 'won' THEN 6
           WHEN 'lost' THEN 7
           ELSE 8
         END,
         COALESCE(next_follow_up, '9999-12-31') ASC,
         updated_at DESC
       LIMIT 200`,
    ).all();
    return json(result.results || []);
  }

  if (method === "GET" && leadId) {
    const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
      .bind(leadId)
      .first();
    return json(lead || { error: "Lead not found" }, lead ? {} : { status: 404 });
  }

  if (method === "POST" && !leadId) {
    const data = normalizeLeadPayload(await parseRequestJson(request));
    const id = createEntityId("lead");
    await env.DB.prepare(
      `INSERT INTO leads (
         id, company_name, contact_name, email, phone, source, stage, priority,
         estimated_value, estimated_value_cents, next_follow_up, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.company_name,
        data.contact_name,
        data.email,
        data.phone,
        data.source,
        data.stage,
        data.priority,
        data.estimated_value,
        data.estimated_value_cents,
        data.next_follow_up,
        data.notes,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "lead",
      entity_id: id,
      entity_number: data.company_name,
      details: { stage: data.stage, source: data.source },
    });
    return json({ id, ...data }, { status: 201 });
  }

  if (method === "PUT" && leadId) {
    const existing = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
      .bind(leadId)
      .first();
    if (!existing) {
      throw new RequestError("Lead not found", 404);
    }
    const data = normalizeLeadPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE leads SET
         company_name = ?, contact_name = ?, email = ?, phone = ?, source = ?,
         stage = ?, priority = ?, estimated_value = ?, estimated_value_cents = ?,
         next_follow_up = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.company_name,
        data.contact_name,
        data.email,
        data.phone,
        data.source,
        data.stage,
        data.priority,
        data.estimated_value,
        data.estimated_value_cents,
        data.next_follow_up,
        data.notes,
        leadId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "lead",
      entity_id: leadId,
      entity_number: data.company_name,
      details: { previous_stage: existing.stage, stage: data.stage },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && leadId) {
    const existing = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
      .bind(leadId)
      .first();
    if (!existing) {
      throw new RequestError("Lead not found", 404);
    }
    await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(leadId).run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "lead",
      entity_id: leadId,
      entity_number: existing.company_name,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleLeadOverview(request, env, leadId) {
  await ensureSchema(env);
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
    .bind(leadId)
    .first();
  if (!lead) {
    throw new RequestError("Lead not found", 404);
  }

  const emailKey = crmEmailKey(lead.email);
  const clientRows = await env.DB.prepare(
    `SELECT * FROM clients
     WHERE lead_id = ? OR (? != '' AND LOWER(TRIM(email)) = ?)
     ORDER BY created_at DESC
     LIMIT 20`,
  )
    .bind(leadId, emailKey, emailKey)
    .all();
  const clients = clientRows.results || [];
  const firstClient = clients[0] || null;
  const relatedClientId = firstClient?.id || "";

  const relation = clientOverviewRelation(relatedClientId, leadId, emailKey, "i");
  const quoteRelation = clientOverviewRelation(relatedClientId, leadId, emailKey, "q");
  const contactRelation = clientOverviewRelation(relatedClientId, leadId, emailKey, "c");
  const activityRelation = clientOverviewRelation(relatedClientId, leadId, emailKey, "a");

  const invoiceTotalCentsSql = `(
    CASE
      WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0)
        THEN i.amount_cents
      ELSE ROUND(i.amount * 100)
    END
    +
    CASE
      WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0)
        THEN i.tax_cents
      ELSE ROUND(i.tax * 100)
    END
  )`;
  const quoteTotalCentsSql = `(
    CASE
      WHEN q.amount_cents IS NOT NULL AND (q.amount_cents != 0 OR q.amount = 0)
        THEN q.amount_cents
      ELSE ROUND(q.amount * 100)
    END
    +
    CASE
      WHEN q.tax_cents IS NOT NULL AND (q.tax_cents != 0 OR q.tax = 0)
        THEN q.tax_cents
      ELSE ROUND(q.tax * 100)
    END
  )`;
  const paymentCentsSql = `
    CASE
      WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0)
        THEN p.amount_cents
      ELSE ROUND(p.amount * 100)
    END`;

  const quoteRows = await env.DB.prepare(
    `SELECT q.id, q.quote_number, q.lead_id, q.client_id, q.client_name,
            q.client_email, q.client_address, q.amount, q.tax, q.status,
            q.created_at, q.expiry_date, q.notes, ${quoteTotalCentsSql} as total_cents
     FROM quotes q
     WHERE ${quoteRelation.where}
     ORDER BY q.created_at DESC
     LIMIT 100`,
  )
    .bind(...quoteRelation.params)
    .all();
  const quotes = (quoteRows.results || []).map((quote) => ({
    ...quote,
    total_due: centsToAmount(Number(quote.total_cents || 0)),
  }));

  const invoiceRows = await env.DB.prepare(
    `SELECT i.id, i.invoice_number, i.lead_id, i.client_id, i.quote_id,
            i.client_name, i.client_email, i.client_address, i.amount, i.tax,
            i.status, i.created_at, i.due_date, i.payment_terms, i.notes,
            ${invoiceTotalCentsSql} as total_cents,
            COALESCE((
              SELECT SUM(${paymentCentsSql})
              FROM payments p
              WHERE p.invoice_id = i.id
            ), 0) as paid_cents
     FROM invoices i
     WHERE ${relation.where}
     ORDER BY i.created_at DESC
     LIMIT 100`,
  )
    .bind(...relation.params)
    .all();
  const invoices = (invoiceRows.results || []).map((invoice) => {
    const totalCents = Number(invoice.total_cents || 0);
    const paidCents = Number(invoice.paid_cents || 0);
    return {
      ...invoice,
      total_due: centsToAmount(totalCents),
      total_paid: centsToAmount(paidCents),
      balance_due: centsToAmount(Math.max(totalCents - paidCents, 0)),
    };
  });

  const receiptRows = await env.DB.prepare(
    `SELECT p.id, p.invoice_id, p.amount, p.amount_cents, p.payment_date,
            p.payment_method, p.notes, p.created_at,
            i.invoice_number, i.client_name, i.client_email
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     WHERE ${relation.where}
     ORDER BY COALESCE(p.payment_date, p.created_at) DESC
     LIMIT 100`,
  )
    .bind(...relation.params)
    .all();
  const receipts = (receiptRows.results || []).map((payment) => ({
    ...payment,
    amount: centsToAmount(
      persistedCents(payment, "amount_cents", "amount", "Payment amount"),
    ),
    receipt_number: receiptNumberFor(payment),
  }));

  const contactRows = await env.DB.prepare(
    `${crmContactSelect()}
     WHERE ${contactRelation.where}
     ORDER BY c.is_primary DESC, c.updated_at DESC, c.created_at DESC
     LIMIT 100`,
  )
    .bind(...contactRelation.params)
    .all();
  const contacts = (contactRows.results || []).map((contact) => ({
    ...contact,
    is_primary: Number(contact.is_primary || 0) === 1,
  }));

  const activityRows = await env.DB.prepare(
    `${crmActivitySelect()}
     WHERE ${activityRelation.where}
     ORDER BY
       CASE WHEN a.status = 'planned' THEN 0 ELSE 1 END,
       COALESCE(a.due_date, a.occurred_at, a.created_at) DESC,
       a.updated_at DESC
     LIMIT 100`,
  )
    .bind(...activityRelation.params)
    .all();
  const activities = activityRows.results || [];

  const totalsRow = await env.DB.prepare(
    `WITH related_invoices AS (
       SELECT i.id, i.status, ${invoiceTotalCentsSql} as total_cents,
              COALESCE((
                SELECT SUM(${paymentCentsSql})
                FROM payments p
                WHERE p.invoice_id = i.id
              ), 0) as paid_cents
       FROM invoices i
       WHERE ${relation.where}
     )
     SELECT
       COUNT(*) as invoice_count,
       COALESCE(SUM(CASE WHEN status != 'draft' THEN total_cents ELSE 0 END), 0) as invoiced_cents,
       COALESCE(SUM(CASE WHEN status != 'draft' THEN paid_cents ELSE 0 END), 0) as paid_cents,
       COALESCE(SUM(
         CASE WHEN status != 'draft' THEN MAX(total_cents - paid_cents, 0) ELSE 0 END
       ), 0) as outstanding_cents
     FROM related_invoices`,
  )
    .bind(...relation.params)
    .first();
  const quoteCountRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM quotes q WHERE ${quoteRelation.where}`,
  )
    .bind(...quoteRelation.params)
    .first();
  const plannedActivitiesRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM crm_activities a
     WHERE ${activityRelation.where} AND a.status = 'planned'`,
  )
    .bind(...activityRelation.params)
    .first();
  const overdueActivitiesRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM crm_activities a
     WHERE ${activityRelation.where}
       AND a.status = 'planned'
       AND a.due_date IS NOT NULL
       AND a.due_date < date('now')`,
  )
    .bind(...activityRelation.params)
    .first();
  const questionnaire = await env.DB.prepare(
    "SELECT * FROM lead_questionnaires WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
  )
    .bind(leadId)
    .first();

  return json({
    lead,
    questionnaire: questionnaire
      ? {
          ...questionnaire,
          url: questionnaireUrl(request, questionnaire.token),
        }
      : null,
    clients,
    quotes,
    invoices,
    receipts,
    contacts,
    activities,
    kpis: {
      quote_count: Number(quoteCountRow?.count || 0),
      invoice_count: Number(totalsRow?.invoice_count || 0),
      total_invoiced: centsToAmount(Number(totalsRow?.invoiced_cents || 0)),
      total_paid: centsToAmount(Number(totalsRow?.paid_cents || 0)),
      outstanding: centsToAmount(Number(totalsRow?.outstanding_cents || 0)),
      planned_activities: Number(plannedActivitiesRow?.count || 0),
      overdue_activities: Number(overdueActivitiesRow?.count || 0),
      contact_count: contacts.length,
    },
  });
}

function crmEmailKey(value) {
  return String(value || "").trim().toLowerCase();
}

function crmRelationFilter(searchParams, alias) {
  const prefix = alias ? `${alias}.` : "";
  const leadId = trimText(searchParams.get("lead_id"), "Lead id", {
    maxLength: 160,
  });
  const clientId = trimText(searchParams.get("client_id"), "Client id", {
    maxLength: 160,
  });
  const clientEmail = crmEmailKey(searchParams.get("client_email"));

  if (!leadId && !clientId && !clientEmail) {
    return { where: "1 = ?", params: [1] };
  }

  return {
    where: `(
      (? != '' AND ${prefix}lead_id = ?)
      OR (? != '' AND ${prefix}client_id = ?)
      OR (? != '' AND LOWER(TRIM(${prefix}client_email)) = ?)
    )`,
    params: [
      leadId,
      leadId,
      clientId,
      clientId,
      clientEmail,
      clientEmail,
    ],
  };
}

function crmContactSelect() {
  return `SELECT c.*,
                 COALESCE(l.company_name, '') as lead_name,
                 COALESCE(saved.name, c.client_name, '') as resolved_client_name
          FROM crm_contacts c
          LEFT JOIN leads l ON l.id = c.lead_id
          LEFT JOIN clients saved ON saved.id = c.client_id`;
}

function crmActivitySelect() {
  return `SELECT a.*,
                 COALESCE(contact.name, '') as contact_name,
                 COALESCE(l.company_name, '') as lead_name,
                 COALESCE(saved.name, a.client_name, '') as resolved_client_name
          FROM crm_activities a
          LEFT JOIN crm_contacts contact ON contact.id = a.contact_id
          LEFT JOIN leads l ON l.id = a.lead_id
          LEFT JOIN clients saved ON saved.id = a.client_id`;
}

async function handleCrm(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const resource = segments[4];
  const recordId = segments[5];

  if (resource === "contacts") {
    return handleCrmContacts(request, env, method, recordId);
  }

  if (resource === "activities") {
    return handleCrmActivities(request, env, method, recordId);
  }

  if (resource === "summary" && method === "GET") {
    return handleCrmSummary(env);
  }

  return json({ error: "CRM route not found" }, { status: 404 });
}

async function requireCrmContact(env, contactId) {
  const contact = await env.DB.prepare("SELECT * FROM crm_contacts WHERE id = ?")
    .bind(contactId)
    .first();
  if (!contact) {
    throw new RequestError("Contact not found", 404);
  }
  return contact;
}

async function requireCrmActivity(env, activityId) {
  const activity = await env.DB.prepare("SELECT * FROM crm_activities WHERE id = ?")
    .bind(activityId)
    .first();
  if (!activity) {
    throw new RequestError("Activity not found", 404);
  }
  return activity;
}

async function handleCrmContacts(request, env, method, contactId) {
  if (method === "GET" && contactId) {
    const contact = await env.DB.prepare(`${crmContactSelect()} WHERE c.id = ?`)
      .bind(contactId)
      .first();
    return json(
      contact || { error: "Contact not found" },
      contact ? {} : { status: 404 },
    );
  }

  if (method === "GET") {
    const url = new URL(request.url);
    const relation = crmRelationFilter(url.searchParams, "c");
    const rows = await env.DB.prepare(
      `${crmContactSelect()}
       WHERE ${relation.where}
       ORDER BY c.is_primary DESC, c.updated_at DESC, c.created_at DESC
       LIMIT 200`,
    )
      .bind(...relation.params)
      .all();
    return json(
      (rows.results || []).map((contact) => ({
        ...contact,
        is_primary: Number(contact.is_primary || 0) === 1,
      })),
    );
  }

  if (method === "POST") {
    const data = normalizeCrmContactPayload(await parseRequestJson(request));
    const id = createEntityId("contact");
    await env.DB.prepare(
      `INSERT INTO crm_contacts (
         id, lead_id, client_id, client_email, client_name, name, email, phone,
         role, is_primary, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.lead_id,
        data.client_id,
        data.client_email,
        data.client_name,
        data.name,
        data.email,
        data.phone,
        data.role,
        data.is_primary,
        data.notes,
      )
      .run();

    await recordAudit(env, {
      action: "created",
      entity_type: "crm_contact",
      entity_id: id,
      entity_number: data.name,
      details: {
        lead_id: data.lead_id,
        client_id: data.client_id,
        client_email: data.client_email,
      },
    });

    return json({ id, ...data, is_primary: data.is_primary === 1 }, { status: 201 });
  }

  if (method === "PUT" && contactId) {
    const existing = await requireCrmContact(env, contactId);
    const data = normalizeCrmContactPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE crm_contacts SET
         lead_id = ?, client_id = ?, client_email = ?, client_name = ?,
         name = ?, email = ?, phone = ?, role = ?, is_primary = ?,
         notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.lead_id,
        data.client_id,
        data.client_email,
        data.client_name,
        data.name,
        data.email,
        data.phone,
        data.role,
        data.is_primary,
        data.notes,
        contactId,
      )
      .run();

    await recordAudit(env, {
      action: "updated",
      entity_type: "crm_contact",
      entity_id: contactId,
      entity_number: data.name,
      details: { previous_name: existing.name },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && contactId) {
    const existing = await requireCrmContact(env, contactId);
    await env.DB.prepare("DELETE FROM crm_contacts WHERE id = ?")
      .bind(contactId)
      .run();
    await env.DB.prepare(
      "UPDATE crm_activities SET contact_id = '' WHERE contact_id = ?",
    )
      .bind(contactId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "crm_contact",
      entity_id: contactId,
      entity_number: existing.name,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleCrmActivities(request, env, method, activityId) {
  if (method === "GET" && activityId) {
    const activity = await env.DB.prepare(`${crmActivitySelect()} WHERE a.id = ?`)
      .bind(activityId)
      .first();
    return json(
      activity || { error: "Activity not found" },
      activity ? {} : { status: 404 },
    );
  }

  if (method === "GET") {
    const url = new URL(request.url);
    const relation = crmRelationFilter(url.searchParams, "a");
    const clauses = [relation.where];
    const params = [...relation.params];
    const status = trimText(url.searchParams.get("status"), "Activity status", {
      maxLength: 80,
    });
    if (status) {
      const normalizedStatus = normalizeKey(
        status,
        "Activity status",
        CRM_ACTIVITY_STATUSES,
        "planned",
      );
      clauses.push("a.status = ?");
      params.push(normalizedStatus);
    }

    const due = trimText(url.searchParams.get("due"), "Due filter", {
      maxLength: 20,
    });
    if (due === "overdue") {
      clauses.push("a.status = 'planned' AND a.due_date IS NOT NULL AND a.due_date < date('now')");
    } else if (due === "upcoming") {
      clauses.push("a.status = 'planned' AND (a.due_date IS NULL OR a.due_date >= date('now'))");
    } else if (due && due !== "all") {
      throw new RequestError("Due filter is invalid");
    }

    const rows = await env.DB.prepare(
      `${crmActivitySelect()}
       WHERE ${clauses.join(" AND ")}
       ORDER BY
         CASE WHEN a.status = 'planned' THEN 0 ELSE 1 END,
         COALESCE(a.due_date, a.occurred_at, a.created_at) DESC,
         a.updated_at DESC
       LIMIT 200`,
    )
      .bind(...params)
      .all();
    return json(rows.results || []);
  }

  if (method === "POST") {
    const data = normalizeCrmActivityPayload(await parseRequestJson(request));
    const id = createEntityId("activity");
    await env.DB.prepare(
      `INSERT INTO crm_activities (
         id, lead_id, client_id, client_email, client_name, contact_id,
         activity_type, status, title, description, due_date, occurred_at,
         completed_at, owner
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.lead_id,
        data.client_id,
        data.client_email,
        data.client_name,
        data.contact_id,
        data.activity_type,
        data.status,
        data.title,
        data.description,
        data.due_date,
        data.occurred_at,
        data.completed_at,
        data.owner,
      )
      .run();

    await recordAudit(env, {
      action: "created",
      entity_type: "crm_activity",
      entity_id: id,
      entity_number: data.title,
      details: {
        activity_type: data.activity_type,
        status: data.status,
        due_date: data.due_date,
      },
    });

    return json({ id, ...data }, { status: 201 });
  }

  if (method === "PUT" && activityId) {
    const existing = await requireCrmActivity(env, activityId);
    const data = normalizeCrmActivityPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE crm_activities SET
         lead_id = ?, client_id = ?, client_email = ?, client_name = ?,
         contact_id = ?, activity_type = ?, status = ?, title = ?,
         description = ?, due_date = ?, occurred_at = ?, completed_at = ?,
         owner = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.lead_id,
        data.client_id,
        data.client_email,
        data.client_name,
        data.contact_id,
        data.activity_type,
        data.status,
        data.title,
        data.description,
        data.due_date,
        data.occurred_at,
        data.completed_at,
        data.owner,
        activityId,
      )
      .run();

    await recordAudit(env, {
      action: "updated",
      entity_type: "crm_activity",
      entity_id: activityId,
      entity_number: data.title,
      details: { previous_status: existing.status, status: data.status },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && activityId) {
    const existing = await requireCrmActivity(env, activityId);
    await env.DB.prepare("DELETE FROM crm_activities WHERE id = ?")
      .bind(activityId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "crm_activity",
      entity_id: activityId,
      entity_number: existing.title,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleCrmSummary(env) {
  const contactsRow = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM crm_contacts",
  ).first();
  const plannedRow = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM crm_activities WHERE status = 'planned'",
  ).first();
  const overdueRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM crm_activities
     WHERE status = 'planned' AND due_date IS NOT NULL AND due_date < date('now')`,
  ).first();
  const dueTodayRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM crm_activities
     WHERE status = 'planned' AND due_date = date('now')`,
  ).first();

  const upcomingRows = await env.DB.prepare(
    `${crmActivitySelect()}
     WHERE a.status = 'planned'
     ORDER BY COALESCE(a.due_date, '9999-12-31') ASC, a.created_at DESC
     LIMIT 8`,
  ).all();
  const recentRows = await env.DB.prepare(
    `${crmActivitySelect()}
     ORDER BY a.created_at DESC
     LIMIT 8`,
  ).all();

  return json({
    kpis: {
      contacts: Number(contactsRow?.count || 0),
      planned_activities: Number(plannedRow?.count || 0),
      overdue_activities: Number(overdueRow?.count || 0),
      due_today: Number(dueTodayRow?.count || 0),
    },
    upcoming: upcomingRows.results || [],
    recent: recentRows.results || [],
  });
}

async function handleRequirements(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const requirementId = segments[4];

  if (method === "GET" && !requirementId) {
    const result = await env.DB.prepare(
      `SELECT * FROM requirements
       ORDER BY
         CASE status
           WHEN 'discovery' THEN 1
           WHEN 'draft' THEN 2
           WHEN 'review' THEN 3
           WHEN 'approved' THEN 4
           WHEN 'converted' THEN 5
           ELSE 6
         END,
         COALESCE(due_date, '9999-12-31') ASC,
         updated_at DESC
       LIMIT 200`,
    ).all();
    return json(result.results || []);
  }

  if (method === "GET" && requirementId) {
    const requirement = await env.DB.prepare(
      "SELECT * FROM requirements WHERE id = ?",
    )
      .bind(requirementId)
      .first();
    return json(
      requirement || { error: "Requirement not found" },
      requirement ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !requirementId) {
    const data = normalizeRequirementPayload(await parseRequestJson(request));
    const id = createEntityId("req");
    const requirementNumber = generateDocumentNumber("REQ");
    await env.DB.prepare(
      `INSERT INTO requirements (
         id, requirement_number, title, client_name, contact_name, template,
         status, priority, owner, due_date, goals, scope, constraints, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        requirementNumber,
        data.title,
        data.client_name,
        data.contact_name,
        data.template,
        data.status,
        data.priority,
        data.owner,
        data.due_date,
        data.goals,
        data.scope,
        data.constraints,
        data.notes,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "requirement",
      entity_id: id,
      entity_number: requirementNumber,
      details: { client: data.client_name, template: data.template },
    });
    return json({ id, requirement_number: requirementNumber, ...data }, { status: 201 });
  }

  if (method === "PUT" && requirementId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM requirements WHERE id = ?",
    )
      .bind(requirementId)
      .first();
    if (!existing) {
      throw new RequestError("Requirement not found", 404);
    }
    const data = normalizeRequirementPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE requirements SET
         title = ?, client_name = ?, contact_name = ?, template = ?, status = ?,
         priority = ?, owner = ?, due_date = ?, goals = ?, scope = ?,
         constraints = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.title,
        data.client_name,
        data.contact_name,
        data.template,
        data.status,
        data.priority,
        data.owner,
        data.due_date,
        data.goals,
        data.scope,
        data.constraints,
        data.notes,
        requirementId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "requirement",
      entity_id: requirementId,
      entity_number: existing.requirement_number,
      details: { previous_status: existing.status, status: data.status },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && requirementId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM requirements WHERE id = ?",
    )
      .bind(requirementId)
      .first();
    if (!existing) {
      throw new RequestError("Requirement not found", 404);
    }
    await env.DB.prepare("DELETE FROM requirements WHERE id = ?")
      .bind(requirementId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "requirement",
      entity_id: requirementId,
      entity_number: existing.requirement_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

const MILESTONE_STATUSES = new Set(["pending", "active", "done", "blocked"]);
const TASK_STATUSES = new Set(["todo", "doing", "done", "blocked"]);

// Progress is computed from tasks where they exist, so the percentage is
// earned rather than typed. A milestone with no tasks counts by its status.
function milestoneProgress(milestone, tasks) {
  const own = tasks.filter((t) => t.milestone_id === milestone.id);
  if (!own.length) {
    return { percent: milestone.status === "done" ? 100 : 0, done: 0, total: 0 };
  }
  const done = own.filter((t) => t.status === "done").length;
  return { percent: Math.round((done / own.length) * 100), done, total: own.length };
}

// Average of the milestones' own progress. Counting tasks project-wide looked
// simpler but silently discarded any milestone that was done without tasks
// under it, so completing one and then adding a task elsewhere sent the figure
// backwards to zero.
function projectProgress(milestones, tasks) {
  if (!milestones.length) return 0;
  const total = milestones.reduce(
    (sum, m) => sum + milestoneProgress(m, tasks).percent,
    0,
  );
  return Math.round(total / milestones.length);
}

async function loadProjectPlan(env, projectId) {
  const milestones = await env.DB.prepare(
    "SELECT * FROM project_milestones WHERE project_id = ? ORDER BY position ASC, created_at ASC",
  )
    .bind(projectId)
    .all();
  const tasks = await env.DB.prepare(
    "SELECT * FROM milestone_tasks WHERE project_id = ? ORDER BY position ASC, created_at ASC",
  )
    .bind(projectId)
    .all();
  const ms = milestones.results || [];
  const ts = tasks.results || [];
  return {
    milestones: ms.map((m) => ({ ...m, ...milestoneProgress(m, ts), tasks: ts.filter((t) => t.milestone_id === m.id) })),
    tasks: ts,
    percent: projectProgress(ms, ts),
  };
}

// Keeps projects.progress in step with the plan, so the dashboard and the
// client link never disagree.
async function syncProjectProgress(env, projectId) {
  const plan = await loadProjectPlan(env, projectId);
  await env.DB.prepare(
    "UPDATE projects SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(plan.percent, projectId)
    .run();
  return plan;
}

async function nextPosition(env, table, column, value) {
  const row = await env.DB.prepare(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM ${table} WHERE ${column} = ?`,
  )
    .bind(value)
    .first();
  return Number(row?.next || 0);
}

// What the client sees: milestones and their state, never the task detail
// underneath, and never anything about money.
async function handlePublicProgress(env, token) {
  await ensureSchema(env);
  if (!token) {
    return json({ error: "Not found" }, { status: 404 });
  }
  const project = await env.DB.prepare(
    "SELECT * FROM projects WHERE share_token = ?",
  )
    .bind(token)
    .first();
  if (!project) {
    return json({ error: "This link is no longer valid" }, { status: 404 });
  }
  const plan = await loadProjectPlan(env, project.id);
  return json({
    project_code: project.project_code,
    name: project.name,
    client_name: project.client_name,
    status: project.status,
    start_date: project.start_date,
    due_date: project.due_date,
    percent: plan.percent,
    milestones: plan.milestones.map((m) => ({
      title: m.title,
      description: m.description,
      status: m.status,
      due_date: m.due_date,
      percent: m.percent,
      done: m.done,
      total: m.total,
    })),
  });
}

async function handleMilestones(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const milestoneId = segments[4];
  const sub = segments[5];

  if (milestoneId && sub === "tasks") {
    return handleMilestoneTasks(request, env, milestoneId, method);
  }

  if (!milestoneId) {
    return json({ error: "Not found" }, { status: 404 });
  }

  const existing = await env.DB.prepare(
    "SELECT * FROM project_milestones WHERE id = ?",
  )
    .bind(milestoneId)
    .first();
  if (!existing) {
    throw new RequestError("Milestone not found", 404);
  }

  if (method === "PUT") {
    const raw = await parseRequestJson(request);
    const status = normalizeKey(raw.status, "Milestone status", MILESTONE_STATUSES, existing.status);
    await env.DB.prepare(
      `UPDATE project_milestones SET title = ?, description = ?, status = ?,
         due_date = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        trimText(raw.title, "Title", { required: true, maxLength: 240 }),
        trimText(raw.description, "Description", { maxLength: 3000 }),
        status,
        normalizeDate(raw.due_date, "Due date"),
        status === "done" ? existing.completed_at || new Date().toISOString() : null,
        milestoneId,
      )
      .run();
    const plan = await syncProjectProgress(env, existing.project_id);
    return json({ success: true, percent: plan.percent });
  }

  if (method === "DELETE") {
    await env.DB.prepare("DELETE FROM milestone_tasks WHERE milestone_id = ?")
      .bind(milestoneId)
      .run();
    await env.DB.prepare("DELETE FROM project_milestones WHERE id = ?")
      .bind(milestoneId)
      .run();
    const plan = await syncProjectProgress(env, existing.project_id);
    return json({ success: true, percent: plan.percent });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleMilestoneTasks(request, env, milestoneId, method) {
  const milestone = await env.DB.prepare(
    "SELECT * FROM project_milestones WHERE id = ?",
  )
    .bind(milestoneId)
    .first();
  if (!milestone) {
    throw new RequestError("Milestone not found", 404);
  }

  if (method === "POST") {
    const raw = await parseRequestJson(request);
    const id = createEntityId("task");
    await env.DB.prepare(
      `INSERT INTO milestone_tasks (id, milestone_id, project_id, title, status, position, owner, due_date)
       VALUES (?, ?, ?, ?, 'todo', ?, ?, ?)`,
    )
      .bind(
        id,
        milestoneId,
        milestone.project_id,
        trimText(raw.title, "Task", { required: true, maxLength: 240 }),
        await nextPosition(env, "milestone_tasks", "milestone_id", milestoneId),
        trimText(raw.owner, "Owner", { maxLength: 200 }),
        normalizeDate(raw.due_date, "Due date"),
      )
      .run();
    const plan = await syncProjectProgress(env, milestone.project_id);
    return json({ success: true, id, percent: plan.percent }, { status: 201 });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleTasks(request, env, path, method) {
  await ensureSchema(env);
  const taskId = path.split("/")[4];
  if (!taskId) {
    return json({ error: "Not found" }, { status: 404 });
  }
  const task = await env.DB.prepare("SELECT * FROM milestone_tasks WHERE id = ?")
    .bind(taskId)
    .first();
  if (!task) {
    throw new RequestError("Task not found", 404);
  }

  if (method === "PUT") {
    const raw = await parseRequestJson(request);
    const status = normalizeKey(raw.status, "Task status", TASK_STATUSES, task.status);
    await env.DB.prepare(
      `UPDATE milestone_tasks SET title = ?, status = ?, owner = ?, due_date = ?,
         completed_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        trimText(raw.title ?? task.title, "Task", { required: true, maxLength: 240 }),
        status,
        trimText(raw.owner ?? task.owner, "Owner", { maxLength: 200 }),
        raw.due_date === undefined ? task.due_date : normalizeDate(raw.due_date, "Due date"),
        status === "done" ? task.completed_at || new Date().toISOString() : null,
        taskId,
      )
      .run();
    await autoCompleteMilestone(env, task.milestone_id);
    const plan = await syncProjectProgress(env, task.project_id);
    return json({ success: true, percent: plan.percent });
  }

  if (method === "DELETE") {
    await env.DB.prepare("DELETE FROM milestone_tasks WHERE id = ?").bind(taskId).run();
    const plan = await syncProjectProgress(env, task.project_id);
    return json({ success: true, percent: plan.percent });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

// A milestone whose tasks are all done is done, and one that gains work again
// reopens, so the two never contradict each other.
async function autoCompleteMilestone(env, milestoneId) {
  const rows = await env.DB.prepare(
    "SELECT status FROM milestone_tasks WHERE milestone_id = ?",
  )
    .bind(milestoneId)
    .all();
  const tasks = rows.results || [];
  if (!tasks.length) return;
  const allDone = tasks.every((t) => t.status === "done");
  const any = tasks.some((t) => t.status === "doing" || t.status === "done");
  const status = allDone ? "done" : any ? "active" : "pending";
  await env.DB.prepare(
    `UPDATE project_milestones SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(status, allDone ? new Date().toISOString() : null, milestoneId)
    .run();
}

// Pulls the work items out of an agreement so an addendum listing five
// additions becomes five tasks rather than one opaque line. Bullets under a
// "not included" heading are skipped: they are explicitly not work.
function workItemsFromAgreement(body) {
  const lines = String(body || "").replace(/\r\n/g, "\n").split("\n");
  const items = [];
  let excluded = false;
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      excluded = /not included|exclusion|excluded|out of scope/i.test(heading[1]);
      continue;
    }
    if (excluded) continue;
    const bullet = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.*)$/);
    if (!bullet) continue;
    const title = bullet[1]
      .replace(/^\[[ xX]\]\s*/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
    if (title && title.length <= 240) items.push(title);
    if (items.length >= 30) break;
  }
  return items;
}

async function createMilestoneFromAgreement(env, agreement) {
  if (!agreement.linked_id) return null;
  const isAddendum = Number(agreement.version || 1) > 1;
  const id = createEntityId("ms");
  await env.DB.prepare(
    `INSERT INTO project_milestones (id, project_id, title, description, status, position, source_type, source_id)
     VALUES (?, ?, ?, ?, 'pending', ?, 'agreement', ?)`,
  )
    .bind(
      id,
      agreement.linked_id,
      isAddendum
        ? `Addendum ${agreement.version} — ${agreement.title}`
        : agreement.title,
      `Created when ${agreement.agreement_number} was confirmed by ${agreement.signed_name || "the client"}.`,
      await nextPosition(env, "project_milestones", "project_id", agreement.linked_id),
      agreement.id,
    )
    .run();

  // One task per work item in the document.
  const items = workItemsFromAgreement(agreement.body);
  let position = 0;
  for (const title of items) {
    await env.DB.prepare(
      `INSERT INTO milestone_tasks (id, milestone_id, project_id, title, status, position)
       VALUES (?, ?, ?, ?, 'todo', ?)`,
    )
      .bind(createEntityId("task"), id, agreement.linked_id, title, position++)
      .run();
  }

  await recordAudit(env, {
    action: "milestone_created_from_agreement",
    entity_type: "project",
    entity_id: agreement.linked_id,
    entity_number: agreement.agreement_number,
    details: { milestone_id: id, tasks: items.length },
  });
  await syncProjectProgress(env, agreement.linked_id);
  return id;
}

async function handleProjects(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const projectId = segments[4];
  const action = segments[5];

  if (projectId && action === "plan") {
    if (method === "GET") {
      return json(await loadProjectPlan(env, projectId));
    }
    if (method === "POST") {
      const raw = await parseRequestJson(request);
      const id = createEntityId("ms");
      await env.DB.prepare(
        `INSERT INTO project_milestones (id, project_id, title, description, status, position, due_date, source_type)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, 'manual')`,
      )
        .bind(
          id,
          projectId,
          trimText(raw.title, "Title", { required: true, maxLength: 240 }),
          trimText(raw.description, "Description", { maxLength: 3000 }),
          await nextPosition(env, "project_milestones", "project_id", projectId),
          normalizeDate(raw.due_date, "Due date"),
        )
        .run();
      const plan = await syncProjectProgress(env, projectId);
      return json({ success: true, id, percent: plan.percent }, { status: 201 });
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Read-only link the client can be given to follow progress.
  if (projectId && action === "share" && method === "POST") {
    const token = createQuestionnaireToken();
    await env.DB.prepare("UPDATE projects SET share_token = ? WHERE id = ?")
      .bind(token, projectId)
      .run();
    await recordAudit(env, {
      action: "progress_link_created",
      entity_type: "project",
      entity_id: projectId,
    });
    return json({
      success: true,
      url: `${new URL(request.url).origin}/progress/?t=${encodeURIComponent(token)}`,
    });
  }

  if (method === "GET" && !projectId) {
    // Roll up the linked invoices so a project shows what has been invoiced,
    // collected and is still outstanding against it.
    const result = await env.DB.prepare(
      `SELECT p.*,
              COALESCE(f.invoice_count, 0) AS invoice_count,
              COALESCE(f.invoiced_cents, 0) AS invoiced_cents,
              COALESCE(f.paid_cents, 0) AS paid_cents,
              MAX(COALESCE(f.invoiced_cents, 0) - COALESCE(f.paid_cents, 0), 0) AS outstanding_cents
       FROM projects p
       LEFT JOIN (
         SELECT i.project_id,
                COUNT(*) AS invoice_count,
                SUM(CASE WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0) THEN i.amount_cents ELSE ROUND(i.amount * 100) END + CASE WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0) THEN i.tax_cents ELSE ROUND(i.tax * 100) END) AS invoiced_cents,
                COALESCE((
                  SELECT SUM(CASE WHEN pay.amount_cents IS NOT NULL AND (pay.amount_cents != 0 OR pay.amount = 0) THEN pay.amount_cents ELSE ROUND(pay.amount * 100) END)
                  FROM payments pay
                  JOIN invoices i2 ON i2.id = pay.invoice_id
                  WHERE i2.project_id = i.project_id
                ), 0) AS paid_cents
         FROM invoices i
         WHERE i.project_id IS NOT NULL AND i.project_id != '' AND i.status != 'draft'
         GROUP BY i.project_id
       ) f ON f.project_id = p.id
       ORDER BY
         CASE p.status
           WHEN 'active' THEN 1
           WHEN 'planning' THEN 2
           WHEN 'on_hold' THEN 3
           WHEN 'completed' THEN 4
           WHEN 'cancelled' THEN 5
           ELSE 6
         END,
         COALESCE(p.due_date, '9999-12-31') ASC,
         p.updated_at DESC
       LIMIT 200`,
    ).all();
    return json(
      (result.results || []).map((row) => ({
        ...row,
        invoiced: centsToAmount(Number(row.invoiced_cents || 0)),
        paid: centsToAmount(Number(row.paid_cents || 0)),
        outstanding: centsToAmount(Number(row.outstanding_cents || 0)),
      })),
    );
  }

  if (method === "GET" && projectId) {
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projectId)
      .first();
    return json(
      project || { error: "Project not found" },
      project ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !projectId) {
    const data = normalizeProjectPayload(await parseRequestJson(request));
    const id = createEntityId("project");
    const projectCode = generateDocumentNumber("PRJ");
    await env.DB.prepare(
      `INSERT INTO projects (
         id, project_code, name, client_name, status, priority, owner,
         start_date, due_date, budget, budget_cents, progress, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        projectCode,
        data.name,
        data.client_name,
        data.status,
        data.priority,
        data.owner,
        data.start_date,
        data.due_date,
        data.budget,
        data.budget_cents,
        data.progress,
        data.notes,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "project",
      entity_id: id,
      entity_number: projectCode,
      details: { status: data.status, client: data.client_name },
    });
    return json({ id, project_code: projectCode, ...data }, { status: 201 });
  }

  if (method === "PUT" && projectId) {
    const existing = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projectId)
      .first();
    if (!existing) {
      throw new RequestError("Project not found", 404);
    }
    const data = normalizeProjectPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE projects SET
         name = ?, client_name = ?, status = ?, priority = ?, owner = ?,
         start_date = ?, due_date = ?, budget = ?, budget_cents = ?,
         progress = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.name,
        data.client_name,
        data.status,
        data.priority,
        data.owner,
        data.start_date,
        data.due_date,
        data.budget,
        data.budget_cents,
        data.progress,
        data.notes,
        projectId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "project",
      entity_id: projectId,
      entity_number: existing.project_code,
      details: { previous_status: existing.status, status: data.status },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && projectId) {
    const existing = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projectId)
      .first();
    if (!existing) {
      throw new RequestError("Project not found", 404);
    }
    await env.DB.prepare("DELETE FROM projects WHERE id = ?")
      .bind(projectId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "project",
      entity_id: projectId,
      entity_number: existing.project_code,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleDocuments(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const documentId = segments[4];

  if (method === "GET" && !documentId) {
    const result = await env.DB.prepare(
      `SELECT * FROM documents
       ORDER BY
         CASE status
           WHEN 'review' THEN 1
           WHEN 'draft' THEN 2
           WHEN 'approved' THEN 3
           WHEN 'archived' THEN 4
           ELSE 5
         END,
         COALESCE(review_date, '9999-12-31') ASC,
         updated_at DESC
       LIMIT 200`,
    ).all();
    return json(result.results || []);
  }

  if (method === "GET" && documentId) {
    const document = await env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(documentId)
      .first();
    return json(
      document || { error: "Document not found" },
      document ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !documentId) {
    const data = normalizeDocumentPayload(await parseRequestJson(request));
    const id = createEntityId("doc");
    await env.DB.prepare(
      `INSERT INTO documents (
         id, title, category, owner, status, version, review_date, linked_type,
         linked_id, location_url, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.title,
        data.category,
        data.owner,
        data.status,
        data.version,
        data.review_date,
        data.linked_type,
        data.linked_id,
        data.location_url,
        data.notes,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "document",
      entity_id: id,
      entity_number: data.title,
      details: { status: data.status, category: data.category },
    });
    return json({ id, ...data }, { status: 201 });
  }

  if (method === "PUT" && documentId) {
    const existing = await env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(documentId)
      .first();
    if (!existing) {
      throw new RequestError("Document not found", 404);
    }
    const data = normalizeDocumentPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE documents SET
         title = ?, category = ?, owner = ?, status = ?, version = ?,
         review_date = ?, linked_type = ?, linked_id = ?, location_url = ?,
         notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.title,
        data.category,
        data.owner,
        data.status,
        data.version,
        data.review_date,
        data.linked_type,
        data.linked_id,
        data.location_url,
        data.notes,
        documentId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "document",
      entity_id: documentId,
      entity_number: data.title,
      details: { previous_status: existing.status, status: data.status },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && documentId) {
    const existing = await env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(documentId)
      .first();
    if (!existing) {
      throw new RequestError("Document not found", 404);
    }
    await env.DB.prepare("DELETE FROM documents WHERE id = ?")
      .bind(documentId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "document",
      entity_id: documentId,
      entity_number: existing.title,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleQualityRecords(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const recordId = segments[4];
  const url = new URL(request.url);

  if (method === "GET" && !recordId) {
    const filterValue = trimText(url.searchParams.get("record_type"), "Record type", {
      maxLength: 80,
    });
    const recordTypeFilter = filterValue
      ? normalizeKey(
          filterValue,
          "Quality record type",
          QUALITY_RECORD_TYPES,
          "policy",
        )
      : "";
    const statement = env.DB.prepare(
      `SELECT * FROM quality_records
       ${recordTypeFilter ? "WHERE record_type = ?" : ""}
       ORDER BY
         CASE status
           WHEN 'review' THEN 1
           WHEN 'draft' THEN 2
           WHEN 'active' THEN 3
           WHEN 'closed' THEN 4
           WHEN 'archived' THEN 5
           ELSE 6
         END,
         COALESCE(review_date, due_date, '9999-12-31') ASC,
         updated_at DESC
       LIMIT 200`,
    );
    const result = recordTypeFilter
      ? await statement.bind(recordTypeFilter).all()
      : await statement.all();
    return json(result.results || []);
  }

  if (method === "GET" && recordId) {
    const record = await env.DB.prepare(
      "SELECT * FROM quality_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    return json(
      record || { error: "Quality record not found" },
      record ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !recordId) {
    const data = normalizeQualityPayload(await parseRequestJson(request));
    const id = createEntityId("qms");
    const recordNumber = generateDocumentNumber("QMS");
    await env.DB.prepare(
      `INSERT INTO quality_records (
         id, record_number, title, record_type, status, owner, project_name,
         due_date, review_date, evidence_url, description, notes, body
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        recordNumber,
        data.title,
        data.record_type,
        data.status,
        data.owner,
        data.project_name,
        data.due_date,
        data.review_date,
        data.evidence_url,
        data.description,
        data.notes,
        data.body,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "quality_record",
      entity_id: id,
      entity_number: recordNumber,
      details: { type: data.record_type, status: data.status },
    });
    return json({ id, record_number: recordNumber, ...data }, { status: 201 });
  }

  if (method === "PUT" && recordId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM quality_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    if (!existing) {
      throw new RequestError("Quality record not found", 404);
    }
    const data = normalizeQualityPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE quality_records SET
         title = ?, record_type = ?, status = ?, owner = ?, project_name = ?,
         due_date = ?, review_date = ?, evidence_url = ?, description = ?,
         notes = ?, body = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.title,
        data.record_type,
        data.status,
        data.owner,
        data.project_name,
        data.due_date,
        data.review_date,
        data.evidence_url,
        data.description,
        data.notes,
        data.body,
        recordId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "quality_record",
      entity_id: recordId,
      entity_number: existing.record_number,
      details: { previous_status: existing.status, status: data.status },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && recordId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM quality_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    if (!existing) {
      throw new RequestError("Quality record not found", 404);
    }
    await env.DB.prepare("DELETE FROM quality_records WHERE id = ?")
      .bind(recordId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "quality_record",
      entity_id: recordId,
      entity_number: existing.record_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleSecurityRecords(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const recordId = segments[4];

  if (method === "GET" && !recordId) {
    const result = await env.DB.prepare(
      `SELECT * FROM security_records
       ORDER BY
         CASE status
           WHEN 'open' THEN 1
           WHEN 'assessing' THEN 2
           WHEN 'active' THEN 3
           WHEN 'mitigated' THEN 4
           WHEN 'closed' THEN 5
           WHEN 'archived' THEN 6
           ELSE 7
         END,
         CASE risk_level
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           ELSE 5
         END,
         COALESCE(review_date, due_date, '9999-12-31') ASC,
         updated_at DESC
       LIMIT 200`,
    ).all();
    return json(result.results || []);
  }

  if (method === "GET" && recordId) {
    const record = await env.DB.prepare(
      "SELECT * FROM security_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    return json(
      record || { error: "Security record not found" },
      record ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !recordId) {
    const data = normalizeSecurityPayload(await parseRequestJson(request));
    const id = createEntityId("sec");
    const recordNumber = generateDocumentNumber("SEC");
    await env.DB.prepare(
      `INSERT INTO security_records (
         id, record_number, title, record_type, status, risk_level, owner,
         asset_name, due_date, review_date, evidence_url, description,
         mitigation, notes, body
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        recordNumber,
        data.title,
        data.record_type,
        data.status,
        data.risk_level,
        data.owner,
        data.asset_name,
        data.due_date,
        data.review_date,
        data.evidence_url,
        data.description,
        data.mitigation,
        data.notes,
        data.body,
      )
      .run();
    await recordAudit(env, {
      action: "created",
      entity_type: "security_record",
      entity_id: id,
      entity_number: recordNumber,
      details: {
        type: data.record_type,
        risk_level: data.risk_level,
        status: data.status,
      },
    });
    return json({ id, record_number: recordNumber, ...data }, { status: 201 });
  }

  if (method === "PUT" && recordId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM security_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    if (!existing) {
      throw new RequestError("Security record not found", 404);
    }
    const data = normalizeSecurityPayload(await parseRequestJson(request));
    await env.DB.prepare(
      `UPDATE security_records SET
         title = ?, record_type = ?, status = ?, risk_level = ?, owner = ?,
         asset_name = ?, due_date = ?, review_date = ?, evidence_url = ?,
         description = ?, mitigation = ?, notes = ?, body = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        data.title,
        data.record_type,
        data.status,
        data.risk_level,
        data.owner,
        data.asset_name,
        data.due_date,
        data.review_date,
        data.evidence_url,
        data.description,
        data.mitigation,
        data.notes,
        data.body,
        recordId,
      )
      .run();
    await recordAudit(env, {
      action: "updated",
      entity_type: "security_record",
      entity_id: recordId,
      entity_number: existing.record_number,
      details: {
        previous_status: existing.status,
        status: data.status,
        risk_level: data.risk_level,
      },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && recordId) {
    const existing = await env.DB.prepare(
      "SELECT * FROM security_records WHERE id = ?",
    )
      .bind(recordId)
      .first();
    if (!existing) {
      throw new RequestError("Security record not found", 404);
    }
    await env.DB.prepare("DELETE FROM security_records WHERE id = ?")
      .bind(recordId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "security_record",
      entity_id: recordId,
      entity_number: existing.record_number,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleTeamMembers(request, env, path, method) {
  await ensureSchema(env);
  const segments = path.split("/");
  const memberId = segments[4];

  if (method === "GET" && !memberId) {
    const result = await env.DB.prepare(
      "SELECT * FROM team_members ORDER BY active DESC, name ASC LIMIT 200",
    ).all();
    const members = (result.results || []).map((member) => ({
      ...member,
      permissions: parseStoredItems(member.permissions),
      active: Number(member.active || 0) === 1,
    }));
    return json(members);
  }

  if (method === "GET" && memberId) {
    const member = await env.DB.prepare("SELECT * FROM team_members WHERE id = ?")
      .bind(memberId)
      .first();
    return json(
      member
        ? {
            ...member,
            permissions: parseStoredItems(member.permissions),
            active: Number(member.active || 0) === 1,
          }
        : { error: "Team member not found" },
      member ? {} : { status: 404 },
    );
  }

  if (method === "POST" && !memberId) {
    const data = normalizeTeamMemberPayload(await parseRequestJson(request));
    const id = createEntityId("member");
    await runOrConflict(
      env.DB.prepare(
        `INSERT INTO team_members (id, name, email, role, department, permissions, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        data.name,
        data.email,
        data.role,
        data.department,
        JSON.stringify(data.permissions),
        data.active ? 1 : 0,
      ),
      "A team member with that email already exists",
    );
    await recordAudit(env, {
      action: "created",
      entity_type: "team_member",
      entity_id: id,
      entity_number: data.email,
      details: { role: data.role, department: data.department },
    });
    return json({ id, ...data }, { status: 201 });
  }

  if (method === "PUT" && memberId) {
    const existing = await env.DB.prepare("SELECT * FROM team_members WHERE id = ?")
      .bind(memberId)
      .first();
    if (!existing) {
      throw new RequestError("Team member not found", 404);
    }
    const data = normalizeTeamMemberPayload(await parseRequestJson(request));
    await runOrConflict(
      env.DB.prepare(
        `UPDATE team_members SET
           name = ?, email = ?, role = ?, department = ?, permissions = ?,
           active = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).bind(
        data.name,
        data.email,
        data.role,
        data.department,
        JSON.stringify(data.permissions),
        data.active ? 1 : 0,
        memberId,
      ),
      "Another team member already uses that email",
    );
    await recordAudit(env, {
      action: "updated",
      entity_type: "team_member",
      entity_id: memberId,
      entity_number: data.email,
      details: { previous_role: existing.role, role: data.role },
    });
    return json({ success: true });
  }

  if (method === "DELETE" && memberId) {
    const existing = await env.DB.prepare("SELECT * FROM team_members WHERE id = ?")
      .bind(memberId)
      .first();
    if (!existing) {
      throw new RequestError("Team member not found", 404);
    }
    await env.DB.prepare("DELETE FROM team_members WHERE id = ?")
      .bind(memberId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "team_member",
      entity_id: memberId,
      entity_number: existing.email,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleQuotes(request, env, path, method) {
  await ensureOperationalSchema(env);
  const segments = path.split("/");
  const quoteId = segments[4];
  const action = segments[5];

  if (method === "GET" && !quoteId) {
    const result = await env.DB.prepare(
      "SELECT id, quote_number, lead_id, client_id, client_name, client_email, client_address, amount, tax, status, created_at, expiry_date FROM quotes ORDER BY created_at DESC LIMIT 100",
    ).all();
    return json(result.results);
  }

  if (method === "GET" && quoteId) {
    const result = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
      .bind(quoteId)
      .first();
    return json(result || { error: "Not found" }, result ? {} : { status: 404 });
  }

  if (method === "POST" && quoteId && action === "send") {
    return handleSendQuote(request, env, quoteId);
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
      `INSERT INTO quotes (
         id, quote_number, lead_id, client_id, client_name, client_email,
         client_address, amount, amount_cents, tax, tax_cents, status,
         expiry_date, items, notes, qr_code_url
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        quoteNumber,
        data.lead_id,
        data.client_id,
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
      `UPDATE quotes SET
         lead_id = ?, client_id = ?, client_name = ?, client_email = ?,
         client_address = ?, amount = ?, amount_cents = ?, tax = ?,
         tax_cents = ?, status = ?, items = ?, notes = ?, expiry_date = ?
       WHERE id = ?`,
    )
      .bind(
        data.lead_id,
        data.client_id,
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
  const segments = path.split("/");
  const clientId = segments[4];
  const action = segments[5];

  if (method === "GET" && clientId === "overview") {
    return handleClientOverview(request, env);
  }

  if (method === "GET" && clientId && action === "overview") {
    return handleClientOverview(request, env, { client_id: clientId });
  }

  if (method === "GET" && clientId) {
    const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();
    return json(
      client || { error: "Client not found" },
      client ? {} : { status: 404 },
    );
  }

  if (method === "GET" && !clientId) {
    const result = await env.DB.prepare(
      `WITH invoice_balances AS (
         SELECT
           LOWER(TRIM(i.client_email)) as client_key,
           i.lead_id,
           i.client_id,
           i.client_email,
           i.client_name,
           i.status,
           (
             CASE
               WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0)
                 THEN i.amount_cents
               ELSE ROUND(i.amount * 100)
             END
             +
             CASE
               WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0)
                 THEN i.tax_cents
               ELSE ROUND(i.tax * 100)
             END
           ) as total_cents,
           COALESCE((
             SELECT SUM(
               CASE
                 WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0)
                   THEN p.amount_cents
                 ELSE ROUND(p.amount * 100)
               END
             )
             FROM payments p
             WHERE p.invoice_id = i.id
           ), 0) as paid_cents
         FROM invoices i
         WHERE TRIM(i.client_email) != ''
       ),
       invoice_rollups AS (
         SELECT
           client_key,
           MAX(client_email) as invoice_email,
           MAX(client_name) as invoice_name,
           MAX(lead_id) as invoice_lead_id,
           MAX(client_id) as invoice_client_id,
           COUNT(*) as invoice_count,
           SUM(CASE WHEN status != 'draft' THEN total_cents ELSE 0 END) as invoiced_cents,
           SUM(CASE WHEN status != 'draft' THEN paid_cents ELSE 0 END) as paid_cents,
           SUM(
             CASE
               WHEN status != 'draft' THEN MAX(total_cents - paid_cents, 0)
               ELSE 0
             END
           ) as outstanding_cents,
           SUM(
             CASE
               WHEN status NOT IN ('draft', 'paid') AND total_cents - paid_cents > 0
                 THEN 1
               ELSE 0
             END
           ) as outstanding_invoice_count
         FROM invoice_balances
         GROUP BY client_key
       ),
       client_keys AS (
         SELECT LOWER(TRIM(email)) as client_key FROM clients WHERE TRIM(email) != ''
         UNION
         SELECT client_key FROM invoice_rollups
       )
       SELECT
         COALESCE(c.id, '') as id,
         COALESCE(c.name, ir.invoice_name, ir.invoice_email) as name,
         COALESCE(c.email, ir.invoice_email) as email,
         COALESCE(c.phone, '') as phone,
         COALESCE(c.lead_id, ir.invoice_lead_id, '') as lead_id,
         COALESCE(c.address, '') as address,
         COALESCE(c.city, '') as city,
         COALESCE(c.state, '') as state,
         COALESCE(c.postal_code, '') as postal_code,
         COALESCE(c.country, '') as country,
         c.created_at,
         COALESCE(ir.invoice_count, 0) as invoice_count,
         COALESCE(ir.outstanding_invoice_count, 0) as outstanding_invoice_count,
         COALESCE(ir.invoiced_cents, 0) as invoiced_cents,
         COALESCE(ir.paid_cents, 0) as paid_cents,
         COALESCE(ir.outstanding_cents, 0) as outstanding_cents,
         CASE WHEN c.id IS NULL THEN 1 ELSE 0 END as derived_from_invoices
       FROM client_keys ck
       LEFT JOIN clients c ON LOWER(TRIM(c.email)) = ck.client_key
       LEFT JOIN invoice_rollups ir ON ir.client_key = ck.client_key
       ORDER BY outstanding_cents DESC, name COLLATE NOCASE ASC`,
    ).all();
    return json(
      (result.results || []).map((client) => ({
        ...client,
        invoice_count: Number(client.invoice_count || 0),
        outstanding_invoice_count: Number(client.outstanding_invoice_count || 0),
        total_invoiced: centsToAmount(Number(client.invoiced_cents || 0)),
        total_paid: centsToAmount(Number(client.paid_cents || 0)),
        outstanding: centsToAmount(Number(client.outstanding_cents || 0)),
        derived_from_invoices: Number(client.derived_from_invoices || 0) === 1,
      })),
    );
  }

  if (method === "POST" && !clientId) {
    const data = normalizeClientPayload(await parseRequestJson(request));
    const id = createEntityId("client");

    await runOrConflict(
      env.DB.prepare(
        `INSERT INTO clients (id, lead_id, name, email, phone, address, city, state, postal_code, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        data.lead_id || "",
        data.name,
        data.email,
        data.phone || "",
        data.address || "",
        data.city || "",
        data.state || "",
        data.postal_code || "",
        data.country || "",
      ),
      "A client with that email already exists",
    );

    await recordAudit(env, {
      action: "created",
      entity_type: "client",
      entity_id: id,
      entity_number: data.email,
    });

    return json({ id, ...data }, { status: 201 });
  }

  if (method === "PUT" && clientId) {
    const existing = await env.DB.prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();
    if (!existing) {
      throw new RequestError("Client not found", 404);
    }
    const data = normalizeClientPayload(await parseRequestJson(request));

    await runOrConflict(
      env.DB.prepare(
        `UPDATE clients SET
           lead_id = ?, name = ?, email = ?, phone = ?, address = ?, city = ?,
           state = ?, postal_code = ?, country = ?
         WHERE id = ?`,
      ).bind(
        data.lead_id || "",
        data.name,
        data.email,
        data.phone || "",
        data.address || "",
        data.city || "",
        data.state || "",
        data.postal_code || "",
        data.country || "",
        clientId,
      ),
      "A client with that email already exists",
    );

    await recordAudit(env, {
      action: "updated",
      entity_type: "client",
      entity_id: clientId,
      entity_number: data.email,
      details: { previous_email: existing.email },
    });

    return json({ success: true });
  }

  if (method === "DELETE" && clientId) {
    const existing = await env.DB.prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();
    if (!existing) {
      throw new RequestError("Client not found", 404);
    }
    await env.DB.prepare("DELETE FROM clients WHERE id = ?")
      .bind(clientId)
      .run();
    await recordAudit(env, {
      action: "deleted",
      entity_type: "client",
      entity_id: clientId,
      entity_number: existing.email,
    });
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

function clientOverviewEmailKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function resolveClientOverviewProfile(env, clientId, emailKey) {
  let profile = null;

  if (clientId) {
    profile = await env.DB.prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();
    if (!profile) {
      throw new RequestError("Client not found", 404);
    }
  }

  if (!profile && emailKey) {
    profile = await env.DB.prepare(
      "SELECT * FROM clients WHERE LOWER(TRIM(email)) = ?",
    )
      .bind(emailKey)
      .first();
  }

  if (!profile && emailKey) {
    const invoiceClient = await env.DB.prepare(
      `SELECT id as invoice_id, client_id, lead_id, client_name, client_email,
              client_address, created_at
       FROM invoices
       WHERE LOWER(TRIM(client_email)) = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
      .bind(emailKey)
      .first();
    if (invoiceClient) {
      profile = {
        id: "",
        client_id: invoiceClient.client_id || "",
        lead_id: invoiceClient.lead_id || "",
        name: invoiceClient.client_name || invoiceClient.client_email || "Invoice client",
        email: invoiceClient.client_email || emailKey,
        phone: "",
        address: invoiceClient.client_address || "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        created_at: invoiceClient.created_at,
        derived_from_invoices: true,
      };
    }
  }

  if (!profile) {
    throw new RequestError("Client not found", 404);
  }

  return {
    ...profile,
    id: profile.id || "",
    lead_id: profile.lead_id || "",
    name: profile.name || profile.client_name || profile.email || "Client",
    email: profile.email || profile.client_email || "",
    phone: profile.phone || "",
    address: profile.address || profile.client_address || "",
    city: profile.city || "",
    state: profile.state || "",
    postal_code: profile.postal_code || "",
    country: profile.country || "",
    derived_from_invoices: Boolean(profile.derived_from_invoices),
  };
}

async function resolveClientOverviewLead(env, profile, emailKey) {
  if (profile.lead_id) {
    const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?")
      .bind(profile.lead_id)
      .first();
    if (lead) {
      return lead;
    }
  }

  if (emailKey) {
    const lead = await env.DB.prepare(
      `SELECT * FROM leads
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY CASE WHEN stage = 'won' THEN 0 ELSE 1 END, updated_at DESC
       LIMIT 1`,
    )
      .bind(emailKey)
      .first();
    if (lead) {
      return lead;
    }
  }

  const nameKey = String(profile.name || "").trim().toLowerCase();
  if (!nameKey) {
    return null;
  }

  return await env.DB.prepare(
    `SELECT * FROM leads
     WHERE LOWER(TRIM(company_name)) = ? OR LOWER(TRIM(contact_name)) = ?
     ORDER BY CASE WHEN stage = 'won' THEN 0 ELSE 1 END, updated_at DESC
     LIMIT 1`,
  )
    .bind(nameKey, nameKey)
    .first();
}

function clientOverviewRelation(clientId, leadId, emailKey, alias) {
  const prefix = alias ? `${alias}.` : "";
  return {
    where: `(
      (? != '' AND ${prefix}client_id = ?)
      OR (? != '' AND ${prefix}lead_id = ?)
      OR (? != '' AND LOWER(TRIM(${prefix}client_email)) = ?)
    )`,
    params: [
      clientId || "",
      clientId || "",
      leadId || "",
      leadId || "",
      emailKey || "",
      emailKey || "",
    ],
  };
}

async function handleClientOverview(request, env, explicit = {}) {
  const url = new URL(request.url);
  const requestedClientId = explicit.client_id || url.searchParams.get("client_id") || "";
  const requestedEmailKey = clientOverviewEmailKey(url.searchParams.get("email"));

  if (!requestedClientId && !requestedEmailKey) {
    throw new RequestError("Client id or email is required");
  }

  const profile = await resolveClientOverviewProfile(
    env,
    requestedClientId,
    requestedEmailKey,
  );
  const emailKey = clientOverviewEmailKey(profile.email || requestedEmailKey);
  const lead = await resolveClientOverviewLead(env, profile, emailKey);
  if (!profile.lead_id && lead?.id) {
    profile.lead_id = lead.id;
  }

  const relatedClientId = profile.id || profile.client_id || "";
  const relatedLeadId = profile.lead_id || lead?.id || "";
  const invoiceRelation = clientOverviewRelation(
    relatedClientId,
    relatedLeadId,
    emailKey,
    "i",
  );
  const quoteRelation = clientOverviewRelation(
    relatedClientId,
    relatedLeadId,
    emailKey,
    "q",
  );

  const invoiceTotalCentsSql = `(
    CASE
      WHEN i.amount_cents IS NOT NULL AND (i.amount_cents != 0 OR i.amount = 0)
        THEN i.amount_cents
      ELSE ROUND(i.amount * 100)
    END
    +
    CASE
      WHEN i.tax_cents IS NOT NULL AND (i.tax_cents != 0 OR i.tax = 0)
        THEN i.tax_cents
      ELSE ROUND(i.tax * 100)
    END
  )`;
  const quoteTotalCentsSql = `(
    CASE
      WHEN q.amount_cents IS NOT NULL AND (q.amount_cents != 0 OR q.amount = 0)
        THEN q.amount_cents
      ELSE ROUND(q.amount * 100)
    END
    +
    CASE
      WHEN q.tax_cents IS NOT NULL AND (q.tax_cents != 0 OR q.tax = 0)
        THEN q.tax_cents
      ELSE ROUND(q.tax * 100)
    END
  )`;
  const paymentCentsSql = `
    CASE
      WHEN p.amount_cents IS NOT NULL AND (p.amount_cents != 0 OR p.amount = 0)
        THEN p.amount_cents
      ELSE ROUND(p.amount * 100)
    END`;

  const invoiceRows = await env.DB.prepare(
    `SELECT i.id, i.invoice_number, i.lead_id, i.client_id, i.quote_id,
            i.client_name, i.client_email, i.client_address, i.amount, i.tax,
            i.status, i.created_at, i.due_date, i.payment_terms, i.notes,
            ${invoiceTotalCentsSql} as total_cents,
            COALESCE((
              SELECT SUM(${paymentCentsSql})
              FROM payments p
              WHERE p.invoice_id = i.id
            ), 0) as paid_cents
     FROM invoices i
     WHERE ${invoiceRelation.where}
     ORDER BY i.created_at DESC
     LIMIT 100`,
  )
    .bind(...invoiceRelation.params)
    .all();

  const invoices = (invoiceRows.results || []).map((invoice) => {
    const totalCents = Number(invoice.total_cents || 0);
    const paidCents = Number(invoice.paid_cents || 0);
    return {
      ...invoice,
      total_due: centsToAmount(totalCents),
      total_paid: centsToAmount(paidCents),
      balance_due: centsToAmount(Math.max(totalCents - paidCents, 0)),
    };
  });

  const quoteRows = await env.DB.prepare(
    `SELECT q.id, q.quote_number, q.lead_id, q.client_id, q.client_name,
            q.client_email, q.client_address, q.amount, q.tax, q.status,
            q.created_at, q.expiry_date, q.notes, ${quoteTotalCentsSql} as total_cents
     FROM quotes q
     WHERE ${quoteRelation.where}
     ORDER BY q.created_at DESC
     LIMIT 100`,
  )
    .bind(...quoteRelation.params)
    .all();

  const quotes = (quoteRows.results || []).map((quote) => ({
    ...quote,
    total_due: centsToAmount(Number(quote.total_cents || 0)),
  }));

  const receiptRows = await env.DB.prepare(
    `SELECT p.id, p.invoice_id, p.amount, p.amount_cents, p.payment_date,
            p.payment_method, p.notes, p.created_at,
            i.invoice_number, i.client_name, i.client_email
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     WHERE ${invoiceRelation.where}
     ORDER BY COALESCE(p.payment_date, p.created_at) DESC
     LIMIT 100`,
  )
    .bind(...invoiceRelation.params)
    .all();

  const receipts = (receiptRows.results || []).map((payment) => ({
    ...payment,
    amount: centsToAmount(
      persistedCents(payment, "amount_cents", "amount", "Payment amount"),
    ),
    receipt_number: receiptNumberFor(payment),
  }));

  const crmContactRelation = clientOverviewRelation(
    relatedClientId,
    relatedLeadId,
    emailKey,
    "c",
  );
  const contactRows = await env.DB.prepare(
    `${crmContactSelect()}
     WHERE ${crmContactRelation.where}
     ORDER BY c.is_primary DESC, c.updated_at DESC, c.created_at DESC
     LIMIT 100`,
  )
    .bind(...crmContactRelation.params)
    .all();
  const contacts = (contactRows.results || []).map((contact) => ({
    ...contact,
    is_primary: Number(contact.is_primary || 0) === 1,
  }));

  const crmActivityRelation = clientOverviewRelation(
    relatedClientId,
    relatedLeadId,
    emailKey,
    "a",
  );
  const activityRows = await env.DB.prepare(
    `${crmActivitySelect()}
     WHERE ${crmActivityRelation.where}
     ORDER BY
       CASE WHEN a.status = 'planned' THEN 0 ELSE 1 END,
       COALESCE(a.due_date, a.occurred_at, a.created_at) DESC,
       a.updated_at DESC
     LIMIT 100`,
  )
    .bind(...crmActivityRelation.params)
    .all();
  const activities = activityRows.results || [];

  const totalsRow = await env.DB.prepare(
    `WITH related_invoices AS (
       SELECT i.id, i.status, ${invoiceTotalCentsSql} as total_cents,
              COALESCE((
                SELECT SUM(${paymentCentsSql})
                FROM payments p
                WHERE p.invoice_id = i.id
              ), 0) as paid_cents
       FROM invoices i
       WHERE ${invoiceRelation.where}
     )
     SELECT
       COUNT(*) as invoice_count,
       COALESCE(SUM(CASE WHEN status != 'draft' THEN total_cents ELSE 0 END), 0) as invoiced_cents,
       COALESCE(SUM(CASE WHEN status != 'draft' THEN paid_cents ELSE 0 END), 0) as paid_cents,
       COALESCE(SUM(
         CASE WHEN status != 'draft' THEN MAX(total_cents - paid_cents, 0) ELSE 0 END
       ), 0) as outstanding_cents,
       COALESCE(SUM(
         CASE
           WHEN status NOT IN ('draft', 'paid') AND total_cents - paid_cents > 0
             THEN 1
           ELSE 0
         END
       ), 0) as outstanding_invoice_count
     FROM related_invoices`,
  )
    .bind(...invoiceRelation.params)
    .first();

  const quoteCountRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM quotes q WHERE ${quoteRelation.where}`,
  )
    .bind(...quoteRelation.params)
    .first();
  const receiptCountRow = await env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     WHERE ${invoiceRelation.where}`,
  )
    .bind(...invoiceRelation.params)
    .first();

  return json({
    profile: {
      ...profile,
      derived_from_invoices: Boolean(profile.derived_from_invoices),
    },
    lead,
    invoices,
    quotes,
    receipts,
    contacts,
    activities,
    kpis: {
      invoice_count: Number(totalsRow?.invoice_count || 0),
      quote_count: Number(quoteCountRow?.count || 0),
      receipt_count: Number(receiptCountRow?.count || 0),
      outstanding_invoice_count: Number(totalsRow?.outstanding_invoice_count || 0),
      total_invoiced: centsToAmount(Number(totalsRow?.invoiced_cents || 0)),
      total_paid: centsToAmount(Number(totalsRow?.paid_cents || 0)),
      outstanding: centsToAmount(Number(totalsRow?.outstanding_cents || 0)),
    },
  });
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
  await ensureSchema(env);
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
  const openLeads = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM leads WHERE stage NOT IN ('won', 'lost')",
  ).first();
  const activeProjects = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'active', 'on_hold')",
  ).first();
  const openRequirements = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM requirements WHERE status NOT IN ('approved', 'converted')",
  ).first();
  const documentsInReview = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM documents WHERE status = 'review'",
  ).first();
  const qualityActions = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quality_records WHERE status NOT IN ('closed', 'archived')",
  ).first();
  const securityRisks = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM security_records WHERE status NOT IN ('mitigated', 'closed', 'archived')",
  ).first();
  const teamMembers = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM team_members WHERE active = 1",
  ).first();

  return json({
      total_invoices: totalInvoices.count,
      total_quotes: totalQuotes.count,
      total_revenue: centsToAmount(Number(totalRevenue.total_cents || 0)),
      pending_invoices: pendingInvoices.count,
      open_leads: Number(openLeads?.count || 0),
      open_requirements: Number(openRequirements?.count || 0),
      active_projects: Number(activeProjects?.count || 0),
      documents_in_review: Number(documentsInReview?.count || 0),
      quality_actions: Number(qualityActions?.count || 0),
      security_risks: Number(securityRisks?.count || 0),
      team_members: Number(teamMembers?.count || 0),
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
  const openLeads = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM leads WHERE stage NOT IN ('won', 'lost')",
  ).first();
  const activeProjects = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'active', 'on_hold')",
  ).first();
  const openRequirements = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM requirements WHERE status NOT IN ('approved', 'converted')",
  ).first();
  const documentsInReview = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM documents WHERE status = 'review'",
  ).first();
  const upcomingDocumentReviews = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM documents
     WHERE review_date IS NOT NULL
       AND status != 'archived'
       AND review_date <= date('now', '+30 days')`,
  ).first();
  const qualityActions = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quality_records WHERE status NOT IN ('closed', 'archived')",
  ).first();
  const securityRisks = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM security_records WHERE status NOT IN ('mitigated', 'closed', 'archived')",
  ).first();
  const teamMembers = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM team_members WHERE active = 1",
  ).first();
  const outstandingQuotes = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quotes WHERE status IN ('draft', 'sent', 'viewed')",
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
      open_leads: Number(openLeads?.count || 0),
      open_requirements: Number(openRequirements?.count || 0),
      active_projects: Number(activeProjects?.count || 0),
      documents_in_review: Number(documentsInReview?.count || 0),
      upcoming_document_reviews: Number(upcomingDocumentReviews?.count || 0),
      quality_actions: Number(qualityActions?.count || 0),
      security_risks: Number(securityRisks?.count || 0),
      team_members: Number(teamMembers?.count || 0),
      outstanding_quotes: Number(outstandingQuotes?.count || 0),
    },
    monthly,
    status_breakdown,
    top_clients,
  });
}
