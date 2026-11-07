import { Deal } from '../models/Deal.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { DEFAULT_STAGE_PROBABILITY } from '../models/Deal.js';
import {
  getRecordScope,
  getDealScope,
  resolveAssignee,
  assertRecordAccess
} from './accessService.js';
import { AppError } from '../utils/AppError.js';
import { getSort } from '../utils/recordList.js';

async function validateLinkedRecordAccess(user, { customer, lead }) {
  if (customer) {
    const record = await Customer.findById(customer);
    if (!record) throw new AppError('Customer not found', 404);
    await assertRecordAccess(user, record);
  }
  if (lead) {
    const record = await Lead.findById(lead);
    if (!record) throw new AppError('Lead not found', 404);
    await assertRecordAccess(user, record);
  }
}

export async function listDeals(user, query) {
  const filter = await getDealScope(user);
  if (query.stage) filter.stage = query.stage;
  const andFilters = [];
  if (query.search) {
    const search = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    andFilters.push({ title: search });
  }
  if (query.assignedTo) {
    const owner = await resolveAssignee(user, query.assignedTo);
    andFilters.push({
      $or: [
        { owner },
        { owner: { $exists: false }, assignedTo: owner }
      ]
    });
  }
  if (andFilters.length) filter.$and = andFilters;
  const sort = getSort(query.sortBy, query.sortOrder, [
    'title', 'value', 'stage', 'probability', 'expectedCloseDate', 'createdAt', 'updatedAt'
  ]);
  const customerScope = await getRecordScope(user);
  const [items, total] = await Promise.all([
    Deal.find(filter).select('+assignedTo')
      .populate('owner', 'name email').populate('assignedTo', 'name email')
      .populate({ path: 'customer', select: 'name company', match: customerScope })
      .populate({ path: 'lead', select: 'name company', match: customerScope })
      .populate('stageHistory.changedBy', 'name email')
      .sort(sort).skip((query.page - 1) * query.limit).limit(query.limit),
    Deal.countDocuments(filter)
  ]);
  return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}

export async function createDeal(user, data) {
  const owner = await resolveAssignee(user, data.owner || data.assignedTo);
  await validateLinkedRecordAccess(user, data);
  const stage = data.stage || 'new';
  const probability = data.probability ?? DEFAULT_STAGE_PROBABILITY[stage];
  const dealData = { ...data };
  delete dealData.assignedTo;
  return Deal.create({
    ...dealData,
    owner,
    stage,
    probability,
    createdBy: user._id,
    stageHistory: [{ stage, probability, changedBy: user._id }]
  });
}

export async function getDeal(user, id) {
  const linkedRecordScope = await getRecordScope(user);
  const deal = await Deal.findById(id).select('+assignedTo')
    .populate('owner', 'name email').populate('assignedTo', 'name email')
    .populate({ path: 'customer', select: 'name company', match: linkedRecordScope })
    .populate({ path: 'lead', select: 'name company', match: linkedRecordScope })
    .populate('stageHistory.changedBy', 'name email');
  if (!deal) throw new AppError('Deal not found', 404);
  await assertRecordAccess(user, deal);
  if (!deal.owner && deal.assignedTo) deal.owner = deal.assignedTo;
  return deal;
}

export async function updateDeal(user, id, data) {
  const deal = await Deal.findById(id).select('+assignedTo');
  if (!deal) throw new AppError('Deal not found', 404);
  await assertRecordAccess(user, deal);
  const linkedRecords = {
    customer: Object.hasOwn(data, 'customer') ? data.customer : deal.customer,
    lead: Object.hasOwn(data, 'lead') ? data.lead : deal.lead
  };
  if (linkedRecords.customer && linkedRecords.lead) {
    throw new AppError('A deal can be linked to either a lead or a customer, not both', 400);
  }
  await validateLinkedRecordAccess(user, linkedRecords);
  const updates = { ...data };
  const requestedOwner = updates.owner || updates.assignedTo;
  delete updates.assignedTo;
  delete updates.owner;
  if (requestedOwner) deal.owner = await resolveAssignee(user, requestedOwner);
  Object.assign(deal, updates);
  await deal.save();
  return deal;
}

export async function updateDealStage(user, id, { stage, probability }) {
  const deal = await Deal.findById(id).select('+assignedTo');
  if (!deal) throw new AppError('Deal not found', 404);
  await assertRecordAccess(user, deal);

  const nextProbability = probability ?? DEFAULT_STAGE_PROBABILITY[stage];
  if (deal.stage !== stage || deal.probability !== nextProbability) {
    deal.stage = stage;
    deal.probability = nextProbability;
    deal.stageHistory.push({ stage, probability: nextProbability, changedBy: user._id });
    await deal.save();
  }
  return deal;
}

export async function deleteDeal(user, id) {
  const deal = await Deal.findById(id).select('+assignedTo');
  if (!deal) throw new AppError('Deal not found', 404);
  await assertRecordAccess(user, deal);
  await deal.deleteOne();
}
