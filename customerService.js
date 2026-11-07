import { Customer } from '../models/Customer.js';
import { resolveAssignee, assertRecordAccess } from './accessService.js';
import { AppError } from '../utils/AppError.js';
import { buildRecordFilter, getSort } from '../utils/recordList.js';

export async function listCustomers(user, query) {
  const filter = await buildRecordFilter(user, query, ['company']);
  const sort = getSort(query.sortBy, query.sortOrder, [
    'name', 'company', 'email', 'createdAt', 'updatedAt'
  ]);
  const [items, total] = await Promise.all([
    Customer.find(filter).populate('assignedTo', 'name email').sort(sort)
      .skip((query.page - 1) * query.limit).limit(query.limit),
    Customer.countDocuments(filter)
  ]);
  return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}

export async function createCustomer(user, data) {
  const assignedTo = await resolveAssignee(user, data.assignedTo);
  return Customer.create({ ...data, assignedTo, createdBy: user._id });
}

export async function getCustomer(user, id) {
  const customer = await Customer.findById(id).populate('assignedTo', 'name email');
  if (!customer) throw new AppError('Customer not found', 404);
  await assertRecordAccess(user, customer);
  return customer;
}

export async function updateCustomer(user, id, data) {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  await assertRecordAccess(user, customer);
  if (data.assignedTo) data.assignedTo = await resolveAssignee(user, data.assignedTo);
  Object.assign(customer, data);
  await customer.save();
  return customer;
}

export async function deleteCustomer(user, id) {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  await assertRecordAccess(user, customer);
  await customer.deleteOne();
}
