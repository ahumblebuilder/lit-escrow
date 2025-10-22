import { Schema, model } from 'mongoose';

// Settlement model for ETH price-based settlements
const settlementSchemaDefinition = {
  ethAddress: {
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  ethPrice: {
    required: true,
    type: Number,
  },
  executed: {
    default: false,
    type: Boolean,
  },
  fromAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  legsHash: {
    type: String,
  },
  toAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  txHash: {
    sparse: true,
    type: String,
    unique: true,
  },
  usdcAmount: {
    required: true,
    type: String,
    validate: {
      message: 'USDC amount must be a valid decimal number',
      validator(v: string) {
        return /^\d*\.?\d+$/.test(v);
      },
    },
  },
  validUntil: {
    required: true,
    type: Date,
  },
  wethAmount: {
    required: true,
    type: String,
    validate: {
      message: 'WETH amount must be a valid decimal number',
      validator(v: string) {
        return /^\d*\.?\d+$/.test(v);
      },
    },
  },
} as const;

const SettlementSchema = new Schema(settlementSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
SettlementSchema.index({ createdAt: 1, ethAddress: 1 });
SettlementSchema.index({ executed: 1, validUntil: 1 });

export const Settlement = model('Settlement', SettlementSchema);

// Keep the old model for backward compatibility during migration
const purchasedCoinSchemaDefinition = {
  coinAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  ethAddress: {
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  purchaseAmount: {
    required: true,
    type: String,
    validate: {
      message: 'Purchase amount must be a valid decimal number',
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
  symbol: {
    required: true,
    type: String,
  },
  txHash: {
    sparse: true,
    type: String,
    unique: true,
  },
} as const;

const PurchasedCoinSchema = new Schema(purchasedCoinSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
PurchasedCoinSchema.index({ createdAt: 1, scheduleId: 1 });

export const PurchasedCoin = model('PurchasedCoin', PurchasedCoinSchema);
