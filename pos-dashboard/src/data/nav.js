import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  Truck,
  Users,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Wallet,
  Send,
  RotateCcw,
} from "lucide-react";

// ساختار منو دقیقاً بر اساس گروه‌بندیِ نمونه‌ی مرجع (اصلی/انبار/فروش/مالی/پشتیبانی)
export const navGroups = [
  {
    label: "اصلی",
    items: [{ label: "داشبورد", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "انبار",
    items: [
      { label: "محصولات", path: "/products", icon: Package },
      { label: "موجودی و سریال", path: "/inventory", icon: ScanBarcode },
      { label: "تامین‌کنندگان", path: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "فروش",
    items: [
      { label: "مشتریان", path: "/customers", icon: Users },
      { label: "قراردادها", path: "/contracts", icon: FileText },
      { label: "سفارشات", path: "/orders", icon: ShoppingCart },
      { label: "پیش‌فاکتورها", path: "/proforma-invoices", icon: Receipt },
    ],
  },
  {
    label: "مالی",
    items: [
      { label: "پرداخت‌ها", path: "/payments", icon: CreditCard },
      { label: "اعتبارات", path: "/credits", icon: Wallet },
    ],
  },
  {
    label: "پشتیبانی",
    items: [
      { label: "ارسال‌ها", path: "/shipments", icon: Send },
      { label: "مرجوعی‌ها", path: "/returns", icon: RotateCcw },
    ],
  },
];

// برای پیدا کردن عنوان صفحه فعال در Topbar
export const flatNavItems = navGroups.flatMap((g) => g.items);
