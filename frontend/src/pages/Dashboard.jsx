import { useEffect, useState } from 'react';
import { LayoutDashboard, Box, Package, Truck, BarChart3, LogOut, Plus } from 'lucide-react';
import { api, productImage, rub, when } from '../api';

const Dashboard = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.me().then(setMe).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="p-16 text-red-400 font-bold">{error}</p>;
  if (me && me.role_name !== 'artist') {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-center">
        <div>
          <h1 className="text-3xl font-black uppercase mb-4">Это панель художника</h1>
          <p className="text-slate-400 mb-8">Сейчас ты покупатель. Войди как studio.pan@example.com, пароль demo.</p>
          <button onClick={() => setPage('login')} className="btn-blue">Войти художником</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0">
        <div className="p-10">
          <button onClick={() => setPage('home')} className="flex items-center gap-3 border-none bg-transparent cursor-pointer">
            <div className="w-10 h-10 bg-[#ff499e] rounded-xl flex items-center justify-center"><LayoutDashboard className="text-white w-5 h-5" /></div>
            <span className="text-xl font-bold uppercase">Artist Panel</span>
          </button>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          {[
            { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
            { id: 'products', label: 'Мои товары', icon: Box },
            { id: 'orders', label: 'Заказы', icon: Package },
            { id: 'logistics', label: 'Логистика', icon: Truck },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm uppercase border-none cursor-pointer ${activeTab === item.id ? 'bg-pink-50 text-[#ff499e]' : 'text-slate-400'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-50 flex items-center gap-4">
          <div className="flex-1">
            <span className="block font-bold text-sm">{me?.shop_name || '...'}</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase">{me?.email}</span>
          </div>
          <button onClick={() => setPage('home')} className="p-2 text-slate-300 border-none bg-transparent cursor-pointer"><LogOut className="w-5 h-5" /></button>
        </div>
      </aside>
      <main className="ml-80 flex-1 p-10 lg:p-16">
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'logistics' && <OrdersView logistics />}
      </main>
    </div>
  );
};

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.analytics().then(setData).catch((err) => setError(err.message)); }, []);
  if (error) return <p className="text-red-400 font-bold">{error}</p>;
  if (!data) return <p className="text-slate-400 font-bold">Считаю продажи...</p>;
  const cards = [
    { label: 'Доход по завершённым', val: rub(data.income_total) },
    { label: 'Заказы', val: data.orders_total },
    { label: 'Продано штук', val: data.units_sold },
    { label: 'Остаток на складе', val: data.stock_total },
  ];
  return (
    <div className="space-y-12">
      <h1 className="text-4xl font-black uppercase">Аналитика продаж</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-8 rounded-[40px] border border-slate-50">
            <span className="text-[10px] font-bold uppercase text-slate-300 tracking-widest block mb-4">{card.label}</span>
            <h3 className="text-3xl font-black">{card.val}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white p-10 rounded-[40px] border border-slate-50">
        <h3 className="text-xl font-bold mb-8">Топ товаров</h3>
        {data.top_products.length === 0 && <p className="text-slate-400">Пока нет продаж. Когда покупатель оформит заказ, цифры появятся здесь.</p>}
        <div className="space-y-6">
          {data.top_products.map((item) => (
            <div key={item.product_id} className="flex items-center gap-6">
              <img src={productImage(item)} alt="" className="w-16 h-16 rounded-2xl object-cover bg-slate-50" />
              <div className="flex-1">
                <span className="font-bold block">{item.title}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">{item.quantity_sold} шт.</span>
              </div>
              <span className="font-black text-[#ff499e]">{rub(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductsView = () => {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fandoms, setFandoms] = useState([]);
  const [form, setForm] = useState({ title: '', price: '', stock: '1', categoryId: '', fandomId: '', description: '' });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [stamp, setStamp] = useState(0);

  const load = () => api.artistProducts().then(setRows).catch((err) => setError(err.message));
  useEffect(() => {
    load();
    api.categories().then((list) => { setCategories(list); setForm((prev) => ({ ...prev, categoryId: list[0]?.category_id || '' })); });
    api.fandoms().then((list) => { setFandoms(list); setForm((prev) => ({ ...prev, fandomId: list[0]?.fandom_id || '' })); });
  }, []);

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.createProduct({
        title: form.title,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        fandomId: Number(form.fandomId),
        description: form.description,
      });
      setOpen(false);
      setForm((prev) => ({ ...prev, title: '', price: '', description: '' }));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveStock = async (id, stock) => {
    try {
      await api.setStock(id, Number(stock));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const upload = async (id, file) => {
    if (!file) return;
    const dataUrl = await file.arrayBuffer();
    const bytes = new Uint8Array(dataUrl);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    try {
      await api.uploadImage(id, btoa(binary), file.type || 'image/png');
      setStamp(Date.now());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <h1 className="text-4xl font-black uppercase">Мои товары</h1>
        <button onClick={() => setOpen(!open)} className="bg-[#ff499e] text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase border-none cursor-pointer flex items-center gap-2"><Plus className="w-5 h-5" /> Добавить</button>
      </header>
      {error && <p className="text-sm font-bold text-red-400">{error}</p>}
      {open && (
        <form onSubmit={create} className="bg-white rounded-[32px] p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Название" className="rounded-2xl border border-slate-100 px-4 py-3 font-bold outline-none" />
          <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Цена" className="rounded-2xl border border-slate-100 px-4 py-3 font-bold outline-none" />
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Остаток" className="rounded-2xl border border-slate-100 px-4 py-3 font-bold outline-none" />
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-2xl border border-slate-100 px-4 py-3 font-bold">
            {categories.map((cat) => <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>)}
          </select>
          <select value={form.fandomId} onChange={(e) => setForm({ ...form, fandomId: e.target.value })} className="rounded-2xl border border-slate-100 px-4 py-3 font-bold">
            {fandoms.map((fan) => <option key={fan.fandom_id} value={fan.fandom_id}>{fan.fandom_name}</option>)}
          </select>
          <button className="btn-blue">Сохранить в базу</button>
        </form>
      )}
      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-300"><tr><th className="p-6">Товар</th><th className="p-6">Остаток</th><th className="p-6">Фото в базу</th></tr></thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.product_id} className="border-b border-slate-50">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={`${productImage(item)}&t=${stamp}`} alt="" className="w-14 h-14 rounded-2xl object-cover bg-slate-50" />
                    <div>
                      <span className="font-bold block">{item.title}</span>
                      <span className="text-xs text-slate-400">{rub(item.price)} · {item.category_name}</span>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <input defaultValue={item.stock} onBlur={(e) => saveStock(item.product_id, e.target.value)} className="w-20 rounded-xl border border-slate-100 px-3 py-2 font-bold" />
                </td>
                <td className="p-6">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(item.product_id, e.target.files?.[0])} className="text-xs" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrdersView = () => {
  const [rows, setRows] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState('');
  const load = () => api.artistOrders().then(setRows).catch((err) => setError(err.message));
  useEffect(() => {
    load();
    api.statuses().then(setStatuses).catch(() => {});
  }, []);

  const save = async (id, status, trackingNumber) => {
    try {
      await api.setOrderStatus(id, status, trackingNumber);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black uppercase">Заказы покупателей</h1>
      {error && <p className="text-sm font-bold text-red-400">{error}</p>}
      {rows.length === 0 && <p className="text-slate-400 font-bold">Когда кто-то купит твой товар, заказ появится здесь. Статус пишется в базу.</p>}
      <div className="space-y-4">
        {rows.map((order) => (
          <div key={order.order_id} className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <span className="font-black">#{order.order_id}</span>
              <p className="text-sm text-slate-400">{when(order.order_date)} · {order.buyer_email}</p>
              <p className="font-bold mt-2">{rub(order.artist_total)} · {order.units} шт.</p>
            </div>
            <select value={order.status_name} onChange={(e) => save(order.order_id, e.target.value, order.tracking_number)} className="rounded-2xl border border-slate-100 px-4 py-3 font-bold">
              {!statuses.some((st) => st.status_name === order.status_name) && <option value={order.status_name}>{order.status_name}</option>}
              {statuses.map((st) => <option key={st.status_id} value={st.status_name}>{st.status_name}</option>)}
            </select>
            <input defaultValue={order.tracking_number || ''} placeholder="Трек Boxberry" onBlur={(e) => save(order.order_id, order.status_name, e.target.value)} className="rounded-2xl border border-slate-100 px-4 py-3 font-bold" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
