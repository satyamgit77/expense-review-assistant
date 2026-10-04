import { CheckCircle2, ListChecks, XCircle } from 'lucide-react';

const LABELS = {
  requiredFields: 'Required fields',
  amount: 'Amount',
  category: 'Category',
  date: 'Submission window',
  currency: 'Currency',
  receipt: 'Receipt',
  limit: 'Category limit',
  duplicate: 'Duplicate check',
};

export default function PolicyCheckCard({ results }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <ListChecks size={16} className="text-indigo-600" /> Automatic checks
      </h3>

      <ul className="mt-3 space-y-3">
        {results.map((r) => (
          <li key={r._id || r.check} className="flex items-start gap-2.5 text-sm">
            {r.passed ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            )}
            <div>
              <div className="font-medium">
                {LABELS[r.check] || r.check}
                {r.sectionId && (
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                    Section {r.sectionId}
                  </span>
                )}
              </div>
              <div className={r.passed ? 'text-slate-500' : 'text-rose-700'}>{r.message}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}