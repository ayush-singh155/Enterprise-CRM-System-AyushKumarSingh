import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const options = {
  leads: {
    title: 'Leads',
    description: 'Track new prospects and move promising conversations forward.',
    endpoint: '/leads',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'company', label: 'Company' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'source', label: 'Source' }
    ],
    columns: ['name', 'company', 'email', 'status', 'assignedTo'],
    status: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
  },
  customers: {
    title: 'Customers',
    description: 'Keep customer details and relationship context in one place.',
    endpoint: '/customers',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'company', label: 'Company' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'notes', label: 'Notes' }
    ],
    columns: ['name', 'company', 'email', 'phone', 'assignedTo']
  },
  deals: {
    title: 'Sales pipeline',
    description: 'Manage opportunities, forecast value, and see every deal stage.',
    endpoint: '/deals',
    fields: [
      { name: 'title', label: 'Deal name', required: true },
      { name: 'value', label: 'Value (USD)', type: 'number', required: true },
      { name: 'probability', label: 'Probability (%)', type: 'number', min: 0, max: 100 },
      { name: 'stage', label: 'Stage', type: 'select', choices: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
      { name: 'expectedCloseDate', label: 'Expected close', type: 'date' }
    ],
    columns: ['title', 'value', 'stage', 'probability', 'expectedCloseDate', 'owner'],
    status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  }
};

function displayValue(value, column) {
  if (column === 'assignedTo' || column === 'owner') return value?.name || '—';
  if (column === 'probability' && value != null) return `${value}%`;
  if (column === 'expectedCloseDate' && value) return new Date(value).toLocaleDateString();
  if (column === 'value' && value != null) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  return value || '—';
}

export function ResourcePage({ resource }) {
  const config = options[resource];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({});
  const [assignees, setAssignees] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const toast = useToast();
  const { user } = useAuth();

  const loadItems = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(config.endpoint, { params: { page: targetPage } });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      toast(error.response?.data?.error || `Could not load ${config.title.toLowerCase()}.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [config, toast]);

  useEffect(() => { loadItems(1); }, [loadItems]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      api.get('/users/assignees')
        .then(({ data }) => setAssignees(data.items))
        .catch((error) => toast(error.response?.data?.error || 'Could not load team members.', 'error'));
    }
  }, [toast, user?.role]);

  async function createItem(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.value !== undefined) payload.value = Number(payload.value);
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.stage && resource === 'deals') payload.stage = 'new';
      await api.post(config.endpoint, payload);
      setForm({});
      setCreating(false);
      toast(`${config.title.slice(0, -1) || config.title} created.`);
      await loadItems(1);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not save this record.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item, status) {
    try {
      const { data } = resource === 'deals'
        ? await api.patch(`${config.endpoint}/${item._id}/stage`, { stage: status })
        : await api.patch(`${config.endpoint}/${item._id}`, { status });
      setItems((current) => current.map((row) => row._id === item._id
        ? { ...data.item, assignedTo: row.assignedTo, owner: row.owner }
        : row));
      toast('Record updated.');
    } catch (error) {
      toast(error.response?.data?.error || 'Could not update this record.', 'error');
    }
  }

  async function reassignItem(item, assignedTo) {
    try {
      await api.patch(`${config.endpoint}/${item._id}`, { assignedTo });
      toast('Record reassigned.');
      await loadItems(page);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not reassign this record.', 'error');
    }
  }

  async function convertLead(item) {
    try {
      await api.post(`${config.endpoint}/${item._id}/convert`);
      toast('Lead converted to a customer.');
      await loadItems(page);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not convert this lead.', 'error');
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name || item.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`${config.endpoint}/${item._id}`);
      setItems((current) => current.filter((row) => row._id !== item._id));
      toast('Record deleted.');
    } catch (error) {
      toast(error.response?.data?.error || 'Could not delete this record.', 'error');
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-sm font-medium text-brand">CUSTOMER RELATIONSHIPS</p><h1 className="text-3xl font-semibold tracking-tight text-ink">{config.title}</h1><p className="mt-2 text-sm text-slate-500">{config.description}</p></div>
        <button onClick={() => setCreating((value) => !value)} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">{creating ? 'Close form' : `＋ Add ${resource === 'deals' ? 'deal' : resource.slice(0, -1)}`}</button>
      </div>

      {creating && <form onSubmit={createItem} className="surface mb-6 p-5">
        <h2 className="mb-4 font-semibold text-ink">Create {resource === 'deals' ? 'deal' : resource.slice(0, -1)}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.fields.map((field) => <label key={field.name} className="text-sm font-medium text-slate-700">{field.label}
            {field.type === 'select' ? <select className="field mt-2" value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
              <option value="">Select a stage</option>{field.choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
            </select> : <input className="field mt-2" type={field.type || 'text'} required={field.required} min={field.min ?? (field.type === 'number' ? 0 : undefined)} max={field.max} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />}
          </label>)}
          {(user?.role === 'admin' || user?.role === 'manager') && <label className="text-sm font-medium text-slate-700">Assign to
            <select className="field mt-2" value={form.assignedTo || ''} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Myself</option>{assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name}</option>)}
            </select>
          </label>}
        </div>
        <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save record'}</button></div>
      </form>}

      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-ink">All {config.title.toLowerCase()}</h2><p className="mt-1 text-xs text-slate-400">{total} records · page {page}</p></div><button onClick={() => loadItems(page)} className="rounded-lg px-3 py-2 text-sm text-brand hover:bg-brand-pale">Refresh</button></div>
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading records…</div> : items.length === 0 ? <div className="p-12 text-center"><p className="font-medium text-ink">Nothing here yet</p><p className="mt-1 text-sm text-slate-500">Add your first {resource === 'deals' ? 'deal' : resource.slice(0, -1)} to get started.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr>{config.columns.map((column) => <th className="px-5 py-3" key={column}>{column === 'assignedTo' ? 'Owner' : column.replace(/([A-Z])/g, ' $1')}</th>)}<th className="px-5 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item._id} className="hover:bg-slate-50/70">
              {config.columns.map((column) => <td className="px-5 py-4 text-slate-600" key={column}>
                {config.status && (column === 'status' || column === 'stage') ?
                  item.status === 'converted' ?
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium capitalize text-emerald-700">converted</span> :
                    <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs capitalize text-slate-700" value={item[column]} onChange={(e) => updateStatus(item, e.target.value)}>{config.status.map((status) => <option key={status} value={status}>{status}</option>)}</select> :
                  (column === 'assignedTo' || column === 'owner') && (user?.role === 'admin' || user?.role === 'manager') ?
                    <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700" value={(item.owner || item.assignedTo)?._id || ''} onChange={(e) => reassignItem(item, e.target.value)}>
                      {assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name}</option>)}
                    </select> :
                  <span className={column === 'name' || column === 'title' ? 'font-medium text-ink' : 'capitalize'}>{displayValue(column === 'owner' ? (item.owner || item.assignedTo) : item[column], column)}</span>}
              </td>)}
              <td className="px-5 py-4"><div className="flex items-center gap-3">
                {resource === 'leads' && item.status !== 'converted' && <button onClick={() => convertLead(item)} className="text-xs font-medium text-brand hover:text-brand-dark">Convert</button>}
                <button onClick={() => deleteItem(item)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
              </div></td>
            </tr>)}</tbody>
          </table></div>}
        {!loading && total > 20 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2"><button disabled={page <= 1} onClick={() => loadItems(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button><button disabled={page * 20 >= total} onClick={() => loadItems(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button></div>
        </div>}
      </section>
    </div>
  );
}
