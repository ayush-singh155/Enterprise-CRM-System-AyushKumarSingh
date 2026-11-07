import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from './Navbar';

const navigation = [
  { to: '/', label: 'Overview', icon: '◫' },
  { to: '/leads', label: 'Leads', icon: '◎' },
  { to: '/customers', label: 'Customers', icon: '♧' },
  { to: '/pipeline', label: 'Pipeline', icon: '↗' },
  { to: '/deals', label: 'Deals', icon: '◇' }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      toast(error.response?.data?.error || 'Signed out locally, but the server could not confirm logout.', 'error');
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] md:flex">
      <aside className="flex w-full flex-col bg-[#111c33] px-5 py-6 text-white md:fixed md:inset-y-0 md:w-64">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold">N</div>
          <div><p className="font-semibold tracking-wide">Northstar</p><p className="text-xs text-slate-400">CRM Workspace</p></div>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</p>
        <nav className="flex gap-2 overflow-auto md:flex-col">
          {[...navigation, ...(user?.role === 'admin' ? [{ to: '/users', label: 'Users', icon: '♙' }] : [])].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
            }>
              <span className="w-5 text-center text-base">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-5 md:mt-auto">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dbe5ff] text-sm font-bold text-brand">{user?.name?.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{user?.name}</p><p className="text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ')}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white">Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:ml-64 md:px-10 md:py-8">
        <Navbar />
        <Outlet />
      </main>
    </div>
  );
}
