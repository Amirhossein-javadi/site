import { ArrowLeft, Package, Users, FileSignature, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dir-rtl font-sans">
      {/* هدر */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200 z-50">
         <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 text-blue-700 font-extrabold text-xl">
               <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md"><BarChart3 size={24} /></div>
               سیستم جامع POS
            </div>
            <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
               ورود به سیستم
            </a>
         </div>
      </header>
      
      {/* بخش اصلی */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
         <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
            فروش و انبار شما، <br/><span className="text-blue-600">از یک پنل</span> تحت کنترل.
         </h1>
         <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            با سیستم یکپارچه ما، محصولات را تعریف کنید، موجودی انبار را پایش کنید و سفارشات نمایندگان را در کسری از ثانیه مدیریت کنید.
         </p>
         <a href="/login" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/30 hover:-translate-y-1">
            شروع کار با داشبورد <ArrowLeft size={22} />
         </a>
      </section>

      {/* آمار */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
               <Package size={48} className="text-blue-600 mb-6" />
               <h3 className="text-3xl font-black text-blue-600 mb-3">+۵,۰۰۰</h3>
               <p className="text-slate-500 font-bold">کالا و محصول مدیریت شده</p>
            </div>
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
               <Users size={48} className="text-emerald-500 mb-6" />
               <h3 className="text-3xl font-black text-emerald-500 mb-3">+۱۲۰</h3>
               <p className="text-slate-500 font-bold">نماینده و تامین‌کننده فعال</p>
            </div>
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
               <FileSignature size={48} className="text-amber-500 mb-6" />
               <h3 className="text-3xl font-black text-amber-500 mb-3">۱۰۰٪</h3>
               <p className="text-slate-500 font-bold">دقت در رزرو و ثبت قراردادها</p>
            </div>
         </div>
      </section>
    </div>
  );
}