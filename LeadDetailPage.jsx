import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const dateTime = (value) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value));

export function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState({ type: 'call', subject: '', content: '' });

  const loadLead = useCallback(async () => {
    setLoading(true);
    try {
      const [leadResponse, timelineResponse] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get('/activities/timeline', { params: { lead: id, page: 1, limit: 100 } })
      ]);
      setLead(leadResponse.data.item);
      setActivities(timelineResponse.data.items);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not load lead details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { loadLead(); }, [loadLead]);

  async function addActivity(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/activities', { ...activity, lead: id });
      setActivity({ type: 'call', subject: '', content: '' });
      toast('Activity added to the timeline.');
      const { data } = await api.get('/activities/timeline', { params: { lead: id, page: 1, limit: 100 } });
      setActivities(data.items);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not save activity.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function convertLead() {
    try {
      const { data } = await api.post(`/leads/${id}/convert`);
      toast(data.alreadyConverted ? 'This lead was already converted.' : 'Lead converted to a customer.');
      await loadLead();
    } catch (error) {
      toast(error.response?.data?.error || 'Could not convert this lead.', 'error');
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-slate-500">Loading lead…</div>;
  if (!lead) return <div className="surface p-10 text-center"><p className="font-medium text-ink">Lead not found</p><button onClick={() => navigate('/leads')} className="mt-3 text-sm text-brand">Back to leads</button></div>;

  return (
    <div>
      <Link to="/leads" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand">← Back to leads</Link>
      <section className="surface mb-6 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">LEAD PROFILE</p><h1 className="text-3xl font-semibold tracking-tight text-ink">{lead.name}</h1><p className="mt-2 text-slate-500">{lead.company || 'No company specified'}</p></div>
          <div className="flex items-center gap-3"><span className="rounded-full bg-brand-pale px-3 py-1.5 text-xs font-medium capitalize text-brand">{lead.status}</span>{lead.status !== 'converted' && <button onClick={convertLead} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Convert to customer</button>}</div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-slate-400">Email</p><p className="mt-1 text-sm text-ink">{lead.email || '—'}</p></div>
          <div><p className="text-xs text-slate-400">Phone</p><p className="mt-1 text-sm text-ink">{lead.phone || '—'}</p></div>
          <div><p className="text-xs text-slate-400">Source</p><p className="mt-1 text-sm text-ink">{lead.source || '—'}</p></div>
          <div><p className="text-xs text-slate-400">Owner</p><p className="mt-1 text-sm text-ink">{lead.assignedTo?.name || '—'}</p></div>
        </div>
        {lead.notes && <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{lead.notes}</p>}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold text-ink">Activity timeline</h2><p className="mt-1 text-sm text-slate-500">Calls, meetings, notes, and emails for this lead.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{activities.length}</span></div>
          {activities.length ? <div className="space-y-5">
            {activities.map((item) => <article key={item._id} className="relative border-l border-slate-200 pb-1 pl-5 last:border-transparent">
              <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-white" />
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold capitalize text-ink">{item.subject || item.type}</p><time className="text-xs text-slate-400">{dateTime(item.occurredAt)}</time></div>
              {item.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.content}</p>}
              <p className="mt-2 text-xs capitalize text-slate-400">{item.type} · {item.createdBy?.name || 'Team member'}{item.emailStatus ? ` · ${item.emailStatus}` : ''}</p>
            </article>)}
          </div> : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No activity yet. Log your first interaction.</div>}
        </section>

        <form onSubmit={addActivity} className="surface h-fit p-5">
          <h2 className="font-semibold text-ink">Log an activity</h2><p className="mt-1 text-sm text-slate-500">Add a call, meeting, or note.</p>
          <label className="mt-5 block text-sm font-medium text-slate-700">Activity type
            <select className="field mt-1.5" value={activity.type} onChange={(event) => setActivity({ ...activity, type: event.target.value })}><option value="call">Call</option><option value="meeting">Meeting</option><option value="note">Note</option></select>
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Subject
            <input maxLength={200} className="field mt-1.5" value={activity.subject} onChange={(event) => setActivity({ ...activity, subject: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Notes
            <textarea rows={5} maxLength={20000} className="field mt-1.5 resize-y" value={activity.content} onChange={(event) => setActivity({ ...activity, content: event.target.value })} />
          </label>
          <button disabled={saving} className="mt-4 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving…' : 'Add to timeline'}</button>
        </form>
      </div>
    </div>
  );
}
