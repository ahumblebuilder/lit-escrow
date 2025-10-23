import { Schema, model } from 'mongoose';

const transferJobSchemaDefinition = {
  ethAddress: {
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  recipientAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  tokenAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  amount: {
    required: true,
    type: String,
    validate: {
      message: 'Amount must be a valid decimal number',
      validator(v: string) {
        return /^\d*\.?\d+$/.test(v);
      },
    },
  },
  scheduleId: {
    index: true,
    required: true,
    type: Schema.Types.ObjectId,
  },
  txHash: {
    sparse: true,
    type: String,
    unique: true,
  },
} as const;

const TransferJobSchema = new Schema(transferJobSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
TransferJobSchema.index({ createdAt: 1, scheduleId: 1 });

export const TransferJob = model('TransferJob', TransferJobSchema);
