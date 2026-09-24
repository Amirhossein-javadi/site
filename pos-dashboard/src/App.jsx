import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Layout from "./layout/Layout";
import StubPage from "./pages/StubPage";
import { navGroups } from "./data/nav";
import { isAuthenticated } from "./lib/auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Contracts from "./pages/Contracts";
import Orders from "./pages/Orders";
import Proformas from "./pages/Proformas";
import Payments from "./pages/Payments";
import Credits from "./pages/Credits";

const PAGE_COMPONENTS = {
  "/dashboard": Dashboard,
  "/products": Products,
  "/inventory": Inventory,
  "/contracts": Contracts,
  "/orders": Orders,
  "/proforma-invoices": Proformas,
  "/payments": Payments,
  "/credits": Credits,
};

const PANEL_ROUTES = navGroups.flatMap((group) => group.items);

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

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
              <ProtectedRoute>
                <Layout>
                  {Page ? <Page /> : <StubPage title={label} icon={icon} />}
                </Layout>
              </ProtectedRoute>
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text">
      <p className="text-7xl font-black tracking-tighter text-gradient">۴۰۴</p>
      <h1 className="text-lg font-bold">این صفحه وجود ندارد</h1>
      <p className="text-sm text-text-muted">
        آدرس را بررسی کنید یا به صفحه اصلی برگردید.
      </p>
      <a
        href="/"
        className="mt-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-bg transition-transform hover:-translate-y-0.5"
      >
        بازگشت به صفحه اصلی
      </a>
    </main>
  );
}
