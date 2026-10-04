import { BadgeCheck, Hourglass, Wallet, XCircle } from 'lucide-react';
import { formatMoney } from '../utils/format';

const CARDS = [
  { key: 'total', label: 'Total claimed', icon: Wallet, cls: 'bg-indigo-50 text-indigo-600' },
  { key: 'open', label: 'Awaiting decision', icon: Hourglass, cls: 'bg-amber-50 text-amber-600' },
  { key: 'approved', label: 'Approved', icon: BadgeCheck, cls: 'bg-emerald-50 text-emerald-600' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, cls: 'bg-rose-50 text-rose-600' },
];

export default function SummaryCards({ summary }) {
  const entries = Object.entries(summary?.byCurrency || {});
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {entries.map(([currency, data]) => (
        <div key={currency}>
          {entries.length > 1 && (
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              {currency}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CARDS.map(({ key, label, icon: Icon, cls }) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`rounded-md p-1 ${cls}`}>
                    <Icon size={14} />
                  </span>
                  {label}
                </div>
                <div className="mt-2 text-lg font-semibold">{formatMoney(data[key], currency)}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(data.byCategory).map(([cat, amount]) => (
              <span
                key={cat}
                className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
              >
                {cat}: <b className="font-medium">{formatMoney(amount, currency)}</b>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}