import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});
const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const sourceColors = ['#3563e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#f43f5e', '#64748b'];
const stageOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

function localDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00Z`));
}

function ChartEmpty({ children }) {
  return <div className="grid h-64 place-items-center text-center text-sm text-slate-400">{children}</div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => localDateInput(new Date(new Date().getFullYear(), 0, 1)));
  const [endDate, setEndDate] = useState(() => localDateInput(new Date()));
  const [dateRange, setDateRange] = useState(() => ({
    startDate: localDateInput(new Date(new Date().getFullYear(), 0, 1)),
    endDate: localDateInput(new Date())
  }));
  const invalidRange = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      setLoading(true);
      setSummary(null);
      try {
        const params = {};
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        const { data } = await api.get('/dashboard/summary', { params, signal: controller.signal });
        setSummary(data);
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') {
          toast(error.response?.data?.error || 'Could not load dashboard.', 'error');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadDashboard();
    return () => controller.abort();
  }, [dateRange, toast]);

  const kpis = [
    { label: 'Total leads', value: summary?.totalLeads ?? '—', note: 'Created in the selected range', icon: '◎' },
    { label: 'Conversion rate', value: summary ? `${percent.format(summary.conversionRate)}%` : '—', note: 'Leads converted in the selected range', icon: '↗' },
    { label: 'Revenue won', value: summary ? money.format(summary.revenueWon) : '—', note: 'Revenue from won deals', icon: '$' },
    { label: 'Open pipeline', value: summary ? money.format(summary.openPipelineValue) : '—', note: summary ? `${summary.openDealCount} open deals` : 'Open opportunities', icon: '◫' },
    { label: 'Customers', value: summary?.customerCount ?? '—', note: 'Customers added in the selected range', icon: '♧' }
  ];
  const monthlyRevenue = summary?.monthlyRevenue || [];
  const leadsBySource = summary?.leadsBySource || [];
  const stagesByName = new Map((summary?.dealsByStage || []).map((item) => [item.stage || item.name, item]));
  const funnel = stageOrder.map((stage) => ({
    stage,
    count: stagesByName.get(stage)?.count || 0
  }));
  const reps = summary?.topPerformingReps || [];

  function applyDateRange(event) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) return;
    setDateRange({ startDate, endDate });
  }

  function clearDateRange() {
    setStartDate('');
    setEndDate('');
    setDateRange({ startDate: '', endDate: '' });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-brand">YOUR BUSINESS AT A GLANCE</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-2 text-sm text-slate-500">A live view of customer relationships and sales performance.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium capitalize text-emerald-700">{user?.role?.replace('_', ' ')} data</span>
      </div>

      <form onSubmit={applyDateRange} className="surface mb-6 flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs font-medium text-slate-500">From
          <input aria-label="Start date" type="date" className="field mt-1.5 min-w-40" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-500">To
          <input aria-label="End date" type="date" className="field mt-1.5 min-w-40" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <button disabled={invalidRange} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">Apply range</button>
        <button type="button" onClick={clearDateRange} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">All time</button>
        {invalidRange && <p role="alert" className="w-full text-xs text-rose-600">The start date must be on or before the end date.</p>}
      </form>

      <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((stat, index) => <article key={stat.label} className="surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${index % 2 ? 'bg-violet-50 text-violet-600' : 'bg-brand-pale text-brand'}`}>{stat.icon}</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-ink">{loading && !summary ? '…' : stat.value}</p>
          <p className="mt-2 text-xs text-slate-400">{stat.note}</p>
        </article>)}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <article className="surface p-5 md:p-6">
          <div className="mb-5"><h2 className="font-semibold text-ink">Monthly revenue</h2><p className="mt-1 text-sm text-slate-500">Revenue recognized when deals are won</p></div>
          {loading && !summary ? <ChartEmpty>Loading revenue…</ChartEmpty> : monthlyRevenue.length ? <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f5" vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 12 }} />
                <YAxis tickFormatter={(value) => money.format(value)} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 11 }} width={78} />
                <Tooltip labelFormatter={monthLabel} formatter={(value) => [money.format(value), 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" fill="#3563e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <ChartEmpty>No won revenue in this date range.</ChartEmpty>}
        </article>

        <article className="surface p-5 md:p-6">
          <div className="mb-5"><h2 className="font-semibold text-ink">Leads by source</h2><p className="mt-1 text-sm text-slate-500">Where prospects in this range came from</p></div>
          {loading && !summary ? <ChartEmpty>Loading lead sources…</ChartEmpty> : leadsBySource.length ? <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3}>
                  {leadsBySource.map((item, index) => <Cell key={item.source} fill={sourceColors[index % sourceColors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Leads']} />
                <Legend verticalAlign="bottom" height={30} />
              </PieChart>
            </ResponsiveContainer>
          </div> : <ChartEmpty>No leads in this date range.</ChartEmpty>}
        </article>

        <article className="surface p-5 md:p-6">
          <div className="mb-5"><h2 className="font-semibold text-ink">Opportunity funnel</h2><p className="mt-1 text-sm text-slate-500">Deal count by current pipeline stage</p></div>
          {loading && !summary ? <ChartEmpty>Loading pipeline…</ChartEmpty> : funnel.some((item) => item.count) ? <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 4 }}>
                <CartesianGrid stroke="#eef0f5" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" width={95} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 11 }} className="capitalize" />
                <Tooltip formatter={(value) => [value, 'Deals']} />
                <Bar dataKey="count" name="Deals" fill="#3563e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <ChartEmpty>No deals in this date range.</ChartEmpty>}
        </article>

        <article className="surface overflow-hidden p-5 md:p-6">
          <div className="mb-5"><h2 className="font-semibold text-ink">{user?.role === 'sales_rep' ? 'Your performance' : 'Top performers'}</h2><p className="mt-1 text-sm text-slate-500">Rep results for the selected date range</p></div>
          {loading && !summary ? <ChartEmpty>Loading rep results…</ChartEmpty> : reps.length ? <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reps} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 4 }}>
                <CartesianGrid stroke="#eef0f5" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => money.format(value)} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={105} axisLine={false} tickLine={false} tick={{ fill: '#778198', fontSize: 11 }} />
                <Tooltip formatter={(value) => [money.format(value), 'Revenue won']} />
                <Bar dataKey="revenueWon" name="Revenue won" fill="#3563e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <ChartEmpty>No rep results in this date range.</ChartEmpty>}
        </article>
      </section>
    </div>
  );
}
