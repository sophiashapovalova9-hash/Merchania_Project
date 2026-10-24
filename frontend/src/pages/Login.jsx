import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { DEMO_USERS, setUserId } from '../api';
import { ClosedPage, SiteLink } from '../seo';

const Login = ({ setPage }) => {
  const [email, setEmail] = useState('ivan@example.com');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const user = DEMO_USERS.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== user.password) {
      setError('Такого аккаунта нет в базе. Возьми почту и пароль demo из списка ниже.');
      return;
    }
    setUserId(user.id);
    setPage(user.id === 1 ? 'account' : 'dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <ClosedPage title="Вход" />
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">С возвращением</h1>
          <p className="text-slate-400 mt-4 font-medium">Войди учебным аккаунтом из базы</p>
        </div>
        <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50">
          <form className="space-y-6" onSubmit={submit}>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold outline-none" />
            </div>
            {error && <p className="text-sm font-bold text-red-400">{error}</p>}
            <button type="submit" className="w-full btn-blue !py-4 !text-sm !uppercase !tracking-wide whitespace-nowrap">
              Войти в систему
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>
          <ul className="mt-8 space-y-2 text-xs text-slate-400">
            {DEMO_USERS.map((user) => (
              <li key={user.id}>
                <button type="button" onClick={() => { setEmail(user.email); setPassword(user.password); }} className="border-none bg-transparent cursor-pointer text-left hover:text-[#49b6ff]">
                  {user.email} / demo — {user.who}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-slate-400 text-center">Нет аккаунта? <SiteLink page="register" setPage={setPage} className="text-[#ff499e] font-bold no-underline">Создать новый</SiteLink></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
