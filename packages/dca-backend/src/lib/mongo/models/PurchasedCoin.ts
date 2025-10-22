import { Schema, model } from 'mongoose';

// Options trade model for options trading
const optionsTradeSchemaDefinition = {
  annualizedPremium: {
    type: Number,
  },
  currentSpot: {
    type: Number,
  },
  depositAmount: {
    required: true,
    type: String,
    validate: {
      message: 'Deposit amount must be a valid decimal number',
      validator(v: string) {
        return /^\d*\.?\d+$/.test(v);
      },
    },
  },
  depositToken: {
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
  executed: {
    default: false,
    type: Boolean,
  },
  expiry: {
    required: true,
    type: Date,
  },
  frequency: {
    enum: ['15 minutes', '1 hour', '12 hours', '1 day'],
    required: true,
    type: String,
  },
  minimumApy: {
    max: 1000,
    min: 0,
    required: true,
    type: Number,
  },
  optionPremium: {
    type: Number,
  },
  strikeThreshold: {
    max: 1000,
    min: 0,
    required: true,
    type: Number,
  },
  txHash: {
    sparse: true,
    type: String,
    unique: true,
  },
  vaultAddress: {
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
} as const;

const OptionsTradeSchema = new Schema(optionsTradeSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
OptionsTradeSchema.index({ createdAt: 1, ethAddress: 1 });
OptionsTradeSchema.index({ executed: 1, expiry: 1 });
OptionsTradeSchema.index({ expiry: 1, vaultAddress: 1 });

export const OptionsTrade = model('OptionsTrade', OptionsTradeSchema);

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
