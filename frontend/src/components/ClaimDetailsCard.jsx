import { Receipt, Shuffle } from 'lucide-react';
import { formatDate, formatMoney } from '../utils/format';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}

export default function ClaimDetailsCard({ claim, showClaimant }) {
  const overridden = claim.finalCategory && claim.finalCategory !== claim.category;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Receipt size={16} className="text-indigo-600" /> Claim details
      </h3>

      <dl className="mt-2 divide-y divide-slate-100">
        {showClaimant && claim.claimant && (
          <Row label="Employee">
            {claim.claimant.name}
            <div className="text-xs font-normal text-slate-500">{claim.claimant.email}</div>
          </Row>
        )}
        <Row label="Expense date">{formatDate(claim.date)}</Row>
        <Row label="Category (employee)">{claim.category}</Row>
        <Row label="Amount">{formatMoney(claim.amount, claim.currency)}</Row>
        <Row label="Receipt">{claim.receiptAvailable ? 'Available' : 'Not available'}</Row>
      </dl>

      {overridden && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
          <Shuffle size={16} className="mt-0.5 shrink-0" />
          <span>
            A reviewer changed the category from <b>{claim.category}</b> to <b>{claim.finalCategory}</b>.
          </span>
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{claim.description}</p>
      </div>
    </div>
  );
}