import { useEffect, useState } from 'react';
import { Search, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { api, productImage, rub } from '../api';

const Catalog = ({ setPage, search = '', catalogFilter }) => {
  const [showFilters, setShowFilters] = useState(true);
  const [fandoms, setFandoms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [wished, setWished] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    fandomId: '',
    categoryId: '',
    sort: 'newest',
    page: 1,
    search,
    priceMin: '',
    priceMax: '',
  });

  useEffect(() => {
    if (!catalogFilter?.tick) return;
    const fandom = fandoms.find((item) => item.fandom_name === catalogFilter.fandomName);
    const category = categories.find((item) => item.category_name === catalogFilter.categoryName);
    setFilters((prev) => ({
      ...prev,
      search: catalogFilter.search ?? search ?? '',
      page: 1,
      fandomId: catalogFilter.fandomName ? (fandom ? String(fandom.fandom_id) : prev.fandomId) : '',
      categoryId: catalogFilter.categoryName ? (category ? String(category.category_id) : prev.categoryId) : '',
    }));
  }, [catalogFilter?.tick, fandoms, categories]);

  useEffect(() => {
    api.fandoms().then(setFandoms).catch((err) => setError(err.message));
    api.categories().then(setCategories).catch(() => {});
    api.wishlist().then((rows) => setWished(rows.map((row) => row.product_id))).catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    api.products({
      fandomId: filters.fandomId,
      categoryId: filters.categoryId,
      sort: filters.sort,
      page: filters.page,
      limit: 9,
      search: filters.search,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    }).then((json) => {
      if (ignore) return;
      setProducts(json.data);
      setMeta(json.meta);
      setError('');
    }).catch((err) => {
      if (!ignore) setError(err.message);
    });
    return () => { ignore = true; };
  }, [filters]);

  const toggle = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      [key]: String(prev[key]) === String(value) ? '' : value,
    }));
  };

  const wish = async (event, productId) => {
    event.stopPropagation();
    try {
      await api.toggleWish(productId);
      setWished((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
    } catch (err) {
      setError(err.message);
    }
  };

  const add = async (event, productId) => {
    event.stopPropagation();
    try {
      await api.addToCart(productId, 1);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12 animate-in fade-in duration-300">
      <aside className={`w-full lg:w-80 shrink-0 space-y-12 transition-all ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div>
          <h2 className="text-xl font-bold mb-8 flex items-center justify-between text-slate-900">
            Фильтры
            <button
              onClick={() => setFilters({ fandomId: '', categoryId: '', sort: 'newest', page: 1, search: '', priceMin: '', priceMax: '' })}
              className="text-xs font-bold text-slate-400 hover:text-[#49b6ff] uppercase tracking-widest bg-transparent border-none cursor-pointer"
            >Сбросить</button>
          </h2>

          <div className="space-y-12 text-slate-900">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Фандом</h4>
              <div className="space-y-4 px-1">
                {fandoms.map((fan) => (
                  <label key={fan.fandom_id} className="flex items-center gap-4 cursor-pointer group" onClick={() => toggle('fandomId', fan.fandom_id)}>
                    <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${String(filters.fandomId) === String(fan.fandom_id) ? 'bg-[#49b6ff] border-[#49b6ff]' : 'border-slate-200 group-hover:border-[#49b6ff]'}`}>
                      {String(filters.fandomId) === String(fan.fandom_id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="font-bold text-sm text-slate-900">{fan.fandom_name} <span className="text-slate-300">{fan.product_count}</span></span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Тип мерча</h4>
              <div className="space-y-4 px-1">
                {categories.map((cat) => (
                  <label key={cat.category_id} className="flex items-center gap-4 cursor-pointer group" onClick={() => toggle('categoryId', cat.category_id)}>
                    <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${String(filters.categoryId) === String(cat.category_id) ? 'bg-[#ff499e] border-[#ff499e]' : 'border-slate-200 group-hover:border-[#ff499e]'}`}>
                      {String(filters.categoryId) === String(cat.category_id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="font-bold text-sm text-slate-900">{cat.category_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Цена, ₽</h4>
              <div className="flex gap-4 items-center text-slate-900">
                <input type="number" placeholder="От" value={filters.priceMin} onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, priceMin: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                <span className="text-slate-300 font-bold">—</span>
                <input type="number" placeholder="До" value={filters.priceMax} onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, priceMax: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase text-slate-900">Каталог мерча</h1>
            <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">Найдено {meta.total ?? 0} товаров</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, sort: e.target.value }))}
                className="appearance-none bg-white border border-slate-100 rounded-2xl pl-6 pr-12 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="newest">Сначала новые</option>
                <option value="popular">По популярности</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden p-3 bg-slate-100 rounded-2xl border-none cursor-pointer">
              <SlidersHorizontal className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {error && <p className="mb-8 text-sm font-bold text-red-400">{error}</p>}

        <div className="relative mb-8 lg:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, search: e.target.value }))}
            placeholder="Поиск..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
          {products.map((item) => (
            <div key={item.product_id} onClick={() => setPage('product', item.product_id)} className="group cursor-pointer">
              <div className="aspect-square rounded-[48px] overflow-hidden mb-6 relative border border-slate-100 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 bg-slate-50">
                <img src={productImage(item)} alt={item.title} className="w-full h-full object-cover" />
                <button onClick={(e) => wish(e, item.product_id)} className={`absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center border-none cursor-pointer shadow-sm ${wished.includes(item.product_id) ? 'text-[#ff499e]' : 'text-slate-300 hover:text-[#ff499e]'}`}>
                  <Heart className={`w-6 h-6 ${wished.includes(item.product_id) ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute bottom-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 border border-white">{item.fandom_name}</div>
              </div>
              <div className="px-2">
                <span className="text-[10px] font-bold text-[#49b6ff] uppercase tracking-widest mb-1 block">{item.shop_name}</span>
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-[#49b6ff] transition-colors leading-tight">{item.title}</h3>
                <div className="flex justify-between items-center mt-6">
                  <span className="text-3xl font-black text-slate-900">{rub(item.price)}</span>
                  <button onClick={(e) => add(e, item.product_id)} disabled={item.stock <= 0} className="btn-blue !rounded-2xl !px-8 !py-3 !text-xs !font-black !uppercase !tracking-[0.2em] shadow-lg shadow-blue-400/20 disabled:opacity-40">
                    {item.stock > 0 ? 'В корзину' : 'Нет'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {meta.pages > 1 && (
          <div className="mt-24 flex justify-center gap-3">
            {Array.from({ length: meta.pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setFilters((prev) => ({ ...prev, page: n }))} className={`w-14 h-14 rounded-2xl font-black text-sm transition-all border-none cursor-pointer ${n === meta.page ? 'bg-[#49b6ff] text-white shadow-xl shadow-blue-400/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                {n}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;
