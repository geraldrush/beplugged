import QRCode from "qrcode";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

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
      if (path.startsWith("/api/admin/")) {
        const token = request.headers.get("Authorization");
        if (!isValidToken(token, env)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (path === "/api/auth/login" && method === "POST") {
        return handleLogin(request, env);
      }

      if (path === "/api/admin/dashboard" && method === "GET") {
        return handleDashboardStats(env);
      }

      if (path.startsWith("/api/admin/invoices")) {
        return handleInvoices(request, env, path, method);
      }

      if (path.startsWith("/api/admin/quotes")) {
        return handleQuotes(request, env, path, method);
      }

      if (path.startsWith("/api/admin/clients")) {
        return handleClients(request, env, path, method);
      }

      if (path.startsWith("/api/invoice/")) {
        const invoiceId = path.split("/")[3];
        return handlePublicInvoiceView(invoiceId, env);
      }

      if (path.startsWith("/api/quote/")) {
        const quoteId = path.split("/")[3];
        return handlePublicQuoteView(quoteId, env);
      }

      if (path.startsWith("/api/receipt/")) {
        const paymentId = path.split("/")[3];
        return handlePublicReceiptView(paymentId, env);
      }

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

function formatMoney(value) {
  const number = Number(value || 0);
  const parts = number.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${parts[0]}.${parts[1]}`;
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

function isValidToken(token, env) {
  if (!token) return false;
  const [scheme, credentials] = token.split(" ");
  if (scheme !== "Bearer") return false;
  return credentials === env.ADMIN_PASSWORD;
}

async function handleLogin(request, env) {
  const { password } = await request.json();
  if (password === env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ token: "Bearer " + env.ADMIN_PASSWORD }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ error: "Invalid password" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleInvoices(request, env, path, method) {
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
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "GET" && invoiceId) {
    const result = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
      .bind(invoiceId)
      .first();
    return new Response(JSON.stringify(result || { error: "Not found" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "POST" && invoiceId && action === "send") {
    return handleSendInvoice(request, env, invoiceId);
  }

  if (method === "POST") {
    const data = await request.json();
    const id = "inv_" + Date.now();
    const invoiceNumber =
      "INV-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

    const qrUrl = `${new URL(request.url).origin}/invoices/index.html?id=${id}`;
    const qrCode = await generateQrCodeDataUrl(qrUrl);

    await env.DB.prepare(
      `INSERT INTO invoices (id, invoice_number, client_name, client_email, client_address, amount, tax, status, due_date, payment_terms, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
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
      { headers: { "Content-Type": "application/json" }, status: 201 },
    );
  }

  if (method === "PUT" && invoiceId) {
    const data = await request.json();
    await env.DB.prepare(
      `UPDATE invoices SET client_name = ?, client_email = ?, client_address = ?, amount = ?, tax = ?, status = ?, items = ?, notes = ?, due_date = ?, payment_terms = ? WHERE id = ?`,
    )
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

async function handleSendInvoice(request, env, invoiceId) {
  if (!env.BREVO_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing BREVO_API_KEY secret" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!env.BREVO_SENDER_EMAIL) {
    return new Response(
      JSON.stringify({ error: "Missing BREVO_SENDER_EMAIL variable" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(invoiceId)
    .first();
  if (!invoice) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.text().then((t) => (t ? JSON.parse(t) : {})).catch(() => ({}));
  const customMessage = body?.message ? String(body.message).trim() : "";
  const origin = new URL(request.url).origin;
  const invoiceUrl = `${origin}/invoices/index.html?id=${invoice.id}`;

  const items = JSON.parse(invoice.items || "[]");
  const itemsRows = items.length
    ? items
        .map((item) => {
          const quantity = item.quantity || 1;
          const rate = item.rate || 0;
          const discount = item.discount || 0;
          const lineTotal = Math.max(quantity * rate - discount, 0);
          return `<tr>
            <td>${item.description || "Item"}</td>
            <td style="text-align:center;">${quantity}</td>
            <td style="text-align:right;">${formatMoney(rate)}</td>
            <td style="text-align:right;">${formatMoney(discount)}</td>
            <td style="text-align:right;">${formatMoney(lineTotal)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5">Services Rendered</td></tr>`;

  const bankingInfo = invoice.payment_terms
    ? invoice.payment_terms
        .replace(/\#\[invoice_number\]/g, invoice.invoice_number)
        .replace(/\n/g, "<br>")
    : getDefaultBankingInfo(invoice.invoice_number);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #2C2D3F;">
      <h2 style="color:#F05023; margin-bottom: 0;">Invoice ${invoice.invoice_number}</h2>
      <p>Hi ${invoice.client_name || "there"},</p>
      <p>Your invoice is ready. You can view and download it here:</p>
      <p><a href="${invoiceUrl}">${invoiceUrl}</a></p>
      ${customMessage ? `<p>${customMessage}</p>` : ""}
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
    return new Response(
      JSON.stringify({ error: "Brevo send failed", details: errorText }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
    .bind("sent", invoiceId)
    .run();

  const result = await response.json().catch(() => ({}));
  return new Response(JSON.stringify({ success: true, result }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function ensurePaymentsTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
}

function receiptNumberFor(payment) {
  const year = new Date(payment.created_at || Date.now()).getFullYear();
  const digits = String(payment.id || "").replace(/\D/g, "").slice(-6) || "000000";
  return `RCPT-${year}-${digits}`;
}

async function getInvoiceBalance(env, invoice) {
  const total = Number(invoice.amount || 0) + Number(invoice.tax || 0);
  const paidRow = await env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = ?",
  )
    .bind(invoice.id)
    .first();
  const paid = Number(paidRow?.paid || 0);
  return { total, paid, balance: Math.max(total - paid, 0) };
}

async function reconcileInvoiceStatus(env, invoice) {
  const { total, paid, balance } = await getInvoiceBalance(env, invoice);
  let status = invoice.status;
  if (total > 0 && balance <= 0.005) {
    status = "paid";
  } else if (paid > 0) {
    status = "partially_paid";
  } else if (invoice.status === "paid" || invoice.status === "partially_paid") {
    status = "sent";
  }
  if (status !== invoice.status) {
    await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
      .bind(status, invoice.id)
      .run();
  }
  return { status, total, paid, balance };
}

async function handleInvoicePayments(request, env, invoiceId, paymentId, method) {
  await ensurePaymentsTable(env);

  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(invoiceId)
    .first();
  if (!invoice) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    return new Response(
      JSON.stringify({ payments, total, paid, balance }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (method === "POST") {
    const data = await request.json();
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Payment amount must be greater than zero" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const id = "pay_" + Date.now();
    await env.DB.prepare(
      `INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        invoiceId,
        amount,
        data.payment_date || new Date().toISOString().slice(0, 10),
        data.payment_method || "",
        data.notes || "",
      )
      .run();

    const { status, total, paid, balance } = await reconcileInvoiceStatus(
      env,
      invoice,
    );
    const payment = await env.DB.prepare("SELECT * FROM payments WHERE id = ?")
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        payment: { ...payment, receipt_number: receiptNumberFor(payment) },
        status,
        total,
        paid,
        balance,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  if (method === "DELETE" && paymentId) {
    await env.DB.prepare(
      "DELETE FROM payments WHERE id = ? AND invoice_id = ?",
    )
      .bind(paymentId, invoiceId)
      .run();
    const { status, total, paid, balance } = await reconcileInvoiceStatus(
      env,
      invoice,
    );
    return new Response(
      JSON.stringify({ success: true, status, total, paid, balance }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

async function handlePublicReceiptView(paymentId, env) {
  await ensurePaymentsTable(env);

  const payment = await env.DB.prepare("SELECT * FROM payments WHERE id = ?")
    .bind(paymentId)
    .first();
  if (!payment) {
    return new Response(JSON.stringify({ error: "Receipt not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?")
    .bind(payment.invoice_id)
    .first();
  const balance = invoice
    ? await getInvoiceBalance(env, invoice)
    : { total: 0, paid: 0, balance: 0 };

  return new Response(
    JSON.stringify({
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
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

async function handleQuotes(request, env, path, method) {
  const segments = path.split("/");
  const quoteId = segments[4];

  if (method === "GET" && !quoteId) {
    const result = await env.DB.prepare(
      "SELECT id, quote_number, client_name, client_email, client_address, amount, tax, status, created_at, expiry_date FROM quotes ORDER BY created_at DESC LIMIT 100",
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

    await env.DB.prepare(
      `INSERT INTO quotes (id, quote_number, client_name, client_email, client_address, amount, tax, status, expiry_date, items, notes, qr_code_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
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
      { headers: { "Content-Type": "application/json" }, status: 201 },
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

  if (invoice.status !== "viewed" && invoice.status !== "paid") {
    await env.DB.prepare("UPDATE invoices SET status = ? WHERE id = ?")
      .bind("viewed", invoiceId)
      .run();
  }

  return new Response(JSON.stringify(invoice), {
    headers: { "Content-Type": "application/json" },
  });
}

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
    "SELECT COALESCE(SUM(amount), 0) as total FROM payments",
  ).first();
  // Pending = issued invoices that are not yet fully paid (drafts excluded).
  const pendingInvoices = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM invoices WHERE status NOT IN ('paid', 'draft')",
  ).first();

  return new Response(
    JSON.stringify({
      total_invoices: totalInvoices.count,
      total_quotes: totalQuotes.count,
      total_revenue: totalRevenue.total || 0,
      pending_invoices: pendingInvoices.count,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
