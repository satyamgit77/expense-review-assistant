const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const { CLAIM_STATUS } = require('../config/constants');
const {
  checkDecision,
  checkClarificationRequest,
  checkOverride,
  recalcAfterOverride,
  cleanReason,
  FINAL_STATUSES,
} = require('../services/reviewService');

const makeDecision = (action, newStatus) => async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }

    const reason = cleanReason(req.body && req.body.reason);

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const problem = checkDecision({ action, claim, reviewerId: req.user._id, reason });
    if (problem) {
      return res.status(problem.statusCode).json({ message: problem.message });
    }

    const now = new Date();

    // Atomic update: status abhi bhi final nahi hai tabhi chalega
    const updated = await Claim.findOneAndUpdate(
      { _id: id, status: { $nin: FINAL_STATUSES } },
      {
        $set: {
          status: newStatus,
          decision: {
            by: req.user._id,
            byName: req.user.name,
            action,
            reason: reason || undefined,
            at: now,
          },
        },
        $push: {
          decisionHistory: {
            timestamp: now,
            actor: req.user.name,
            action,
            from: claim.status,
            to: newStatus,
            reason: reason || undefined,
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('claimant', 'name email');

    if (!updated) {
      return res.status(409).json({ message: 'Claim was already decided by someone else' });
    }

        req.log.info('review_decision', {
      claimId: id,
      action,
      from: claim.status,
      to: newStatus,
      reviewerId: String(req.user._id),
      hasReason: Boolean(reason),
    });

    res.json({ claim: updated });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: `Failed to ${action.toLowerCase()} claim`, error: error.message });
  }
};

const approveClaim = makeDecision('Approve', CLAIM_STATUS.APPROVED);
const rejectClaim = makeDecision('Reject', CLAIM_STATUS.REJECTED);

const requestClarification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }

    const message = cleanReason(req.body && req.body.message);

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const problem = checkClarificationRequest({ claim, reviewerId: req.user._id, message });
    if (problem) {
      return res.status(problem.statusCode).json({ message: problem.message });
    }

    const now = new Date();

    const updated = await Claim.findOneAndUpdate(
      { _id: id, status: { $nin: FINAL_STATUSES } },
      {
        $set: {
          status: CLAIM_STATUS.CLARIFICATION,
          // Nayi request purane jawab ko saaf kar deti hai (history me purana record rehta hai)
          clarification: {
            requestedBy: req.user._id,
            requestedByName: req.user.name,
            message,
            requestedAt: now,
          },
        },
        $push: {
          decisionHistory: {
            timestamp: now,
            actor: req.user.name,
            action: 'Clarification requested',
            from: claim.status,
            to: CLAIM_STATUS.CLARIFICATION,
            reason: message,
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('claimant', 'name email');

    if (!updated) {
      return res.status(409).json({ message: 'Claim was already decided by someone else' });
    }

        req.log.info('review_clarification_requested', {
      claimId: id,
      from: claim.status,
      reviewerId: String(req.user._id),
    });

    res.json({ claim: updated });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to request clarification', error: error.message });
  }
};

const overrideClassification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }

    const newCategory = String((req.body && req.body.category) ?? '').trim();
    const reason = cleanReason(req.body && req.body.reason);

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const problem = checkOverride({ claim, reviewerId: req.user._id, newCategory, reason });
    if (problem) {
      return res.status(problem.statusCode).json({ message: problem.message });
    }

    const currentCategory = claim.finalCategory || claim.category;
    const { validationResults, status } = recalcAfterOverride({ claim, newCategory });
    const now = new Date();

    const history = [
      {
        timestamp: now,
        actor: req.user.name,
        action: 'Category overridden',
        from: currentCategory,
        to: newCategory,
        reason,
      },
    ];
    if (status !== claim.status) {
      history.push({
        timestamp: now,
        actor: 'system',
        action: 'Status set',
        from: claim.status,
        to: status,
        reason: `Limit re-checked for ${newCategory}`,
      });
    }

    // updatedAt match karta hai: beech me kisi aur ne claim badla to update nahi hoga
    const updated = await Claim.findOneAndUpdate(
      { _id: id, status: { $nin: FINAL_STATUSES }, updatedAt: claim.updatedAt },
      {
        $set: { finalCategory: newCategory, status, validationResults },
        $push: {
          classificationOverrides: {
            from: currentCategory,
            to: newCategory,
            reason,
            by: req.user._id,
            byName: req.user.name,
            at: now,
          },
          decisionHistory: { $each: history },
        },
      },
      { returnDocument: 'after' }
    ).populate('claimant', 'name email');

    if (!updated) {
      return res
        .status(409)
        .json({ message: 'Claim was changed by someone else, please reload and try again' });
    }

        req.log.info('review_category_overridden', {
      claimId: id,
      from: currentCategory,
      to: newCategory,
      statusChanged: status !== claim.status,
      reviewerId: String(req.user._id),
    });

    res.json({ claim: updated });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to override classification', error: error.message });
  }
};

module.exports = { approveClaim, rejectClaim, requestClarification, overrideClassification };