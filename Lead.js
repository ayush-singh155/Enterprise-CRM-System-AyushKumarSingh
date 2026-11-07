import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  company: { type: String, trim: true, maxlength: 120 },
  source: { type: String, trim: true, maxlength: 80 },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'converted'],
    default: 'new'
  },
  notes: { type: String, trim: true, maxlength: 3000 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  convertedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  }
}, { timestamps: true });

leadSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });
leadSchema.index({ assignedTo: 1, company: 1 });
leadSchema.index({ assignedTo: 1, createdAt: 1, source: 1 });

export const Lead = mongoose.model('Lead', leadSchema);
