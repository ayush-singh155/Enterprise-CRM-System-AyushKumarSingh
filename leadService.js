import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { resolveAssignee, assertRecordAccess } from './accessService.js';
import { AppError } from '../utils/AppError.js';
import { buildRecordFilter, getSort } from '../utils/recordList.js';

export async function listLeads(user, query) {
  const filter = await buildRecordFilter(user, query, ['status', 'source', 'company']);
  const sort = getSort(query.sortBy, query.sortOrder, [
    'name', 'company', 'email', 'status', 'source', 'createdAt', 'updatedAt'
  ]);
  const [items, total] = await Promise.all([
    Lead.find(filter).populate('assignedTo', 'name email').sort(sort)
      .skip((query.page - 1) * query.limit).limit(query.limit),
    Lead.countDocuments(filter)
  ]);
  return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}

export async function createLead(user, data) {
  const assignedTo = await resolveAssignee(user, data.assignedTo);
  return Lead.create({ ...data, assignedTo, createdBy: user._id });
}

export async function getLead(user, id) {
  const lead = await Lead.findById(id).populate('assignedTo', 'name email');
  if (!lead) throw new AppError('Lead not found', 404);
  await assertRecordAccess(user, lead);
  return lead;
}

export async function updateLead(user, id, data) {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);
  await assertRecordAccess(user, lead);
  if (data.assignedTo) data.assignedTo = await resolveAssignee(user, data.assignedTo);
  Object.assign(lead, data);
  await lead.save();
  return lead;
}

export async function deleteLead(user, id) {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);
  await assertRecordAccess(user, lead);
  await lead.deleteOne();
}

export async function convertLead(user, id) {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);
  await assertRecordAccess(user, lead);

  if (lead.convertedCustomer) {
    const customer = await Customer.findById(lead.convertedCustomer);
    if (customer) {
      await assertRecordAccess(user, customer);
      return { customer, alreadyConverted: true };
    }
  }

  let customer = await Customer.findOne({ sourceLead: lead._id });
  if (customer) await assertRecordAccess(user, customer);
  if (!customer) {
    try {
      customer = await Customer.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        assignedTo: lead.assignedTo,
        createdBy: user._id,
        sourceLead: lead._id
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      customer = await Customer.findOne({ sourceLead: lead._id });
      if (!customer) throw error;
      await assertRecordAccess(user, customer);
    }
  }

  lead.convertedCustomer = customer._id;
  lead.status = 'converted';
  await lead.save();
  return { customer, alreadyConverted: false };
}
