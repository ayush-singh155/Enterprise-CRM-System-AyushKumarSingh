import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['call', 'meeting', 'note', 'email'],
    required: true
  },
  subject: { type: String, trim: true, maxlength: 200 },
  content: { type: String, trim: true, maxlength: 20000 },
  occurredAt: { type: Date, default: Date.now, required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailTo: { type: String, lowercase: true, trim: true, maxlength: 254 },
  emailStatus: { type: String, enum: ['pending', 'sent', 'failed'] },
  emailMessageId: { type: String, maxlength: 500 },
  emailError: { type: String, maxlength: 1000 }
}, { timestamps: true });

activitySchema.pre('validate', function validateLinkedRecord(next) {
  const links = [this.lead, this.customer, this.deal].filter(Boolean);
  if (links.length !== 1) {
    this.invalidate('lead', 'An activity must be linked to exactly one lead, customer, or deal.');
  }
  if (this.type === 'email' && (!this.emailTo || !this.subject || !this.content)) {
    this.invalidate('emailTo', 'Email activities require a recipient, subject, and message.');
  }
  next();
});

activitySchema.index({ lead: 1, occurredAt: -1 });
activitySchema.index({ customer: 1, occurredAt: -1 });
activitySchema.index({ deal: 1, occurredAt: -1 });
activitySchema.index({ createdBy: 1, occurredAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
