import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import Support from './pages/Support';
import { ShoppingBag, Search, Heart } from 'lucide-react';
import { api } from './api';
import { SiteLink, readRoute, rememberRoute } from './seo';

const Header = ({ setPage, openCatalog, currentPage, catalogFilter, cartCount, onSearch }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="container mx-auto px-6 h-20 flex items-center">
      <SiteLink page="home" setPage={setPage} className="flex items-center gap-2 no-underline text-inherit group mr-20">
        <div className="w-10 h-10 bg-[#49b6ff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-400/20 group-hover:scale-110 transition-transform">
          <ShoppingBag className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">Merchania</span>
      </SiteLink>

      <nav className="hidden md:flex items-center gap-10 flex-1">
        <SiteLink page="catalog" onClick={() => openCatalog()} className={`nav-button no-underline ${currentPage === 'catalog' && !catalogFilter.categoryName ? 'text-[#49b6ff] font-bold' : 'text-slate-500 font-medium hover:text-[#49b6ff]'}`}>Каталог</SiteLink>
        <a href="/catalog?category=Стикеры" onClick={(event) => { event.preventDefault(); openCatalog({ categoryName: 'Стикеры' }); }} className={`nav-button no-underline ${currentPage === 'catalog' && catalogFilter.categoryName === 'Стикеры' ? 'text-[#49b6ff] font-bold' : 'text-slate-500 font-medium hover:text-[#49b6ff]'}`}>Стикеры</a>
        <a href="/catalog?category=Значки" onClick={(event) => { event.preventDefault(); openCatalog({ categoryName: 'Значки' }); }} className={`nav-button no-underline ${currentPage === 'catalog' && catalogFilter.categoryName === 'Значки' ? 'text-[#49b6ff] font-bold' : 'text-slate-500 font-medium hover:text-[#49b6ff]'}`}>Значки</a>
        <SiteLink page="support" setPage={setPage} className={`nav-button no-underline ${currentPage === 'support' ? 'text-[#49b6ff] font-bold' : 'text-slate-500 font-medium hover:text-[#49b6ff]'}`}>Помощь</SiteLink>
      </nav>

      <div className="flex items-center gap-4">
        <form
          className="relative hidden lg:block"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(new FormData(e.currentTarget).get('q'));
          }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            name="q"
            type="text"
            placeholder="Поиск мерча..."
            className="pl-11 pr-6 py-2.5 bg-gray-50 border-none rounded-full w-64 focus:ring-2 focus:ring-[#49b6ff]/20 outline-none text-sm transition-all"
          />
        </form>
        <SiteLink page="account" setPage={setPage} className="p-2.5 text-gray-400 hover:text-[#ff499e] hover:bg-pink-50 rounded-full transition-all no-underline">
          <Heart className="w-6 h-6" />
        </SiteLink>
        <SiteLink page="cart" setPage={setPage} className="p-2.5 text-gray-400 hover:text-[#49b6ff] hover:bg-blue-50 rounded-full relative transition-all no-underline">
          <ShoppingBag className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute top-2 right-2 bg-[#ff499e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
          )}
        </SiteLink>
        <SiteLink page="login" setPage={setPage} className="btn-blue py-2 px-6 ml-2 no-underline">
          Войти
        </SiteLink>
      </div>
    </div>
  </header>
);

const Footer = ({ setPage, openCatalog }) => (
  <footer className="bg-slate-900 text-white pt-20 pb-10 mt-20">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-8 h-8 bg-[#49b6ff] rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            Merchania
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Первый специализированный маркетплейс для независимых художников и коллекционеров авторского мерча.
          </p>
        </div>
        <div>
          <p className="font-bold mb-8 uppercase tracking-widest text-xs text-slate-500">Покупателям</p>
          <ul className="space-y-4 text-sm text-slate-300 list-none p-0">
            <li><SiteLink page="catalog" onClick={() => openCatalog()} className="hover:text-[#49b6ff] no-underline">Каталог товаров</SiteLink></li>
            <li><SiteLink page="support" setPage={setPage} className="hover:text-[#49b6ff] no-underline">Доставка и оплата</SiteLink></li>
            <li><SiteLink page="support" setPage={setPage} className="hover:text-[#49b6ff] no-underline">Вопросы и ответы</SiteLink></li>
          </ul>
        </div>
        <div>
          <p className="font-bold mb-8 uppercase tracking-widest text-xs text-slate-500">Художникам</p>
          <ul className="space-y-4 text-sm text-slate-300 list-none p-0">
            <li><SiteLink page="register" setPage={setPage} className="hover:text-[#ff499e] no-underline">Стать продавцом</SiteLink></li>
            <li><SiteLink page="dashboard" setPage={setPage} className="hover:text-[#ff499e] no-underline">Личный кабинет автора</SiteLink></li>
            <li><SiteLink page="support" setPage={setPage} className="hover:text-[#ff499e] no-underline">Правила площадки</SiteLink></li>
          </ul>
        </div>
        <div>
          <p className="font-bold mb-8 uppercase tracking-widest text-xs text-slate-500">Контакты</p>
          <p className="text-sm text-slate-300 mb-2">support@merchania.ru</p>
          <p className="text-sm text-slate-300">+7 (999) 000-00-00</p>
        </div>
      </div>
      <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs text-slate-500">© 2024 Merchania. Все права защищены. Дизайн: Прямой шрифт.</p>
        <div className="flex gap-8 text-xs text-slate-500 uppercase tracking-widest font-bold">
            <span className="hover:text-white cursor-pointer">Политика</span>
            <span className="hover:text-white cursor-pointer">Оферта</span>
        </div>
      </div>
    </div>
  </footer>
);

export default function App() {
  const start = readRoute();
  const [page, setPage] = useState(start.page);
  const [productId, setProductId] = useState(start.productId);
  const [search, setSearch] = useState(start.search);
  const [catalogFilter, setCatalogFilter] = useState({ fandomName: '', categoryName: '', search: '', tick: 0 });
  const [cartCount, setCartCount] = useState(0);

  const openCatalog = (filter = {}) => {
    setCatalogFilter({
      fandomName: filter.fandomName || '',
      categoryName: filter.categoryName || '',
      search: filter.search ?? '',
      tick: Date.now(),
    });
    setSearch(filter.search ?? '');
    setPage('catalog');
    rememberRoute('catalog', null, filter.search || '');
  };

  const go = (next, id) => {
    if (id != null) setProductId(id);
    setPage(next);
    rememberRoute(next, id);
  };

  useEffect(() => {
    const onPop = () => {
      const route = readRoute();
      setPage(route.page);
      setProductId(route.productId);
      setSearch(route.search);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, productId]);

  useEffect(() => {
    const refresh = () => {
      api.cart().then((cart) => setCartCount(Number(cart.items_count) || 0)).catch(() => setCartCount(0));
    };
    refresh();
    window.addEventListener('merchania-user', refresh);
    window.addEventListener('merchania-cart', refresh);
    return () => {
      window.removeEventListener('merchania-user', refresh);
      window.removeEventListener('merchania-cart', refresh);
    };
  }, [page]);

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home setPage={go} openCatalog={openCatalog} />;
      case 'catalog': return <Catalog setPage={go} search={search} catalogFilter={catalogFilter} />;
      case 'product': return <Product setPage={go} productId={productId} />;
      case 'cart': return <Cart setPage={go} />;
      case 'checkout': return <Checkout setPage={go} />;
      case 'login': return <Login setPage={go} />;
      case 'register': return <Register setPage={go} />;
      case 'forgot-password': return <ForgotPassword setPage={go} />;
      case 'account': return <Account setPage={go} />;
      case 'dashboard': return <Dashboard setPage={go} />;
      case 'support': return <Support setPage={go} />;
      default: return <Home setPage={go} />;
    }
  };

  const isDashboard = page === 'dashboard';

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-white selection:bg-blue-100">
      {!isDashboard && (
        <Header
          setPage={go}
          openCatalog={openCatalog}
          currentPage={page}
          catalogFilter={catalogFilter}
          cartCount={cartCount}
          onSearch={(q) => openCatalog({ search: String(q || '') })}
        />
      )}

      <main className="flex-grow">
        {renderPage()}
      </main>

      {!isDashboard && <Footer setPage={go} openCatalog={openCatalog} />}

      {!['cart', 'checkout', 'dashboard', 'login', 'register'].includes(page) && (
        <SiteLink
          page="cart"
          setPage={go}
          className="fixed bottom-10 right-10 w-16 h-16 bg-[#49b6ff] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 no-underline"
        >
          <ShoppingBag className="w-7 h-7" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff499e] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-4 border-white">{cartCount}</span>
          )}
        </SiteLink>
      )}
    </div>
  );
}
