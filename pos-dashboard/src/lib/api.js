const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || "";
    } catch {
      /* پاسخ خطا JSON نبود — پیام پیش‌فرض استفاده می‌شود */
    }
    throw new Error(detail || `درخواست به ${path} با خطا مواجه شد (${res.status})`);
  }
  return res.json();
}

function withQuery(path, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return path;
  return `${path}?${new URLSearchParams(entries).toString()}`;
}

export const api = {
  getContracts: (search) => request(withQuery("/contracts/", { search })),
  getProducts: (search) => request(withQuery("/products/", { search })),
  getWarehouses: () => request("/warehouses/"),
  getInventory: ({ search, warehouse, lowStock } = {}) =>
    request(
      withQuery("/inventory/", {
        search,
        warehouse,
        low_stock: lowStock ? "true" : undefined,
      })
    ),
  getSerials: ({ search, status, warehouse } = {}) =>
    request(withQuery("/serials/", { search, status, warehouse })),
  getLedger: () => request("/inventory-ledger/"),
  getOrders: (search) => request(withQuery("/orders/", { search })),
  createOrder: (data) => request("/orders/", { method: "POST", body: JSON.stringify(data) }),
  login: (username, password) =>
    request("/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};
