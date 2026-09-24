const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * وقتی سرور 401 برمی‌گرداند توکن دیگر معتبر نیست؛ پاکش می‌کنیم و کاربر را
 * به صفحه ورود می‌فرستیم. مسیر فعلی ذخیره می‌شود تا بعد از ورود برگردد.
 */
export function forceLogout() {
  logout();
  const { pathname, search } = window.location;
  if (pathname === "/login") return;
  const next = encodeURIComponent(pathname + search);
  window.location.replace(`/login?next=${next}`);
}
