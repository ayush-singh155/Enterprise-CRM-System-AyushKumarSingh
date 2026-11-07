import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your workspace…</div>;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (error) {
      toast(error.response?.data?.error || 'Unable to sign in. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-white md:grid-cols-[1.05fr_.95fr]">
      <section className="hidden flex-col justify-between bg-[#111c33] p-12 text-white md:flex">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold">N</div><span className="font-semibold tracking-wide">Northstar CRM</span></div>
        <div className="max-w-lg"><p className="mb-5 text-sm font-semibold uppercase tracking-[.2em] text-blue-300">Customer relationships, in focus</p><h1 className="text-5xl font-semibold leading-tight">Build stronger relationships. Close with confidence.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-300">One clear view of your customers, opportunities, and the work that moves every deal forward.</p></div>
        <p className="text-sm text-slate-500">Your team's next chapter starts here.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <p className="mb-3 text-sm font-semibold text-brand">WELCOME BACK</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Sign in to your workspace</h2>
          <p className="mt-2 text-sm text-slate-500">Enter your account details to continue.</p>
          <label className="mt-8 block text-sm font-medium">Work email<input required type="email" autoComplete="email" className="field mt-2" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="mt-5 block text-sm font-medium">Password<input required type="password" autoComplete="current-password" className="field mt-2" placeholder="Your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button disabled={busy} className="mt-7 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="mt-5 text-xs leading-5 text-slate-400">Your administrator creates and manages CRM accounts. Contact them if you need access.</p>
        </form>
      </section>
    </div>
  );
}
