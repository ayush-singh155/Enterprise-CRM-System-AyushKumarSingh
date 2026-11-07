import mongoose from 'mongoose';
import { getRecordScope } from '../services/accessService.js';
import { AppError } from './AppError.js';
import { User } from '../models/User.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function buildRecordFilter(user, query, filters = []) {
  const filter = await getRecordScope(user);

  for (const key of filters) {
    if (query[key]) filter[key] = new RegExp(`^${escapeRegex(query[key])}$`, 'i');
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = ['name', 'email', 'company', 'phone', 'source', 'notes']
      .map((field) => ({ [field]: search }));
  }

  if (query.assignedTo) {
    const assigneeId = new mongoose.Types.ObjectId(query.assignedTo);
    if (user.role === 'sales_rep' && String(user._id) !== query.assignedTo) {
      throw new AppError('Sales reps can only view their own records', 403);
    }
    if (user.role === 'manager' && String(user._id) !== query.assignedTo) {
      const isTeamMember = await User.exists({
        _id: assigneeId,
        managerId: user._id,
        isActive: true
      });
      if (!isTeamMember) throw new AppError("Managers can only view their team's records", 403);
    }
    filter.assignedTo = assigneeId;
  }

  return filter;
}

export function getSort(sortBy, sortOrder, allowedFields) {
  if (!allowedFields.includes(sortBy)) {
    throw new AppError('Unsupported sort field', 400);
  }
  return { [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: 1 };
}
