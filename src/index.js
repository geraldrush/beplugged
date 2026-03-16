import QRCode from "qrcode";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Admin routes (require authentication)
      if (path.startsWith("/api/admin/")) {
        const token = request.headers.get("Authorization");
        if (!isValidToken(token, env)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Routes
      if (path === "/api/auth/login" && method === "POST") {
        return handleLogin(request, env);
      }

      // Invoices API
      if (path.startsWith("/api/admin/invoices")) {
        return handleInvoices(request, env, path, method);
      }

      // Quotes API
      if (path.startsWith("/api/admin/quotes")) {
        return handleQuotes(request, env, path, method);
      }

      // Clients API
      if (path.startsWith("/api/admin/clients")) {
        return handleClients(request, env, path, method);
      }

      // Public invoice view
      if (path.startsWith("/api/invoice/")) {
        const invoiceId = path.split("/")[3];
        return handlePublicInvoiceView(invoiceId, env);
      }

      // Public quote view
      if (path.startsWith("/api/quote/")) {
        const quoteId = path.split("/")[3];
        return handlePublicQuoteView(quoteId, env);
      }

      // Dashboard stats
      if (path === "/api/admin/dashboard" && method === "GET") {
        return handleDashboardStats(env);
      }

      // Serve static files (admin pages, invoices, etc.)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};

async function generateQrCodeDataUrl(text) {
  const svg = await QRCode.toString(text, { type: "svg" });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Authentication
function isValidToken(token, env) {
  if (!token) return false;
  const [scheme, credentials] = token.split(" ");
  if (scheme !== "Bearer") return false;
  // Use the admin password from environment variables
  return credentials === env.ADMIN_PASSWORD;
}

async function handleLogin(request, env) {
  const { password } = await request.json();
  if (password === env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ token: "Bearer " + env.ADMIN_PASSWORD }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return new Response(JSON.stringify({ error: "Invalid password" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// Invoice handlers
async function handleInvoices(request, env, path, method) {
  const segments = path.split("/");
  const invoiceId = segments[4];

  if (method === "GET" && !invoiceId) {
    // List invoices
    const result = await env.DB.prepare(
      "SELECT * FROM invoices ORDER BY created_at DESC LIMIT 100",
    ).all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "GET" && invoiceId) {
    // Get single invoice
    const result = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
      .bind(invoiceId)
      .first();
    return new Response(JSON.stringify(result || { error: "Not found" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "POST") {
    // Create invoice
    const data = await request.json();
    const id = "inv_" + Date.now();
    const invoiceNumber =
      "INV-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

    // Generate QR code
    const qrUrl = `${new URL(request.url).origin}/invoices/index.html?id=${id}`;
    const qrCode = await generateQrCodeDataUrl(qrUrl);

    const stmt = env.DB.prepare(
      `INSERT INTO invoices (id, invoice_number, client_name, client_email, client_address, amount, tax, status, due_date, payment_terms, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    await stmt
      .bind(
        id,
        invoiceNumber,
        data.client_name,
        data.client_email,
        data.client_address || "",
        data.amount,
        data.tax || 0,
        data.status || "draft",
        data.due_date || null,
        data.payment_terms || "",
        JSON.stringify(data.items || []),
        data.notes || "",
        qrCode,
      )
      .run();

    return new Response(
      JSON.stringify({ id, invoiceNumber, qr_code_url: qrCode }),
      {
        headers: { "Content-Type": "application/json" },
        status: 201,
      },
    );
  }

  if (method === "PUT" && invoiceId) {
    // Update invoice
    const data = await request.json();
    const stmt = env.DB.prepare(
      `UPDATE invoices SET client_name = ?, client_email = ?, client_address = ?, amount = ?, tax = ?, status = ?, items = ?, notes = ?, due_date = ?, payment_terms = ? WHERE id = ?`,
    );

    await stmt
      .bind(
        data.client_name,
        data.client_email,
        data.client_address || "",
        data.amount,
        data.tax || 0,
        data.status,
        JSON.stringify(data.items || []),
        data.notes || "",
        data.due_date || null,
        data.payment_terms || "",
        invoiceId,
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "DELETE" && invoiceId) {
    // Delete invoice (only if draft)
    const invoice = await env.DB.prepare(
      "SELECT status FROM invoices WHERE id = ?",
    )
      .bind(invoiceId)
      .first();
    if (invoice?.status !== "draft") {
      return new Response(
        JSON.stringify({ error: "Cannot delete non-draft invoices" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await env.DB.prepare("DELETE FROM invoices WHERE id = ?")
      .bind(invoiceId)
      .run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

// Quote handlers (similar to invoices)
async function handleQuotes(request, env, path, method) {
  const segments = path.split("/");
  const quoteId = segments[4];

  if (method === "GET" && !quoteId) {
    const result = await env.DB.prepare(
      "SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100",
    ).all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "GET" && quoteId) {
    const result = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
      .bind(quoteId)
      .first();
    return new Response(JSON.stringify(result || { error: "Not found" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "POST") {
    const data = await request.json();
    const id = "quote_" + Date.now();
    const quoteNumber =
      "QUOTE-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

    const qrUrl = `${new URL(request.url).origin}/invoices/quote.html?id=${id}`;
    const qrCode = await generateQrCodeDataUrl(qrUrl);

    const stmt = env.DB.prepare(
      `INSERT INTO quotes (id, quote_number, client_name, client_email, client_address, amount, tax, status, expiry_date, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    await stmt
      .bind(
        id,
        quoteNumber,
        data.client_name,
        data.client_email,
        data.client_address || "",
        data.amount,
        data.tax || 0,
        "draft",
        data.expiry_date || null,
        JSON.stringify(data.items || []),
        data.notes || "",
        qrCode,
      )
      .run();

    return new Response(
      JSON.stringify({ id, quoteNumber, qr_code_url: qrCode }),
      {
        headers: { "Content-Type": "application/json" },
        status: 201,
      },
    );
  }

  if (method === "PUT" && quoteId) {
    const data = await request.json();
    await env.DB.prepare(
      `UPDATE quotes SET client_name = ?, client_email = ?, amount = ?, tax = ?, status = ?, items = ?, notes = ?, expiry_date = ? WHERE id = ?`,
    )
      .bind(
        data.client_name,
        data.client_email,
        data.amount,
        data.tax || 0,
        data.status,
        JSON.stringify(data.items || []),
        data.notes || "",
        data.expiry_date || null,
        quoteId,
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "DELETE" && quoteId) {
    const quote = await env.DB.prepare("SELECT status FROM quotes WHERE id = ?")
      .bind(quoteId)
      .first();
    if (quote?.status !== "draft") {
      return new Response(
        JSON.stringify({ error: "Cannot delete non-draft quotes" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(quoteId).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

// Clients handlers
async function handleClients(request, env, path, method) {
  if (method === "GET") {
    const result = await env.DB.prepare(
      "SELECT * FROM clients ORDER BY name DESC",
    ).all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "POST") {
    const data = await request.json();
    const id = "client_" + Date.now();

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

    return new Response(JSON.stringify({ id, ...data }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

// Public invoice view
async function handlePublicInvoiceView(invoiceId, env) {
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(invoiceId)
    .first();

  if (!invoice) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update status to viewed if not already
  if (invoice.status !== "viewed" && invoice.status !== "paid") {
    await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
      .bind("viewed", invoiceId)
      .run();
  }

  return new Response(JSON.stringify(invoice), {
    headers: { "Content-Type": "application/json" },
  });
}

// Public quote view
async function handlePublicQuoteView(quoteId, env) {
  const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?")
    .bind(quoteId)
    .first();

  if (!quote) {
    return new Response(JSON.stringify({ error: "Quote not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (quote.status !== "viewed") {
    await env.DB.prepare("UPDATE quotes SET status = ? WHERE id = ?")
      .bind("viewed", quoteId)
      .run();
  }

  return new Response(JSON.stringify(quote), {
    headers: { "Content-Type": "application/json" },
  });
}

// Dashboard stats
async function handleDashboardStats(env) {
  const totalInvoices = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices",
  ).first();
  const totalQuotes = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM quotes",
  ).first();
  const totalRevenue = await env.DB.prepare(
    'SELECT SUM(amount) as total FROM invoices WHERE status = "paid"',
  ).first();
  const pendingInvoices = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM invoices WHERE status NOT IN ("paid", "viewed")',
  ).first();

  return new Response(
    JSON.stringify({
      total_invoices: totalInvoices.count,
      total_quotes: totalQuotes.count,
      total_revenue: totalRevenue.total || 0,
      pending_invoices: pendingInvoices.count,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
