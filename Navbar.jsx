import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': 'Overview',
  '/leads': 'Leads',
  '/customers': 'Customers',
  '/pipeline': 'Sales pipeline',
  '/deals': 'Deals',
  '/team': 'Users',
  '/users': 'Users'
};

export function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const title = useMemo(() => pageTitles[pathname] || (pathname.startsWith('/leads/') ? 'Lead details' : 'Workspace'), [pathname]);

  return (
    <header className="mb-7 flex min-h-14 items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
      <div>
        <p className="text-xs font-medium text-slate-400">WORKSPACE / {title.toUpperCase()}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ')}</p>
        </div>
        <div aria-label={user?.name ? `${user.name} profile` : 'User profile'} className="grid h-10 w-10 place-items-center rounded-full bg-brand-pale text-sm font-semibold text-brand">
          {user?.name?.slice(0, 1).toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
