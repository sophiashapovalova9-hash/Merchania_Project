import { Mail, ArrowLeft } from 'lucide-react';
import { ClosedPage } from '../seo';

const ForgotPassword = ({ setPage }) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full">
        <ClosedPage title="Восстановление пароля" />
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Сброс пароля</h1>
          <p className="text-slate-400 mt-4 font-medium">Введите Email для восстановления доступа</p>
        </div>

        <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50">
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase ml-4 tracking-widest">Ваш Email</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                <input type="email" placeholder="mail@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full btn-blue !py-4 !text-sm !uppercase !tracking-wide whitespace-nowrap shadow-xl shadow-blue-400/20">
              Отправить инструкции
            </button>
          </form>
        </div>

        <p className="text-center mt-12">
          <button onClick={() => setPage('login')} className="font-bold text-[#49b6ff] hover:text-[#ff499e] transition-colors inline-flex items-center justify-center gap-2 border-none bg-transparent cursor-pointer uppercase text-xs tracking-wide whitespace-nowrap">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Вернуться ко входу
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
