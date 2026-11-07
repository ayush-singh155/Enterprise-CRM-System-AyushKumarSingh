import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  company: { type: String, trim: true, maxlength: 120 },
  notes: { type: String, trim: true, maxlength: 3000 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    unique: true,
    sparse: true
  }
}, { timestamps: true });

customerSchema.index({ assignedTo: 1, company: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
