import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatMoney } from '../utils/format';

export default function ClaimTable({
  claims,
  to = (c) => `/claims/${c._id}`,
  showEmployee = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-160 text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            {showEmployee && <th className="px-4 py-3 font-medium">Employee</th>}
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="w-8 px-2 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {claims.map((c) => (
            <tr
              key={c._id}
              onClick={() => navigate(to(c))}
              className="cursor-pointer transition hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(c.date)}</td>
              {showEmployee && (
                <td className="whitespace-nowrap px-4 py-3">{c.claimant?.name || 'Unknown'}</td>
              )}
              <td className="whitespace-nowrap px-4 py-3">{c.finalCategory || c.category}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={c.description}>
                {c.description}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {formatMoney(c.amount, c.currency)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-2 py-3 text-slate-300">
                <ChevronRight size={18} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}