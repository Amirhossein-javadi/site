import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "ایمیل یا رمز عبور اشتباه است!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg text-text">
      {/* هاله‌های نور پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-float rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] animate-float-slow rounded-full bg-accent2/15 blur-[130px]" />
      </div>

      <Link
        to="/"
        className="absolute right-6 top-6 z-10 flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowRight size={16} />
        بازگشت به صفحه اصلی
      </Link>

      <div className="glass-strong relative z-10 w-full max-w-md rounded-3xl border border-border-soft p-8 shadow-card-lg sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient-soft text-accent">
            <Lock size={26} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-extrabold text-text">ورود به پلتفرم فروش</h2>
          <p className="mt-2 text-sm text-text-muted">
            لطفاً ایمیل و رمز عبور خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text">
              آدرس ایمیل
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border-soft bg-surface2/70 px-4 py-3 text-left dir-ltr text-sm text-text outline-none transition-all placeholder:text-text-faint focus:border-accent/60 focus:bg-surface2 focus:ring-4 focus:ring-accent/10"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text">
              رمز عبور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border-soft bg-surface2/70 px-4 py-3 text-left dir-ltr text-sm text-text outline-none transition-all placeholder:text-text-faint focus:border-accent/60 focus:bg-surface2 focus:ring-4 focus:ring-accent/10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint transition-colors hover:text-accent"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-accent-gradient py-3.5 font-bold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-glow disabled:opacity-70"
          >
            {isLoading ? "در حال بررسی..." : "ورود به داشبورد"}
          </button>
        </form>
      </div>
    </div>
  );
}
