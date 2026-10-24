import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';
import { ClosedPage, SiteLink } from '../seo';

const Register = ({ setPage }) => {
  const [role, setRole] = useState('buyer');

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full">
        <ClosedPage title="Регистрация" />
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Регистрация</h1>
          <p className="text-slate-400 mt-4 font-medium">Присоединяйтесь к сообществу</p>
        </div>

        <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50">
          <div className="flex p-1 bg-slate-50 rounded-2xl mb-10">
            <button
              onClick={() => setRole('buyer')}
              className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-none cursor-pointer ${role === 'buyer' ? 'bg-white shadow-sm text-[#49b6ff]' : 'text-slate-400'}`}
            >
              Я покупатель
            </button>
            <button
              onClick={() => setRole('artist')}
              className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-none cursor-pointer ${role === 'artist' ? 'bg-white shadow-sm text-[#ff499e]' : 'text-slate-400'}`}
            >
              Я художник
            </button>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase ml-4 tracking-widest">Имя</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                <input type="text" placeholder="Иван" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase ml-4 tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                <input type="email" placeholder="mail@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            {role === 'artist' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-300 uppercase ml-4 tracking-widest">Портфолио</label>
                <div className="relative">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                  <input type="text" placeholder="https://..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-pink-100" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase ml-4 tracking-widest">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Новый аккаунт здесь не создаётся: покупатели и художники уже лежат в таблице UserAccount. Нажми кнопку и войди почтой из списка, пароль demo.</p>
            <SiteLink page="login" setPage={setPage} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wide text-white shadow-xl transition-all no-underline inline-flex items-center justify-center gap-2 whitespace-nowrap ${role === 'buyer' ? 'bg-[#49b6ff] shadow-blue-400/20' : 'bg-[#ff499e] shadow-pink-400/20'}`}>
              Перейти ко входу
              <ArrowRight className="w-4 h-4 shrink-0" />
            </SiteLink>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
