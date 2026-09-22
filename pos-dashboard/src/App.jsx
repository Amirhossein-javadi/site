import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Layout from "./layout/Layout";

// وارد کردن صفحات پنلی که تا الان ساخته شده
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Contracts from "./pages/Contracts";
import Orders from "./pages/Orders";
// صفحه Suppliers از اینجا حذف شد

// لیستی از مسیرهایی که مربوط به داخل پنل هستند
const DASHBOARD_ROUTES = {
  "/dashboard": Dashboard,
  "/products": Products,
  "/inventory": Inventory,
  "/contracts": Contracts,
  "/orders": Orders,
  // مسیر suppliers از اینجا حذف شد
};

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  }, []);

  if (currentPath === "/") {
    return <Landing />;
  }
  
  if (currentPath === "/login") {
    return <Login />;
  }

  const DashboardPage = DASHBOARD_ROUTES[currentPath];
  
  if (DashboardPage) {
    return (
      <Layout>
        <DashboardPage />
      </Layout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dir-rtl">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">۴۰۴</h1>
      <p className="text-gray-600 mb-6">صفحه مورد نظر پیدا نشد!</p>
      <a href="/" className="text-blue-600 hover:underline">بازگشت به صفحه اصلی</a>
    </div>
  );
}