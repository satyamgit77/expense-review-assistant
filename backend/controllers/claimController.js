const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const { CLAIM_STATUS, ROLES } = require('../config/constants');
const { processNewClaim } = require('../services/claimProcessingService');
const { buildSummary } = require('../services/summaryService');

const createClaim = async (req, res) => {
  try {
    const claim = await processNewClaim(req.body, req.user, req.log);
    res.status(201).json({ claim });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message, errors: error.results });
    }
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to submit claim', error: error.message });
  }
};

const listClaims = async (req, res) => {
  try {
    const filter = {};

    // Employee sirf apne claims dekhe; reviewer sabke
    if (req.user.role !== ROLES.REVIEWER) {
      filter.claimant = req.user._id;
    }

    const { status } = req.query;
    if (status) {
      if (!Object.values(CLAIM_STATUS).includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed: ${Object.values(CLAIM_STATUS).join(', ')}`,
        });
      }
      filter.status = status;
    }

    const claims = await Claim.find(filter)
      .populate('claimant', 'name email')
      .sort({ createdAt: -1 });

    res.json({ count: claims.length, claims });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
};

const getClaim = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }

    const claim = await Claim.findById(id).populate('claimant', 'name email');

    // Employee dusre ka claim kholne par bhi 404 (exist karta hai ye nahi batate)
    const isOwner = claim && String(claim.claimant._id) === String(req.user._id);
    const isReviewer = req.user.role === ROLES.REVIEWER;

    if (!claim || (!isOwner && !isReviewer)) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json({ claim });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to fetch claim', error: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const filter = {};
    // Employee ko sirf apne claims ka total; reviewer ko sabka
    if (req.user.role !== ROLES.REVIEWER) {
      filter.claimant = req.user._id;
    }

    const claims = await Claim.find(filter)
      .select('amount currency category finalCategory status')
      .lean();

    res.json(buildSummary(claims));
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to calculate totals', error: error.message });
  }
};


const respondToClarification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }

    const response = String((req.body && req.body.response) ?? '')
      .trim()
      .slice(0, 1000);
    if (!response) {
      return res.status(400).json({ message: 'A response is required' });
    }

    const claim = await Claim.findById(id);

    // Sirf claim ka maalik jawab de sakta hai; dusron ke liye 404
    if (!claim || String(claim.claimant) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== CLAIM_STATUS.CLARIFICATION) {
      return res.status(409).json({ message: 'This claim is not waiting for clarification' });
    }

    const now = new Date();

    const updated = await Claim.findOneAndUpdate(
      { _id: id, status: CLAIM_STATUS.CLARIFICATION },
      {
        $set: {
          status: CLAIM_STATUS.NEEDS_REVIEW,
          'clarification.response': response,
          'clarification.respondedAt': now,
        },
        $push: {
          decisionHistory: {
            timestamp: now,
            actor: req.user.name,
            action: 'Clarification provided',
            from: CLAIM_STATUS.CLARIFICATION,
            to: CLAIM_STATUS.NEEDS_REVIEW,
            reason: response,
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(409).json({ message: 'This claim is no longer waiting for clarification' });
    }

    req.log.info('claim_clarification_provided', {
      claimId: id,
      userId: String(req.user._id),
    });

    res.json({ claim: updated });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to submit response', error: error.message });
  }
};

module.exports = { createClaim, listClaims, getClaim, respondToClarification, getSummary };