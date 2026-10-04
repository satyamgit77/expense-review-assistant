import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
} from 'lucide-react';

const STYLES = {
  Pending: { cls: 'bg-slate-100 text-slate-700 ring-slate-200', Icon: Clock },
  Compliant: { cls: 'bg-teal-50 text-teal-700 ring-teal-200', Icon: CheckCircle2 },
  'Needs Review': { cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: AlertTriangle },
  Clarification: { cls: 'bg-sky-50 text-sky-700 ring-sky-200', Icon: HelpCircle },
  Approved: { cls: 'bg-emerald-600 text-white ring-emerald-600', Icon: BadgeCheck },
  Rejected: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', Icon: XCircle },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.Pending;
  const { Icon } = style;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.cls}`}
    >
      <Icon size={14} />
      {status}
    </span>
  );
}