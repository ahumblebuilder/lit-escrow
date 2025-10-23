import { Schema, model } from 'mongoose';

const derifunWriteOptionJobSchemaDefinition = {
  ethAddress: {
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  vault: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  amount: {
    required: true,
    type: String,
  },
  strike: {
    required: true,
    type: String,
  },
  expiry: {
    required: true,
    type: Number,
  },
  premiumPerUnit: {
    required: true,
    type: String,
  },
  minDeposit: {
    required: true,
    type: String,
  },
  maxDeposit: {
    required: true,
    type: String,
  },
  validUntil: {
    required: true,
    type: Number,
  },
  quoteId: {
    required: true,
    type: String,
  },
  signature: {
    required: true,
    type: String,
  },
  scheduleId: {
    required: true,
    type: String,
  },
  txHash: {
    required: true,
    type: String,
  },
  lastRunAt: {
    type: Date,
  },
  nextRunAt: {
    type: Date,
  },
  lastFinishedAt: {
    type: Date,
  },
  failedAt: {
    type: Date,
  },
  failReason: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
} as const;

const DerifunWriteOptionJobSchema = new Schema(derifunWriteOptionJobSchemaDefinition, {
  timestamps: true,
});

DerifunWriteOptionJobSchema.index({ createdAt: 1, ethAddress: 1 });

export const DerifunWriteOptionJob = model('DerifunWriteOptionJob', DerifunWriteOptionJobSchema);
