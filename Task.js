import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open' },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

taskSchema.pre('validate', function validateLinkedRecord(next) {
  const links = [this.lead, this.customer, this.deal].filter(Boolean);
  if (links.length !== 1) {
    this.invalidate('lead', 'A task must be linked to exactly one lead, customer, or deal.');
  }
  next();
});

taskSchema.index({ lead: 1, dueDate: 1 });
taskSchema.index({ customer: 1, dueDate: 1 });
taskSchema.index({ deal: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
