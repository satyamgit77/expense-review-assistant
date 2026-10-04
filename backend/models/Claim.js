const mongoose = require('mongoose');
const { CLAIM_STATUS, CATEGORIES } = require('../config/constants');

const claimSchema = new mongoose.Schema(
  {
    // 1. Employee input
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    receiptAvailable: {
      type: Boolean,
      required: true,
    },

    // 2. Status
    status: {
      type: String,
      enum: Object.values(CLAIM_STATUS),
      default: CLAIM_STATUS.PENDING,
    },

    // 3. Final category (reviewer override ke baad); shuru me category jaisi hi
    finalCategory: {
      type: String,
      enum: CATEGORIES,
    },

    // 4. Deterministic checks (NO AI)
    validationResults: [
      {
        check: String,     // e.g. 'duplicate', 'receipt', 'limit'
        passed: Boolean,
        message: String,
        sectionId: String,
      },
    ],

    // 5. AI workflow data
    aiClassification: {
      category: String,
      confidence: Number,
      isUncertain: Boolean,
      explanation: String,
      policySectionId: String,   // e.g. '3.2'
      policyEvidence: String,    // policy ka exact text
      questions: [String],       // missing info ke sawal
    },

        // Final decision (approve / reject)
    decision: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      byName: String,
      action: String,   // 'Approve' ya 'Reject'
      reason: String,
      at: Date,
    },

        // Clarification request aur employee ka jawab
    clarification: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requestedByName: String,
      message: String,
      requestedAt: Date,
      response: String,
      respondedAt: Date,
    },

        // Reviewer ke category overrides (original category aur AI category alag se safe rehti hain)
    classificationOverrides: [
      {
        from: String,
        to: String,
        reason: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        byName: String,
        at: Date,
      },
    ],

    // 6. Reviewer audit trail
    decisionHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        actor: String,           // 'system', 'ai', ya reviewer ka naam
        action: String,          // 'AI Classified', 'Approve', 'Override' ...
        from: String,
        to: String,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

claimSchema.index({ claimant: 1, createdAt: -1 });
claimSchema.index({ claimant: 1, date: 1, category: 1, amount: 1 }); // duplicate check
claimSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);