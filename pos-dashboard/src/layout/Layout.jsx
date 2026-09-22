import { ShoppingCart, Package, Users, FileSignature, LayoutDashboard, LogOut, Menu, UserCircle } from "lucide-react";

export default function Layout({ children }) {
  const currentPath = window.location.pathname;

  // لیست منوهای سمت راست
  const menuItems = [
    { path: "/dashboard", name: "داشبورد", icon: <LayoutDashboard size={20} /> },
    { path: "/products", name: "محصولات", icon: <Package size={20} /> },
    { path: "/inventory", name: "انبار و موجودی", icon: <Package size={20} /> },
    { path: "/contracts", name: "قراردادها", icon: <FileSignature size={20} /> },
    { path: "/orders", name: "سفارشات", icon: <ShoppingCart size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex dir-rtl font-sans text-slate-800">
      
      {/* سایدبار (منوی کناری) - تم کاملاً روشن و سفید */}
      <aside className="w-64 bg-white border-l border-slate-200 shadow-sm hidden md:flex flex-col z-10">
        <div className="h-20 flex items-center justify-center border-b border-slate-100">
          <h2 className="text-xl font-black text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
              <LayoutDashboard size={18} />
            </span>
            سیستم POS
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-bold shadow-sm shadow-blue-500/10" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                }`}
              >
                {item.icon}
                {item.name}
              </a>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 w-full px-4 py-3 rounded-xl font-medium transition-all"
          >
            <LogOut size={20} />
            خروج از سیستم
          </button>
        </div>
      </aside>

      {/* محتوای اصلی و هدر (Topbar) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* هدر بالایی سفید */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-blue-600 transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-700 hidden sm:block">پنل مدیریت</h1>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full cursor-pointer hover:bg-slate-100 transition-colors">
            <UserCircle size={24} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600">ادمین سیستم</span>
          </div>
        </header>
        
        {/* بوم خالی برای محتوای صفحات (پس‌زمینه طوسی بسیار روشن) */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {children}
        </main>
        
      </div>
    </div>
  );
}