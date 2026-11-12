const BASE = import.meta.env.MODE === "development" ? "" : "";

const ERRORS = {
  invalid_input: "error.invalid_input",
  email_taken: "error.email_taken",
  terms_required: "error.terms_required",
  bad_credentials: "error.bad_credentials",
  invalid_phone: "error.invalid_phone",
  invalid_status: "error.invalid_status",
  not_found: "error.not_found",
  unauthorized: "error.unauthorized",
  invalid_token: "error.invalid_token",
  already_verified: "error.already_verified",
  forbidden: "error.forbidden",
  trial_ended: "error.trial_ended",
  subscription_required: "error.subscription_required",
  rate_limited: "error.rate_limited",
  db_error: "error.db_error",
};

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function req(method, path, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (data) opts.body = JSON.stringify(data);

  try {
    const res = await fetch(BASE + path, opts);
    const json = await res.json();
    if (res.ok) return json;
    throw new ApiError(json.error || "unknown", res.status);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error(e);
    throw new ApiError("network", 0);
  }
}

export const api = {
  signup: (d) => req("POST", "/api/auth/signup", d),
  login: (d) => req("POST", "/api/auth/login", d),
  verifyEmail: (token) => req("POST", "/api/auth/verify-email", { token }),
  resendVerification: (token) => req("POST", "/api/auth/resend-verification", null, token),
  forgotPassword: (email) => req("POST", "/api/auth/forgot-password", { email }),
  resetPassword: (d) => req("POST", "/api/auth/reset-password", d),
  me: (token) => req("GET", "/api/me", null, token),
  updateMe: (d, token) => req("PATCH", "/api/me", d, token),
  check: (phone, token) => req("POST", "/api/check", { phone }, token),
  createOrder: (d, token) => req("POST", "/api/orders", d, token),
  getOrders: (params, token) => req("GET", "/api/orders" + qs(params), null, token),
  exportOrders: (params, token) => req("GET", "/api/orders/export" + qs(params), null, token),
  updateOrder: (id, status, token) => req("PATCH", `/api/orders/${id}`, { status }, token),
  stats: (token) => req("GET", "/api/stats", null, token),
  getTemplates: (token) => req("GET", "/api/templates", null, token),
  createTemplate: (d, token) => req("POST", "/api/templates", d, token),
  updateTemplate: (id, d, token) => req("PATCH", `/api/templates/${id}`, d, token),
  deleteTemplate: (id, token) => req("DELETE", `/api/templates/${id}`, null, token),
  notifications: (since, token) => req("GET", "/api/notifications" + qs(since != null ? { since } : {}), null, token),
  readNotifications: (token) => req("POST", "/api/notifications/read", null, token),
  getKeys: (token) => req("GET", "/api/keys", null, token),
  createKey: (d, token) => req("POST", "/api/keys", d, token),
  deleteKey: (id, token) => req("DELETE", `/api/keys/${id}`, null, token),
  adminUsers: (token) => req("GET", "/api/admin/users", null, token),
  adminUpdatePlan: (id, d, token) => req("PATCH", `/api/admin/users/${id}/plan`, d, token),
  adminAnalytics: (token) => req("GET", "/api/admin/analytics", null, token),
};

// Construit une query string à partir d'un objet (ignore les valeurs vides)
function qs(params) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") sp.set(k, v);
  });
  const s = sp.toString();
  return s ? "?" + s : "";
}

export function errKey(code) {
  return ERRORS[code] || "error.unknown";
}
