import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { api, productImage, rub } from '../api';
import { ClosedPage } from '../seo';

const Cart = ({ setPage }) => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.cart().then(setCart).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const change = async (productId, quantity) => {
    try {
      setCart(await api.setQuantity(productId, quantity));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (productId) => {
    try {
      setCart(await api.removeFromCart(productId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !cart) return <p className="container mx-auto px-6 py-24 text-red-400 font-bold">{error}</p>;
  if (!cart) return <p className="container mx-auto px-6 py-24 text-slate-400 font-bold">Загружаю корзину...</p>;

  return (
    <div className="container mx-auto px-6 py-12 animate-in fade-in duration-500">
      <ClosedPage title="Корзина" />
      <h1 className="text-4xl font-black mb-16 tracking-tight uppercase text-slate-900">Ваша корзина</h1>
      {error && <p className="mb-8 text-sm font-bold text-red-400">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-8">
          {cart.items.length === 0 && <p className="text-slate-400 font-bold">Корзина пустая. Добавь товар из каталога — он сохранится в базе.</p>}
          {cart.items.map((item) => (
            <div key={item.product_id} className="flex flex-col sm:flex-row items-center gap-8 p-8 border border-slate-100 rounded-[40px] bg-white shadow-sm">
              <img src={productImage(item)} alt={item.title} width="96" height="96" className="w-24 h-24 rounded-3xl object-cover bg-slate-100" />
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[10px] font-bold text-[#49b6ff] uppercase tracking-widest mb-1 block">{item.shop_name}</span>
                <h2 className="font-bold text-xl text-slate-800 tracking-tight">{item.title}</h2>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                <button onClick={() => change(item.product_id, Math.max(1, item.quantity - 1))} className="w-9 h-9 bg-white rounded-lg shadow-sm border-none cursor-pointer inline-flex items-center justify-center p-0"><Minus className="w-4 h-4" /></button>
                <span className="font-black text-lg w-6 text-center leading-none">{item.quantity}</span>
                <button onClick={() => change(item.product_id, item.quantity + 1)} className="w-9 h-9 bg-white rounded-lg shadow-sm border-none cursor-pointer inline-flex items-center justify-center p-0"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="text-2xl font-black text-slate-900 min-w-[100px] text-right">{rub(item.line_total)}</div>
              <button onClick={() => remove(item.product_id)} className="p-3 text-slate-200 hover:text-red-400 border-none bg-transparent cursor-pointer">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {cart.to_free_shipping > 0 && (
            <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 flex items-center gap-6 text-[#49b6ff]">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Truck className="w-6 h-6" /></div>
              <p className="text-sm text-slate-600 font-medium">Добавьте товаров ещё на <span className="font-black">{rub(cart.to_free_shipping)}</span> для бесплатной доставки.</p>
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <div className="bg-white rounded-[48px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 text-slate-900">
            <h2 className="text-xl font-bold mb-10 tracking-tight">Итог заказа</h2>
            <div className="space-y-5 mb-10 pb-10 border-b border-slate-50">
              <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span>Товары ({cart.items_count})</span>
                <span className="text-slate-900">{rub(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span>Доставка</span>
                <span className="text-slate-900">{rub(cart.shipping)}</span>
              </div>
            </div>
            <div className="flex justify-between items-end mb-12">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">К оплате</span>
              <span className="text-5xl font-black text-[#ff499e] leading-none tracking-tighter">{rub(cart.total)}</span>
            </div>
            <button onClick={() => setPage('checkout')} disabled={!cart.items.length} className="w-full btn-blue !py-5 !text-lg !uppercase !tracking-wide whitespace-nowrap shadow-xl shadow-blue-400/20 disabled:opacity-40">
              Оформить заказ
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
