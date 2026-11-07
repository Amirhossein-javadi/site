import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button, Field, Input } from "../components/ui";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../lib/api";
import { isAuthenticated, setToken } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // فقط مسیر داخلی پذیرفته می‌شود تا ?next به دامنه بیرونی هدایت نکند.
  const requested = searchParams.get("next");
  const destination =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  useEffect(() => {
    if (isAuthenticated()) navigate(destination, { replace: true });
  }, [destination, navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "نام کاربری یا رمز عبور صحیح نیست.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-bg px-5 py-20 text-text">
      <Link
        to="/"
        className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface2 hover:text-text sm:right-8 sm:top-7"
      >
        <ArrowRight size={15} />
        صفحه اصلی
      </Link>

      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-7">
        <ThemeToggle />
      </div>

      <section className="grid w-full max-w-[940px] overflow-hidden border border-border/60 bg-surface shadow-2xl shadow-black/25 md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#101a2d] p-9 text-white md:flex lg:p-12">
          <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#101a2d]"><LockKeyhole size={19} /></span>
              <div><p className="text-sm font-extrabold">سپهر</p><p className="mt-0.5 text-[10px] text-white/50">مرکز عملیات</p></div>
            </div>
            <div className="mt-16 max-w-sm">
              <p className="text-[10px] font-bold tracking-[0.16em] text-white/45">POS MANAGEMENT</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-relaxed">مدیریت فروش،<br />با نظم دقیق‌تر.</h2>
              <p className="mt-4 text-sm leading-7 text-white/60">دسترسی یکپارچه به دستگاه‌ها، موجودی انبارها و قراردادهای PSP.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
            <div><p className="text-lg font-extrabold">PAX</p><p className="mt-1 text-[10px] text-white/45">پایش مدل و سریال</p></div>
            <div><p className="text-lg font-extrabold">PSP</p><p className="mt-1 text-[10px] text-white/45">کنترل سقف قرارداد</p></div>
          </div>
        </aside>

        <div className="p-6 sm:p-9 lg:p-12">
          <div className="mb-8 border-b border-border/50 pb-5">
            <p className="text-[10px] font-bold tracking-[0.14em] text-frost">ورود سازمانی</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">ورود به مرکز عملیات</h1>
            <p className="mt-2 text-sm leading-6 text-text-muted">برای ادامه، اطلاعات حساب سازمانی خود را وارد کنید.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Field label="نام کاربری">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
                autoComplete="username"
                placeholder="email@example.com"
                required
              />
            </Field>

            <Field label="رمز عبور">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  autoComplete="current-password"
                  className="pl-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-surface3 hover:text-text"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            {error && <p role="alert" className="border border-border/60 bg-surface2 px-4 py-3 text-xs leading-5 text-text-muted">{error}</p>}

            <Button type="submit" size="lg" loading={isLoading} className="mt-2 w-full">
              ورود به داشبورد
            </Button>
          </form>

          <p className="mt-7 border-t border-border/50 pt-5 text-[11px] leading-6 text-text-faint">
            دسترسی به این سامانه محدود به کاربران مجاز سازمان است.
          </p>
        </div>
      </section>
    </main>
  );
}
