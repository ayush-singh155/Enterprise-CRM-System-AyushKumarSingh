import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { getDealScope, getRecordScope, resolveAssignee } from './accessService.js';
import { assertRelatedRecordAccess, getRelatedRecordLink } from './relatedRecordService.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Lead } from '../models/Lead.js';

async function getVisibleTaskScope(user) {
  if (user.role === 'admin') return {};
  const recordScope = await getRecordScope(user);
  const dealScope = await getDealScope(user);
  const [leads, customers, deals] = await Promise.all([
    Lead.find(recordScope).distinct('_id'),
    Customer.find(recordScope).distinct('_id'),
    Deal.find(dealScope).distinct('_id')
  ]);
  return {
    $or: [
      { lead: { $in: leads } },
      { customer: { $in: customers } },
      { deal: { $in: deals } }
    ]
  };
}

/** Lists tasks associated with records visible to the caller. */
export async function listTasks(user, query) {
  const filter = await getVisibleTaskScope(user);
  const links = ['lead', 'customer', 'deal'].filter((key) => query[key]);
  if (links.length > 1) throw new AppError('Filter by only one linked record', 400);
  if (links.length === 1) {
    await assertRelatedRecordAccess(user, { [links[0]]: query[links[0]] });
    filter[links[0]] = query[links[0]];
  }
  if (query.status) filter.status = query.status;
  if (query.assignedTo) {
    filter.assignedTo = await resolveAssignee(user, query.assignedTo);
  }
  if (query.dueBefore || query.dueAfter) {
    filter.dueDate = {};
    if (query.dueBefore) filter.dueDate.$lte = query.dueBefore;
    if (query.dueAfter) filter.dueDate.$gte = query.dueAfter;
  }
  const [items, total] = await Promise.all([
    Task.find(filter).populate('assignedTo', 'name email')
      .populate('createdBy', 'name email').populate('lead', 'name company')
      .populate('customer', 'name company').populate('deal', 'title')
      .sort({ dueDate: 1, _id: 1 })
      .skip((query.page - 1) * query.limit).limit(query.limit),
    Task.countDocuments(filter)
  ]);
  const pages = Math.ceil(total / query.limit);
  return { items, total, page: query.page, limit: query.limit, pages };
}

export async function createTask(user, data) {
  const links = getRelatedRecordLink(data);
  await assertRelatedRecordAccess(user, links);
  const assignedTo = await resolveAssignee(user, data.assignedTo);
  return Task.create({ ...data, ...links, assignedTo, createdBy: user._id });
}

export async function getTask(user, id) {
  const task = await Task.findById(id);
  if (!task) throw new AppError('Task not found', 404);
  await assertRelatedRecordAccess(user, getRelatedRecordLink(task));
  return task.populate(
    'assignedTo createdBy lead customer deal',
    'name email company title'
  );
}

export async function updateTask(user, id, data) {
  const task = await Task.findById(id);
  if (!task) throw new AppError('Task not found', 404);
  await assertRelatedRecordAccess(user, getRelatedRecordLink(task));
  if (data.assignedTo) data.assignedTo = await resolveAssignee(user, data.assignedTo);
  if (data.status === 'completed' && task.status !== 'completed') task.completedAt = new Date();
  if (data.status && data.status !== 'completed') task.completedAt = null;
  Object.assign(task, data);
  await task.save();
  return task;
}

export async function deleteTask(user, id) {
  const task = await Task.findById(id);
  if (!task) throw new AppError('Task not found', 404);
  await assertRelatedRecordAccess(user, getRelatedRecordLink(task));
  await task.deleteOne();
}
