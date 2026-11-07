import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const stages = [
  { id: 'new', label: 'New', color: 'bg-slate-400' },
  { id: 'contacted', label: 'Contacted', color: 'bg-sky-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-violet-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'bg-rose-500' }
];

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const dateLabel = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
  : null;

export function PipelinePage() {
  const toast = useToast();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const allDeals = [];
      let page = 1;
      let pages = 1;
      do {
        const { data } = await api.get('/deals', { params: { page, limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' } });
        allDeals.push(...data.items);
        pages = data.pages || 1;
        page += 1;
      } while (page <= pages);
      setDeals(allDeals);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not load the sales pipeline.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadDeals(); }, [loadDeals, reloadKey]);

  const dealsByStage = useMemo(() => Object.fromEntries(
    stages.map(({ id }) => [id, deals.filter((deal) => deal.stage === id)])
  ), [deals]);

  async function moveDeal(result) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const deal = deals.find((item) => item._id === draggableId);
    if (!deal) return;

    const nextStage = destination.droppableId;
    setDeals((current) => current.map((item) =>
      item._id === draggableId ? { ...item, stage: nextStage } : item
    ));
    setMoving((current) => ({ ...current, [draggableId]: true }));

    try {
      const { data } = await api.patch(`/deals/${draggableId}/stage`, { stage: nextStage });
      setDeals((current) => current.map((item) =>
        item._id === draggableId ? { ...item, ...data.item, owner: item.owner, customer: item.customer, lead: item.lead } : item
      ));
      toast(`Deal moved to ${stages.find((stage) => stage.id === nextStage)?.label}.`);
    } catch (error) {
      toast(error.response?.data?.error || 'Could not update the deal stage.', 'error');
      setReloadKey((current) => current + 1);
    } finally {
      setMoving((current) => {
        const next = { ...current };
        delete next[draggableId];
        return next;
      });
    }
  }

  const pipelineValue = deals
    .filter((deal) => !['won', 'lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-sm font-medium text-brand">OPPORTUNITY MANAGEMENT</p><h1 className="text-3xl font-semibold tracking-tight text-ink">Sales pipeline</h1><p className="mt-2 text-sm text-slate-500">Move deals across stages as your conversations progress.</p></div>
        <div className="flex items-center gap-3"><div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 sm:block"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open pipeline</p><p className="mt-0.5 text-sm font-semibold text-ink">{currency.format(pipelineValue)}</p></div><Link to="/deals" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Manage deals</Link></div>
      </div>
      {loading ? <div className="surface p-14 text-center text-sm text-slate-500">Loading pipeline…</div> : deals.length === 0 ?
        <div className="surface p-14 text-center"><p className="font-medium text-ink">Your pipeline is empty</p><p className="mt-1 text-sm text-slate-500">Create a deal to start tracking opportunities.</p><Link to="/deals" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">Add your first deal</Link></div> :
        <DragDropContext onDragEnd={moveDeal}>
          <div className="-mx-5 overflow-x-auto px-5 pb-5 md:-mx-10 md:px-10">
            <div className="flex min-h-[65vh] min-w-max items-start gap-4">
              {stages.map((stage) => {
                const stageDeals = dealsByStage[stage.id];
                const total = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                return <section key={stage.id} className="w-[290px] rounded-2xl border border-slate-200/80 bg-slate-100/70 p-3">
                  <header className="mb-3 flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} /><h2 className="text-sm font-semibold text-ink">{stage.label}</h2><span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{stageDeals.length}</span></div>
                    <span className="text-xs font-medium text-slate-500">{currency.format(total)}</span>
                  </header>
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[55vh] space-y-3 rounded-xl p-1 transition ${snapshot.isDraggingOver ? 'bg-brand-pale/70' : ''}`}>
                      {stageDeals.map((deal, index) => {
                        const linkedName = deal.customer?.name || deal.lead?.name;
                        const ownerName = deal.owner?.name || deal.assignedTo?.name;
                        return <Draggable key={deal._id} draggableId={deal._id} index={index} isDragDisabled={Boolean(moving[deal._id])}>
                          {(dragProvided, dragSnapshot) => <article ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className={`rounded-xl border bg-white p-4 shadow-sm transition ${dragSnapshot.isDragging ? 'border-brand shadow-lg' : 'border-slate-200/80 hover:border-slate-300'}`}>
                            <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold leading-5 text-ink">{deal.title}</h3><span className="cursor-grab text-slate-300" aria-label="Drag deal">⠿</span></div>
                            <p className="mt-3 text-lg font-semibold tracking-tight text-ink">{currency.format(deal.value)}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{deal.probability ?? 0}% probability</span>{dateLabel(deal.expectedCloseDate) && <span>Close {dateLabel(deal.expectedCloseDate)}</span>}</div>
                            {(linkedName || ownerName) && <div className="mt-3 border-t border-slate-100 pt-3">
                              {linkedName && <p className="truncate text-xs text-slate-600">{linkedName}</p>}
                              {ownerName && <p className="mt-1 truncate text-[11px] text-slate-400">Owner · {ownerName}</p>}
                            </div>}
                          </article>}
                        </Draggable>;
                      })}
                      {provided.placeholder}
                      {!stageDeals.length && <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Drop deals here</div>}
                    </div>}
                  </Droppable>
                </section>;
              })}
            </div>
          </div>
        </DragDropContext>}
    </div>
  );
}
