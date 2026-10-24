import { useEffect, useState } from 'react';
import { Heart, User, LogOut, Package } from 'lucide-react';
import { api, logout, productImage, rub, when } from '../api';
import { ClosedPage, SiteLink } from '../seo';

const Account = ({ setPage }) => {
  const [tab, setTab] = useState('orders');
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.me().then((user) => {
      setMe(user);
      setForm({ firstName: user.first_name || '', lastName: user.last_name || '', phone: user.phone || '' });
    }).catch((err) => setError(err.message));
    api.orders().then(setOrders).catch(() => {});
    api.wishlist().then(setWishes).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const user = await api.saveProfile(form);
      setMe(user);
      setNote('Сохранено в базе. Обнови страницу — имя останется.');
    } catch (err) {
      setError(err.message);
    }
  };

  const exit = () => {
    logout();
    setPage('login');
  };

  return (
    <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
      <ClosedPage title="Личный кабинет" />
      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-[#49b6ff] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
            {(me?.first_name || 'М')[0]}
          </div>
          <p className="font-bold text-slate-900 mb-1">{me ? `${me.first_name || ''} ${me.last_name || ''}` : '...'}</p>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{me?.email}</p>
          <nav className="mt-12 space-y-2 text-left">
            <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm border-none cursor-pointer ${tab === 'orders' ? 'bg-blue-50 text-[#49b6ff]' : 'text-slate-400'}`}><Package className="w-5 h-5" /> Заказы</button>
            <button onClick={() => setTab('wishlist')} className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm border-none cursor-pointer ${tab === 'wishlist' ? 'bg-blue-50 text-[#49b6ff]' : 'text-slate-400'}`}><Heart className="w-5 h-5" /> Избранное</button>
            <button onClick={() => setTab('profile')} className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm border-none cursor-pointer ${tab === 'profile' ? 'bg-blue-50 text-[#49b6ff]' : 'text-slate-400'}`}><User className="w-5 h-5" /> Профиль</button>
            <button onClick={exit} className="w-full flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm text-red-300 border-none cursor-pointer"><LogOut className="w-5 h-5" /> Выход</button>
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        {error && <p className="mb-6 text-sm font-bold text-red-400">{error}</p>}
        {tab === 'orders' && (
          <div className="space-y-8">
            <h1 className="text-4xl font-black uppercase">История заказов</h1>
            {orders.length === 0 && <p className="text-slate-400 font-bold">Пока пусто. Оформи заказ из корзины — он появится здесь и в таблице Orders.</p>}
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-[40px] border-2 border-slate-50 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex gap-10">
                    <div><span className="text-[8px] font-bold text-slate-300 uppercase block mb-1">Дата</span><span className="font-bold">{when(order.order_date)}</span></div>
                    <div><span className="text-[8px] font-bold text-slate-300 uppercase block mb-1">Статус</span><span className="text-[#49b6ff] font-bold uppercase text-[10px]">{order.status_name}</span></div>
                  </div>
                  <span className="text-2xl font-bold text-[#ff499e]">{rub(order.total_amount)}</span>
                </div>
                <div className="p-8">
                  <span className="font-bold">{order.item_count} товар(ов)</span>
                  <p className="text-xs text-slate-400 mt-1">{order.shipping_address}</p>
                  {order.tracking_number && <p className="text-xs text-slate-500 mt-2">Трек: {order.tracking_number}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'wishlist' && (
          <div className="space-y-8">
            <h1 className="text-4xl font-black uppercase">Избранное</h1>
            {wishes.length === 0 && <p className="text-slate-400 font-bold">Сердечко на товаре сохраняет его в таблицу Wishlist.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {wishes.map((item) => (
                <SiteLink key={item.product_id} page="product" id={item.product_id} setPage={setPage} className="text-left bg-white rounded-[32px] border border-slate-100 p-4 no-underline text-inherit block">
                  <img src={productImage(item)} alt={item.title} width="400" height="400" className="w-full aspect-square object-cover rounded-3xl mb-4" />
                  <span className="font-bold block">{item.title}</span>
                  <span className="text-[#ff499e] font-black">{rub(item.price)}</span>
                </SiteLink>
              ))}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-8">
            <h1 className="text-4xl font-black uppercase">Профиль</h1>
            <div className="bg-white rounded-[48px] p-12 border border-slate-100 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Имя" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" />
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Фамилия" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" />
              </div>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" />
              {note && <p className="text-sm font-bold text-emerald-500">{note}</p>}
              <button onClick={save} className="btn-blue !px-12 !py-4 uppercase text-sm !font-black">Сохранить изменения</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Account;
