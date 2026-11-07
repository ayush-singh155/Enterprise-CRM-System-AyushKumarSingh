import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const pageSize = 20;
const emptyCustomer = { name: '', email: '', phone: '', company: '', notes: '', assignedTo: '' };
const displayDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : '—';

function CustomerModal({ customer, assignees, onClose, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(customer ? {
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    company: customer.company || '',
    notes: customer.notes || '',
    assignedTo: customer.assignedTo?._id || ''
  } : emptyCustomer);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const key of ['email', 'phone', 'company', 'notes']) {
        if (!payload[key]) delete payload[key];
      }
      if (!payload.assignedTo) delete payload.assignedTo;
      if (customer) {
        await api.patch(`/customers/${customer._id}`, payload);
        toast('Customer updated.');
      } else {
        await api.post('/customers', payload);
        toast('Customer created.');
      }
      await onSaved();
    } catch (error) {
      toast(error.response?.data?.error || 'Could not save this customer.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const canAssign = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <form onSubmit={submit} className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-brand">CUSTOMER RECORD</p><h2 className="mt-1 text-xl font-semibold text-ink">{customer ? 'Edit customer' : 'Add a customer'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label="Close dialog">✕</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Full name *
            <input autoFocus required maxLength={120} name="name" className="field mt-1.5" value={form.name} onChange={updateField} />
          </label>
          <label className="text-sm font-medium text-slate-700">Company
            <input maxLength={120} name="company" className="field mt-1.5" value={form.company} onChange={updateField} />
          </label>
          <label className="text-sm font-medium text-slate-700">Email
            <input type="email" maxLength={254} name="email" className="field mt-1.5" value={form.email} onChange={updateField} />
          </label>
          <label className="text-sm font-medium text-slate-700">Phone
            <input maxLength={40} name="phone" className="field mt-1.5" value={form.phone} onChange={updateField} />
          </label>
          {canAssign && <label className="text-sm font-medium text-slate-700 sm:col-span-2">Owner
            <select name="assignedTo" className="field mt-1.5" value={form.assignedTo || user._id} onChange={updateField}>
              <option value={user._id}>Assign to me</option>
              {assignees.filter((assignee) => assignee._id !== user._id).map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name}</option>)}
            </select>
          </label>}
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes
            <textarea maxLength={3000} rows={3} name="notes" className="field mt-1.5 resize-y" value={form.notes} onChange={updateField} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{saving ? 'Saving…' : customer ? 'Save changes' : 'Create customer'}</button>
        </div>
      </form>
    </div>
  );
}

export function CustomersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadCustomers = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: pageSize, sortBy: 'updatedAt', sortOrder: 'desc' };
      if (search) params.search = search;
      const { data } = await api.get('/customers', { params });
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not load customers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => { loadCustomers(page); }, [loadCustomers, page]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') return;
    api.get('/users/assignees')
      .then(({ data }) => setAssignees(data.items))
      .catch((error) => toast(error.response?.data?.error || 'Could not load team members.', 'error'));
  }, [toast, user?.role]);

  async function deleteCustomer(customer) {
    if (!window.confirm(`Delete "${customer.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${customer._id}`);
      toast('Customer deleted.');
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadCustomers(page);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not delete this customer.', 'error');
    }
  }

  const pages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-sm font-medium text-brand">CUSTOMER RELATIONSHIPS</p><h1 className="text-3xl font-semibold tracking-tight text-ink">Customers</h1><p className="mt-2 text-sm text-slate-500">Keep customer details and relationship context in one place.</p></div>
        <button onClick={() => { setModalCustomer(null); setModalOpen(true); }} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">＋ Add customer</button>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span>
            <input aria-label="Search customers" className="field pl-9" placeholder="Search name, company, email…" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </label>
          <button onClick={() => loadCustomers(page)} className="rounded-lg px-3 py-2 text-sm text-brand hover:bg-brand-pale">Refresh</button>
        </div>
        {loading ? <div className="p-14 text-center text-sm text-slate-500">Loading customers…</div> : items.length === 0 ?
          <div className="p-14 text-center"><p className="font-medium text-ink">No customers found</p><p className="mt-1 text-sm text-slate-500">Try another search or add your first customer.</p></div> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((customer) => <tr key={customer._id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><p className="font-medium text-ink">{customer.name}</p><p className="mt-1 text-xs text-slate-500">{customer.email || 'No email'}</p></td>
                  <td className="px-5 py-4 text-slate-600">{customer.company || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{customer.phone || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{customer.assignedTo?.name || '—'}</td>
                  <td className="px-5 py-4 text-slate-500">{displayDate(customer.updatedAt)}</td>
                  <td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => { setModalCustomer(customer); setModalOpen(true); }} className="text-xs font-medium text-brand hover:text-brand-dark">Edit</button><button onClick={() => deleteCustomer(customer)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>}
        {!loading && total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} customers</p>
          <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button><span className="min-w-16 text-center text-xs text-slate-500">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button></div>
        </div>}
      </section>

      {modalOpen && <CustomerModal customer={modalCustomer} assignees={assignees} onClose={() => setModalOpen(false)} onSaved={async () => { setModalOpen(false); setPage(1); await loadCustomers(1); }} />}
    </div>
  );
}
