import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales_rep', managerId: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.items);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  const managers = users.filter((user) => user.role === 'manager');
  const filteredUsers = users.filter((user) =>
    (!roleFilter || user.role === roleFilter) &&
    `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, managerId: form.role === 'sales_rep' ? form.managerId : undefined };
      await api.post('/users', payload);
      setForm({ name: '', email: '', password: '', role: 'sales_rep', managerId: '' });
      toast('User created.');
      await loadUsers();
    } catch (error) {
      toast(error.response?.data?.error || 'Could not create user.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-7"><p className="mb-2 text-sm font-medium text-brand">WORKSPACE ADMINISTRATION</p><h1 className="text-3xl font-semibold tracking-tight text-ink">Users</h1><p className="mt-2 text-sm text-slate-500">Create user accounts, assign roles, and organize reporting lines.</p></div>
      <form onSubmit={handleSubmit} className="surface mb-6 p-5 md:p-6">
        <h2 className="mb-4 font-semibold text-ink">Add a user</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium">Full name<input required maxLength={120} className="field mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="text-sm font-medium">Work email<input required type="email" className="field mt-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="text-sm font-medium">Temporary password<input required minLength={12} type="password" className="field mt-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label className="text-sm font-medium">Role<select className="field mt-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, managerId: '' })}><option value="sales_rep">Sales rep</option><option value="manager">Manager</option></select></label>
          {form.role === 'sales_rep' && <label className="text-sm font-medium">Reports to<select required className="field mt-2" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}><option value="">Select a manager</option>{managers.map((manager) => <option key={manager._id} value={manager._id}>{manager.name}</option>)}</select></label>}
        </div>
        <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{saving ? 'Creating…' : 'Create account'}</button></div>
      </form>
      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div className="flex-1"><h2 className="font-semibold text-ink">Workspace users</h2><p className="mt-1 text-xs text-slate-400">{filteredUsers.length} of {users.length} active accounts</p></div><input aria-label="Search users" className="field sm:max-w-xs" placeholder="Search name or email…" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter by role" className="field sm:w-44" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="sales_rep">Sales rep</option></select></div>
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading users…</div> : filteredUsers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Manager</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user._id}><td className="px-5 py-4"><p className="font-medium text-ink">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></td><td className="px-5 py-4 capitalize text-slate-600">{user.role.replace('_', ' ')}</td><td className="px-5 py-4 text-slate-600">{user.managerId?.name || '—'}</td></tr>)}</tbody>
        </table></div> : <div className="p-10 text-center text-sm text-slate-500">No users match these filters.</div>}
      </section>
    </div>
  );
}
