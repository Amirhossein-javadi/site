import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard";
      } else {
        alert("ایمیل یا رمز عبور اشتباه است!");
      }
    } catch (error) {
      alert("خطا در اتصال به سرور بک‌اند!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dir-rtl font-sans relative overflow-hidden">
      {/* هاله نور پس‌زمینه */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-5">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">ورود به پلتفرم فروش</h2>
          <p className="text-slate-500 mt-2 text-sm">لطفاً ایمیل و رمز عبور خود را وارد کنید</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">آدرس ایمیل</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all dir-ltr text-left"
              placeholder="admin@example.com" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">رمز عبور</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all dir-ltr text-left"
                placeholder="••••••••" 
                required 
              />
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex justify-center disabled:opacity-70 mt-4"
          >
            {isLoading ? "در حال بررسی..." : "ورود به داشبورد"}
          </button>
        </form>
      </div>
    </div>
  );
}