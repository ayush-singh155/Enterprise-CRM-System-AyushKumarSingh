import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/**
 * Builds the assigned-record filter for an admin, manager, or sales rep.
 * @param {import('../models/User.js').User} user Authenticated user document.
 * @returns {Promise<Record<string, unknown>>} Mongoose-compatible scope.
 */
export async function getRecordScope(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'sales_rep') return { assignedTo: user._id };
  const team = await User.find({ managerId: user._id, isActive: true }).distinct('_id');
  return { assignedTo: { $in: [user._id, ...team] } };
}

export async function getDealScope(user) {
  if (user.role === 'admin') return {};
  const { assignedTo } = await getRecordScope(user);
  return {
    $or: [
      { owner: assignedTo },
      { owner: { $exists: false }, assignedTo }
    ]
  };
}

/**
 * Resolves a requested owner while enforcing the caller's assignment boundary.
 * @param {import('../models/User.js').User} user Authenticated user document.
 * @param {string|undefined} requestedAssigneeId Requested owner identifier.
 * @returns {Promise<import('mongoose').Types.ObjectId>} Authorized owner ID.
 */
export async function resolveAssignee(user, requestedAssigneeId) {
  if (user.role === 'sales_rep') {
    if (requestedAssigneeId && String(requestedAssigneeId) !== String(user._id)) {
      throw new AppError('Sales reps can only assign records to themselves', 403);
    }
    return user._id;
  }
  if (!requestedAssigneeId) return user._id;
  if (!mongoose.isValidObjectId(requestedAssigneeId)) {
    throw new AppError('Invalid assignee identifier', 400);
  }
  const assignee = await User.findOne({ _id: requestedAssigneeId, isActive: true })
    .select('_id role managerId');
  if (!assignee) throw new AppError('Assignee not found', 404);
  if (user.role === 'manager' &&
      String(assignee._id) !== String(user._id) &&
      String(assignee.managerId) !== String(user._id)) {
    throw new AppError('Managers can only assign records within their team', 403);
  }
  return assignee._id;
}

/**
 * Prevents record reads and mutations outside the user's role-based scope.
 * @param {import('../models/User.js').User} user Authenticated user document.
 * @param {{assignedTo: import('mongoose').Types.ObjectId}} record CRM record.
 */
export async function assertRecordAccess(user, record) {
  const assignedToId = record.owner?._id ?? record.owner ??
    record.assignedTo?._id ?? record.assignedTo;
  if (user.role === 'admin' || String(assignedToId) === String(user._id)) return;
  if (user.role === 'manager') {
    const assigned = await User.exists({ _id: assignedToId, managerId: user._id, isActive: true });
    if (assigned) return;
  }
  throw new AppError('Record not found', 404);
}
