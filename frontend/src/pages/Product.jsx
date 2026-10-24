import { useEffect, useState } from 'react';
import { Star, Heart, ShieldCheck, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import { api, productImage, rub } from '../api';

const Product = ({ setPage, productId }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [wished, setWished] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!productId) return;
    api.product(productId).then(setProduct).catch((err) => setError(err.message));
    api.wishlist().then((rows) => setWished(rows.some((row) => row.product_id === productId))).catch(() => {});
  }, [productId]);

  if (!productId) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <p className="text-slate-400 font-bold mb-6">Открой товар из каталога — тогда подтянется карточка из базы.</p>
        <button onClick={() => setPage('catalog')} className="btn-blue">В каталог</button>
      </div>
    );
  }

  if (error) return <p className="container mx-auto px-6 py-24 text-red-400 font-bold">{error}</p>;
  if (!product) return <p className="container mx-auto px-6 py-24 text-slate-400 font-bold">Загружаю товар...</p>;

  const add = async () => {
    try {
      await api.addToCart(product.product_id, 1);
      setPage('cart');
    } catch (err) {
      setNote(err.message);
    }
  };

  const wish = async () => {
    try {
      await api.toggleWish(product.product_id);
      setWished((v) => !v);
    } catch (err) {
      setNote(err.message);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-12">
        <button onClick={() => setPage('home')} className="hover:text-[#49b6ff] border-none bg-transparent cursor-pointer">Главная</button>
        <ChevronRight className="w-4 h-4" />
        <button onClick={() => setPage('catalog')} className="hover:text-[#49b6ff] border-none bg-transparent cursor-pointer">Каталог</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
        <div className="aspect-square bg-slate-50 rounded-[64px] overflow-hidden border border-slate-100 shadow-inner">
          <img src={productImage(product)} alt={product.title} className="w-full h-full object-cover" />
        </div>

        <div className="pt-6 text-slate-900">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[#49b6ff] font-black uppercase text-sm">{product.shop_name}</span>
            <div className="flex items-center gap-2 text-[#49b6ff]">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-slate-900 font-black text-sm uppercase">{product.rating ?? '—'} <span className="text-slate-300 font-medium ml-1">({product.review_count || 0})</span></span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6 uppercase">{product.title}</h1>
          <div className="text-4xl font-black mb-6">{rub(product.price)}</div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">{product.category_name} · {product.fandom_name}</p>
          <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-xl font-medium">{product.description}</p>

          {note && <p className="mb-6 text-sm font-bold text-red-400">{note}</p>}

          <div className="flex gap-6 mb-16">
            <button onClick={add} disabled={product.stock <= 0} className="flex-1 btn-blue !py-5 !text-lg !uppercase !tracking-widest shadow-2xl shadow-blue-400/30 disabled:opacity-40">
              {product.stock > 0 ? 'Добавить в корзину' : 'Нет в наличии'}
            </button>
            <button onClick={wish} className={`w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 cursor-pointer ${wished ? 'text-[#ff499e] bg-pink-50' : 'text-slate-300 bg-slate-50'}`}>
              <Heart className={`w-6 h-6 ${wished ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
              <Truck className="w-6 h-6 text-[#49b6ff]" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Доставка</span>
              <span className="text-xs font-bold">от 2-х дней</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Гарантия</span>
              <span className="text-xs font-bold">Безопасная сделка</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
              <RotateCcw className="w-6 h-6 text-[#ff499e]" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Остаток</span>
              <span className="text-xs font-bold">{product.stock} штук</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
