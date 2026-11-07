import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const pageSize = 20;
const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'converted'];
const leadSources = ['Website', 'Referral', 'Conference', 'LinkedIn', 'Partner', 'Other'];
const emptyLead = {
  name: '', email: '', phone: '', company: '', source: '', status: 'new', notes: '', assignedTo: ''
};

const displayDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : '—';

function LeadModal({ lead, assignees, onClose, onSaved }) {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(lead ? {
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    source: lead.source || '',
    status: lead.status || 'new',
    notes: lead.notes || '',
    assignedTo: lead.assignedTo?._id || lead.assignedTo || ''
  } : emptyLead);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (lead?.status === 'converted') delete payload.status;
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.company) delete payload.company;
      if (!payload.source) delete payload.source;
      if (!payload.notes) delete payload.notes;
      if (!payload.assignedTo) delete payload.assignedTo;
      if (lead) {
        await api.patch(`/leads/${lead._id}`, payload);
        toast('Lead updated.');
      } else {
        await api.post('/leads', payload);
        toast('Lead created.');
      }
      onSaved();
    } catch (error) {
      toast(error.response?.data?.error || 'Could not save this lead.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <form onSubmit={submit} className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-brand">{lead ? 'Update record' : 'New opportunity'}</p><h2 className="mt-1 text-xl font-semibold text-ink">{lead ? 'Edit lead' : 'Add a lead'}</h2></div>
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
          <label className="text-sm font-medium text-slate-700">Source
            <select name="source" className="field mt-1.5" value={form.source} onChange={updateField}>
              <option value="">Select a source</option>{leadSources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Status
            <select name="status" className="field mt-1.5" value={form.status} onChange={updateField}>
              {leadStatuses.filter((status) => status !== 'converted' || lead?.status === 'converted').map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          {(user?.role === 'admin' || user?.role === 'manager') && <label className="text-sm font-medium text-slate-700 sm:col-span-2">Owner
            <select name="assignedTo" className="field mt-1.5" value={form.assignedTo} onChange={updateField}>
              <option value="">Assign to me</option>
              {assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name}</option>)}
            </select>
          </label>}
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes
            <textarea maxLength={3000} rows={3} name="notes" className="field mt-1.5 resize-y" value={form.notes} onChange={updateField} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{saving ? 'Saving…' : lead ? 'Save changes' : 'Create lead'}</button>
        </div>
      </form>
    </div>
  );
}

export function LeadsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLead, setModalLead] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadLeads = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: pageSize, sortBy: 'updatedAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (status) params.status = status;
      if (source) params.source = source;
      const { data } = await api.get('/leads', { params });
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not load leads.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, source, toast]);

  useEffect(() => { loadLeads(page); }, [loadLeads, page]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') return;
    api.get('/users/assignees')
      .then(({ data }) => setAssignees(data.items))
      .catch((error) => toast(error.response?.data?.error || 'Could not load team members.', 'error'));
  }, [toast, user?.role]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function openCreate() {
    setModalLead(null);
    setModalOpen(true);
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Delete "${lead.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/leads/${lead._id}`);
      toast('Lead deleted.');
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadLeads(page);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not delete this lead.', 'error');
    }
  }

  const pages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-sm font-medium text-brand">PROSPECT MANAGEMENT</p><h1 className="text-3xl font-semibold tracking-tight text-ink">Leads</h1><p className="mt-2 text-sm text-slate-500">Find, qualify, and follow up on your prospects.</p></div>
        <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">＋ Add lead</button>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span>
            <input aria-label="Search leads" className="field pl-9" placeholder="Search name, company, email…" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </label>
          <select aria-label="Filter by status" className="field md:w-48" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>
            <option value="">All statuses</option>{leadStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter by source" className="field md:w-48" value={source} onChange={(event) => changeFilter(setSource, event.target.value)}>
            <option value="">All sources</option>{leadSources.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        {loading ? <div className="p-14 text-center text-sm text-slate-500">Loading leads…</div> : items.length === 0 ?
          <div className="p-14 text-center"><p className="font-medium text-ink">No leads found</p><p className="mt-1 text-sm text-slate-500">Try another search or add your first lead.</p></div> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-3">Lead</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Source</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((lead) => <tr key={lead._id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><Link to={`/leads/${lead._id}`} className="font-medium text-ink hover:text-brand">{lead.name}</Link><p className="mt-1 text-xs text-slate-500">{lead.email || lead.phone || 'No contact details'}</p></td>
                  <td className="px-5 py-4 text-slate-600">{lead.company || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{lead.source || '—'}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${lead.status === 'converted' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-pale text-brand'}`}>{lead.status}</span></td>
                  <td className="px-5 py-4 text-slate-600">{lead.assignedTo?.name || '—'}</td>
                  <td className="px-5 py-4 text-slate-500">{displayDate(lead.updatedAt)}</td>
                  <td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => { setModalLead(lead); setModalOpen(true); }} className="text-xs font-medium text-brand hover:text-brand-dark">Edit</button><button onClick={() => deleteLead(lead)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>}
        {!loading && total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} leads</p>
          <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button><span className="min-w-16 text-center text-xs text-slate-500">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button></div>
        </div>}
      </section>

      {modalOpen && <LeadModal lead={modalLead} assignees={assignees} onClose={() => setModalOpen(false)} onSaved={async () => { setModalOpen(false); setPage(1); await loadLeads(1); }} />}
    </div>
  );
}
