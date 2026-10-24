import { useEffect, useState } from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { api, rub } from '../api';
import { ClosedPage } from '../seo';

const Checkout = ({ setPage }) => {
  const [cart, setCart] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('card');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.cart().then(setCart).catch((err) => setError(err.message));
  }, []);

  const pay = async () => {
    const shippingAddress = [name, address].filter(Boolean).join(', ');
    if (shippingAddress.length < 5) {
      setError('Напиши имя и адрес, куда везти заказ.');
      return;
    }
    try {
      const result = await api.checkout(shippingAddress, payment);
      window.dispatchEvent(new Event('merchania-cart'));
      setDone(result.order);
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-xl text-center">
        <ClosedPage title="Заказ сохранён" />
        <h1 className="text-4xl font-black uppercase mb-6">Заказ сохранён</h1>
        <p className="text-slate-500 font-medium mb-4">Номер в базе: {done.order_id}. Статус: {done.status_name}.</p>
        <p className="text-slate-400 mb-10">Обнови страницу или зайди в кабинет — заказ не пропадёт, он лежит в таблице Orders.</p>
        <button onClick={() => setPage('account')} className="btn-blue">К заказам</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        <ClosedPage title="Оформление заказа" />
        <h1 className="text-4xl font-black text-slate-900 uppercase mb-16 tracking-tight">Оформление заказа</h1>
        {error && <p className="mb-8 text-sm font-bold text-red-400">{error}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold uppercase mb-8">Куда доставить</h2>
              <div className="grid grid-cols-1 gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес или ПВЗ Boxberry" className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" />
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold uppercase mb-8">Оплата</h2>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setPayment('card')} className={`flex flex-col items-center gap-3 p-6 rounded-[32px] cursor-pointer border-2 ${payment === 'card' ? 'border-[#49b6ff] bg-blue-50/50 text-[#49b6ff]' : 'border-slate-100 text-slate-300'}`}>
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold text-xs uppercase">Картой</span>
                </button>
                <button type="button" onClick={() => setPayment('sbp')} className={`flex flex-col items-center gap-3 p-6 rounded-[32px] cursor-pointer border-2 ${payment === 'sbp' ? 'border-[#49b6ff] bg-blue-50/50 text-[#49b6ff]' : 'border-slate-100 text-slate-300'}`}>
                  <span className="font-bold text-xs uppercase">СБП</span>
                </button>
              </div>
            </section>
          </div>

          <aside>
            <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50 text-slate-900">
              <h2 className="text-xl font-bold mb-10">Ваш заказ</h2>
              <div className="space-y-6 mb-10 pb-10 border-b border-slate-50">
                <div className="flex justify-between font-bold text-sm text-slate-400"><span>Товары</span><span className="text-slate-900">{rub(cart?.subtotal)}</span></div>
                <div className="flex justify-between font-bold text-sm text-slate-400"><span>Доставка</span><span className="text-slate-900">{rub(cart?.shipping)}</span></div>
              </div>
              <div className="flex justify-between items-end mb-12">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Итого</span>
                <span className="text-5xl font-black text-[#ff499e] leading-none">{rub(cart?.total)}</span>
              </div>
              <button onClick={pay} className="w-full btn-blue !py-5 uppercase tracking-widest !font-black">Оплатить {rub(cart?.total)}</button>
              <div className="flex items-center justify-center gap-2 mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Заказ пишется в базу
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
