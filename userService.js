import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function listUsers() {
  return User.find({ isActive: true })
    .select('_id name email role managerId')
    .populate('managerId', 'name email')
    .sort({ name: 1 });
}

export async function listAssignees(user) {
  const filter = user.role === 'admin'
    ? { isActive: true }
    : user.role === 'manager'
      ? { isActive: true, $or: [{ _id: user._id }, { managerId: user._id }] }
      : { isActive: true, _id: user._id };
  return User.find(filter).select('_id name email role').sort({ name: 1 });
}

export async function createUser(data) {
  if (data.managerId) {
    const manager = await User.findOne({
      _id: data.managerId,
      role: 'manager',
      isActive: true
    }).select('_id');
    if (!manager) throw new AppError('Selected manager was not found', 400);
  }
  return User.create(data);
}
