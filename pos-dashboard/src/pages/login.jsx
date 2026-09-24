import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button, Field, Input } from "../components/ui";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-20 text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[42%] h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.045] blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <Link
        to="/"
        className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-white/5 hover:text-text sm:right-8 sm:top-7"
      >
        <ArrowRight size={15} />
        صفحه اصلی
      </Link>

      <section className="glass-strong relative z-10 w-full max-w-[430px] rounded-[30px] border border-white/10 p-6 shadow-card-lg sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-bg shadow-[0_12px_45px_-15px_rgba(255,255,255,.7)]">
            <LockKeyhole size={24} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">ورود به مرکز عملیات</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            برای مدیریت فروش و موجودی وارد حساب سازمانی شوید.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Field label="نام کاربری">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="ltr"
              autoComplete="username"
              placeholder="admin"
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
                className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-white/5 hover:text-text"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-400/10 px-4 py-3 text-xs leading-5 text-rose-300 ring-1 ring-inset ring-rose-400/15"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={isLoading} className="w-full">
            ورود به داشبورد
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-text-faint">
          دسترسی به این سامانه محدود به کاربران مجاز سازمان است.
        </p>
      </section>
    </main>
  );
}
