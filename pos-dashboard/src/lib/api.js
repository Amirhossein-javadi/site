import { forceLogout, getToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * خطاهای بک‌اند سه شکل دارند و هر سه باید به یک پیام خوانا تبدیل شوند:
 *   { success: false, error: { code, message } }   قرارداد خطای سرویس‌ها
 *   { detail: "..." }                              خطاهای استاندارد DRF
 *   { field: ["..."], non_field_errors: ["..."] }  خطاهای اعتبارسنجی
 */
function extractErrorMessage(body, status, path) {
  if (body && typeof body === "object") {
    if (body.error?.message) return body.error.message;
    if (typeof body.detail === "string") return body.detail;

    const parts = [];
    for (const [field, value] of Object.entries(body)) {
      if (field === "success" || field === "error") continue;
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      if (!text) continue;
      parts.push(field === "non_field_errors" ? text : `${field}: ${text}`);
    }
    if (parts.length) return parts.join(" — ");
  }
  return `درخواست به ${path} با خطا مواجه شد (${status})`;
}

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Token ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "اتصال به سرور برقرار نشد. از اجرای بک‌اند مطمئن شوید."
    );
  }

  if (res.status === 401) {
    forceLogout();
    throw new ApiError("نشست شما منقضی شده است. دوباره وارد شوید.", {
      status: 401,
    });
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(body, res.status, path), {
      status: res.status,
      code: body?.error?.code,
    });
  }

  // سرویس‌های نوشتنی پاسخ را در { success, data } می‌پیچند؛ برای مصرف‌کننده
  // فرقی ندارد و همیشه خودِ داده تحویل داده می‌شود.
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}

/** لیست‌ها ممکن است آرایه خام یا صفحه‌بندی‌شده DRF باشند. */
function toList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  return [];
}

function withQuery(path, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return path;
  return `${path}?${new URLSearchParams(entries).toString()}`;
}

const post = (path, data) =>
  request(path, { method: "POST", body: JSON.stringify(data ?? {}) });

const getList = (path, params) => request(withQuery(path, params)).then(toList);

export const api = {
  // --- احراز هویت ---
  login: (email, password) => post("/login/", { username: email, password }),

  // --- کاتالوگ ---
  getProducts: (search) => getList("/products/", { search }),
  getVariants: (search) => getList("/variants/", { search }),
  getBrands: () => getList("/brands/"),
  getCategories: () => getList("/categories/"),

  // --- انبار ---
  getWarehouses: () => getList("/warehouses/"),
  getInventory: ({ search, warehouse, lowStock } = {}) =>
    getList("/inventory/", {
      search,
      warehouse,
      low_stock: lowStock ? "true" : undefined,
    }),
  getSerials: ({ search, status, warehouse } = {}) =>
    getList("/serials/", { search, status, warehouse }),
  getLedger: () => getList("/inventory-ledger/"),
  reserveStock: (data) => post("/inventory/reserve/", data),
  releaseStock: (data) => post("/inventory/release/", data),
  issueStock: (data) => post("/inventory/issue/", data),

  // --- قراردادها ---
  getContracts: (search) => getList("/contracts/", { search }),
  getContract: (id) => request(`/contracts/${id}/`),

  // --- سفارش‌ها ---
  getOrders: ({ search, status, contract } = {}) =>
    getList("/orders/", { search, status, contract }),
  getOrder: (id) => request(`/orders/${id}/`),
  createOrder: (data) => post("/orders/", data),
  cancelOrder: (id, note) => post(`/orders/${id}/cancel/`, { note }),
  transitionOrder: (id, toStatus, note) =>
    post(`/orders/${id}/transition/`, { to_status: toStatus, note }),

  // --- قیمت‌گذاری و پیش‌فاکتور ---
  getProformas: () => getList("/proforma-invoices/"),
  getProforma: (id) => request(`/proforma-invoices/${id}/`),
  issueProforma: (orderId) => post("/proforma-invoices/issue/", { order: orderId }),
  getExchangeRates: () => getList("/exchange-rates/"),

  // --- پرداخت ---
  getPayments: () => getList("/payments/"),
  createPaymentIntent: ({ proforma, idempotencyKey, gateway = "mock" }) =>
    post("/payments/create/", {
      proforma,
      idempotency_key: idempotencyKey,
      gateway,
    }),
  verifyPayment: (id, outcome = "success") =>
    post(`/payments/${id}/verify/`, { outcome }),

  // --- مالی ---
  getLedgerEntries: (contract) => getList("/finance/ledger/", { contract }),
  getContractBalance: (contract) =>
    request(withQuery("/finance/balance/", { contract })),
};
