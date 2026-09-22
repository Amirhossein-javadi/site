import { ShoppingCart, Package, Users, FileSignature, Edit } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8 dir-rtl font-sans pb-10">
      <div>
        {/* رنگ این دو خط به تیره تغییر کرد */}
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">نگاه کلی سیستم فروش</h1>
        <p className="text-slate-500 text-sm">خلاصه وضعیت سفارشات و موجودی انبار در یک نگاه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><ShoppingCart size={28} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">کل سفارشات</p>
            <h3 className="text-2xl font-black text-slate-800">۱۲۴</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Package size={28} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">موجودی انبار</p>
            <h3 className="text-2xl font-black text-slate-800">۸,۴۳۰</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><FileSignature size={28} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">قراردادهای فعال</p>
            <h3 className="text-2xl font-black text-slate-800">۴۵</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
          <div className="bg-rose-50 p-4 rounded-2xl text-rose-500"><Users size={28} /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">تامین‌کنندگان</p>
            <h3 className="text-2xl font-black text-slate-800">۱۲</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">آخرین سفارشات ثبت شده</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-bold">شماره سفارش</th>
                <th className="p-4 font-bold">مشتری / نماینده</th>
                <th className="p-4 font-bold">مبلغ کل (ریال)</th>
                <th className="p-4 font-bold">وضعیت</th>
                <th className="p-4 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">#ORD-104</td>
                <td className="p-4 font-medium">نمایندگی ولیعصر</td>
                <td className="p-4 font-mono font-bold text-slate-600">300,000.00</td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">تایید شده</span>
                </td>
                <td className="p-4">
                  <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">#ORD-105</td>
                <td className="p-4 font-medium">فروشگاه مرکزی شیراز</td>
                <td className="p-4 font-mono font-bold text-slate-600">1,250,000.00</td>
                <td className="p-4">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">در انتظار تایید</span>
                </td>
                <td className="p-4">
                  <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}