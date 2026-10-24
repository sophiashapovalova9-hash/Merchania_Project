export const PAGE_PATH = {
  home: '/',
  catalog: '/catalog',
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  account: '/account',
  dashboard: '/dashboard',
  support: '/support',
};

export function hrefFor(page, id) {
  if (page === 'product' && id != null) return `/product/${id}`;
  return PAGE_PATH[page] || '/';
}

export function readRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const product = path.match(/^\/product\/(\d+)$/);
  if (product) return { page: 'product', productId: Number(product[1]), search: params.get('search') || '' };
  const found = Object.entries(PAGE_PATH).find(([, href]) => href === path);
  return { page: found ? found[0] : 'home', productId: null, search: params.get('search') || '' };
}

export function rememberRoute(page, id, search = '') {
  const path = hrefFor(page, id);
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const next = `${path}${query}`;
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.pushState({ page, id: id ?? null, search }, '', next);
  }
}

export function SiteLink({ page, id, className, children, onClick, setPage }) {
  return (
    <a
      href={hrefFor(page, id)}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (onClick) onClick(event);
        else setPage?.(page, id);
      }}
    >
      {children}
    </a>
  );
}

export function ClosedPage({ title }) {
  return (
    <>
      <title>{`${title} — Merchania`}</title>
      <meta name="robots" content="noindex, nofollow" />
    </>
  );
}
