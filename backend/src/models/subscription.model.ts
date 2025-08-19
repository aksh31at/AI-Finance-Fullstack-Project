import mongoose, { Schema } from "mongoose";
import { Env } from "../config/env.config";

export enum SubscriptionStatus {
  ACTIVE = "active",
  CHECKOUT_INITIATED = "checkout_initiated",
  TRIALING = "trialing",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  TRIAL_EXPIRED = "trial_expired",
  PAYMENT_FAILED = "payment_failed",
}

export enum SubscriptionPlanEnum {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

//price in cents
export enum SubscriptionPriceEnum {
  MONTHLY = 999,
  YEARLY = 9999,
}

export type SubscriptionStatusType = `${SubscriptionStatus}`;
export type SubscriptionPlanType = `${SubscriptionPlanEnum}`;
export type SubscriptionPriceType = `${SubscriptionPriceEnum}`;

export interface SubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodStart: Date | null;
  stripeCurrentPeriodEnd: Date | null;
  trialStartsAt: Date;
  trialEndsAt: Date;
  trialDays: number;
  plan: SubscriptionPlanType | null;
  status: SubscriptionStatusType;
  upgradedAt: Date | null;
  canceledAt: Date | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isTrialActive(): boolean;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeSubscriptionId: { type: String, default: null },
    stripePriceId: { type: String, default: null },
    stripeCurrentPeriodStart: { type: Date, default: null },
    stripeCurrentPeriodEnd: { type: Date, default: null },
    trialStartsAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    trialEndsAt: { type: Date, required: true },
    trialDays: { type: Number, default: Number(Env.TRIAL_DAYS) },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlanEnum),
    },
    upgradedAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIALING,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.methods.isTrialActive = function () {
  if (!this.trialEndsAt || this.status !== SubscriptionStatus.TRIALING)
    return false;
  return new Date() < this.trialEndsAt;
};

const SubscriptionModel = mongoose.model<SubscriptionDocument>(
  "Subscription",
  subscriptionSchema
);

export default SubscriptionModel;
