import mongoose from 'mongoose';

export const DEAL_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
];

export const DEFAULT_STAGE_PROBABILITY = {
  new: 10,
  contacted: 20,
  qualified: 40,
  proposal: 60,
  negotiation: 80,
  won: 100,
  lost: 0
};

const stageHistorySchema = new mongoose.Schema({
  stage: { type: String, enum: DEAL_STAGES, required: true },
  probability: { type: Number, min: 0, max: 100, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  value: { type: Number, required: true, min: 0 },
  stage: {
    type: String,
    enum: DEAL_STAGES,
    default: 'new'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    validate: Number.isInteger
  },
  expectedCloseDate: { type: Date },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Retained to read existing deals created before ownership was renamed.
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stageHistory: { type: [stageHistorySchema], default: [] }
}, { timestamps: true });

dealSchema.pre('validate', function setDefaultsAndOwner() {
  if (!this.owner && this.assignedTo) this.owner = this.assignedTo;
  if (!this.probability && this.probability !== 0) {
    this.probability = DEFAULT_STAGE_PROBABILITY[this.stage];
  }
});

dealSchema.index({ owner: 1, stage: 1, updatedAt: -1 });
dealSchema.index({ assignedTo: 1, stage: 1, updatedAt: -1 });
dealSchema.index({ 'stageHistory.stage': 1, 'stageHistory.changedAt': 1 });

export const Deal = mongoose.model('Deal', dealSchema);
