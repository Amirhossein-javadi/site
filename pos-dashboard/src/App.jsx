import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Layout from "./layout/Layout";
import StubPage from "./pages/StubPage";
import { navGroups } from "./data/nav";

// صفحات پنلی که تا الان به API متصل شده‌اند
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Contracts from "./pages/Contracts";
import Orders from "./pages/Orders";

// نگاشت مسیر پنل به کامپوننت واقعی‌اش؛ هر آیتم منو که اینجا نباشد
// به‌صورت خودکار StubPage می‌گیرد تا کلیک روی منو هرگز به ۴۰۴ نخورد.
const PAGE_COMPONENTS = {
  "/dashboard": Dashboard,
  "/products": Products,
  "/inventory": Inventory,
  "/contracts": Contracts,
  "/orders": Orders,
};

const PANEL_ROUTES = navGroups.flatMap((group) => group.items);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {PANEL_ROUTES.map(({ path, label, icon }) => {
        const Page = PAGE_COMPONENTS[path];
        return (
          <Route
            key={path}
            path={path}
            element={
              <Layout>
                {Page ? <Page /> : <StubPage title={label} icon={icon} />}
              </Layout>
            }
          />
        );
      })}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text">
      <h1 className="text-6xl font-extrabold text-gradient">۴۰۴</h1>
      <p className="text-text-muted">صفحه مورد نظر پیدا نشد!</p>
      <a
        href="/"
        className="rounded-xl bg-accent-gradient px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-glow"
      >
        بازگشت به صفحه اصلی
      </a>
    </div>
  );
}
