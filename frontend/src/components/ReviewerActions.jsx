import { useState } from 'react';
import { BadgeCheck, HelpCircle, Info, Shuffle, ShieldCheck, XCircle } from 'lucide-react';
import ActionModal from './ActionModal';
import {
  approveClaim,
  overrideCategory,
  rejectClaim,
  requestClarification,
} from '../services/reviewService';
import { CATEGORIES } from '../utils/constants';

const FINAL = ['Approved', 'Rejected'];

export default function ReviewerActions({ claim, isOwner, onDone }) {
  const [open, setOpen] = useState(null); // 'approve' | 'reject' | 'clarify' | 'override'

  if (FINAL.includes(claim.status)) return null;

  if (isOwner) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        You submitted this claim, so another reviewer has to decide on it.
      </div>
    );
  }

  const failed = claim.validationResults.filter((r) => !r.passed);
  const receiptFailed = failed.some((r) => r.check === 'receipt');
  const currentCategory = claim.finalCategory || claim.category;

  // API call, refresh, phir modal band
  const run = (fn) => async (values) => {
    await fn(values);
    await onDone();
    setOpen(null);
  };

  const btn =
    'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck size={16} className="text-violet-600" /> Reviewer actions
      </h3>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setOpen('approve')}
          disabled={receiptFailed}
          title={receiptFailed ? 'A receipt is required (Section 1.2)' : undefined}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          <BadgeCheck size={16} /> Approve
        </button>
        <button
          onClick={() => setOpen('reject')}
          className={`${btn} bg-rose-600 text-white hover:bg-rose-700`}
        >
          <XCircle size={16} /> Reject
        </button>
        <button
          onClick={() => setOpen('clarify')}
          className={`${btn} border border-sky-300 text-sky-700 hover:bg-sky-50`}
        >
          <HelpCircle size={16} /> Request clarification
        </button>
        <button
          onClick={() => setOpen('override')}
          className={`${btn} border border-violet-300 text-violet-700 hover:bg-violet-50`}
        >
          <Shuffle size={16} /> Override category
        </button>
      </div>

      {receiptFailed && (
        <p className="mt-3 text-sm text-slate-500">
          Approval is blocked because the receipt is missing for this amount (Section 1.2). You can
          reject the claim or ask the employee for more information.
        </p>
      )}

      {open === 'approve' && (
        <ActionModal
          title="Approve claim"
          description={
            failed.length > 0
              ? `${failed.length} automatic ${failed.length === 1 ? 'check' : 'checks'} did not pass. Explain why you are approving this claim anyway.`
              : 'All automatic checks passed.'
          }
          textLabel="Reason"
          textRequired={failed.length > 0}
          textPlaceholder="e.g. Approved by department head"
          confirmLabel="Approve"
          tone="emerald"
          onClose={() => setOpen(null)}
          onSubmit={run(({ text }) => approveClaim(claim._id, text))}
        />
      )}

      {open === 'reject' && (
        <ActionModal
          title="Reject claim"
          description="The employee will see this reason."
          textLabel="Reason"
          textRequired
          textPlaceholder="e.g. Amount is over the limit and no receipt was provided"
          confirmLabel="Reject"
          tone="rose"
          onClose={() => setOpen(null)}
          onSubmit={run(({ text }) => rejectClaim(claim._id, text))}
        />
      )}

      {open === 'clarify' && (
        <ActionModal
          title="Request clarification"
          description="The claim moves to Clarification until the employee replies."
          textLabel="Your question"
          textRequired
          textPlaceholder="e.g. Who attended, and what was the business purpose?"
          confirmLabel="Send request"
          tone="sky"
          onClose={() => setOpen(null)}
          onSubmit={run(({ text }) => requestClarification(claim._id, text))}
        />
      )}

      {open === 'override' && (
        <ActionModal
          title="Override category"
          description={`Current category: ${currentCategory}. The category limit will be checked again for the new category. The employee’s and the AI’s original categories are kept on record.`}
          categories={CATEGORIES.filter((c) => c !== currentCategory)}
          textLabel="Reason"
          textRequired
          textPlaceholder="e.g. Dinner was with a client, so it is Client Entertainment"
          confirmLabel="Override"
          tone="violet"
          onClose={() => setOpen(null)}
          onSubmit={run(({ text, category }) => overrideCategory(claim._id, category, text))}
        />
      )}
    </div>
  );
}