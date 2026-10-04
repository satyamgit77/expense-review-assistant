import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Circle,
  Flag,
  HelpCircle,
  History,
  ListChecks,
  MessageSquare,
  Shuffle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { formatDateTime } from '../utils/format';

const ICONS = {
  'Validation completed': ListChecks,
  'AI classified': Sparkles,
  'Policy check completed': BookOpen,
  'Status set': Flag,
  Approve: BadgeCheck,
  Reject: XCircle,
  'Clarification requested': HelpCircle,
  'Clarification provided': MessageSquare,
  'Category overridden': Shuffle,
  'AI unavailable': AlertTriangle,
};

const actorStyle = (actor) => {
  if (actor === 'ai') return 'bg-violet-100 text-violet-600';
  if (actor === 'system') return 'bg-slate-100 text-slate-500';
  return 'bg-indigo-100 text-indigo-600'; // insaan (reviewer ya employee)
};

const actorLabel = (actor) => {
  if (actor === 'ai') return 'AI';
  if (actor === 'system') return 'System';
  return actor;
};

export default function ReviewTimeline({ history }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <History size={16} className="text-indigo-600" /> Timeline
      </h3>

      <ol className="mt-4">
        {history.map((h, i) => {
          const Icon = ICONS[h.action] || Circle;
          const isLast = i === history.length - 1;

          return (
            <li key={h._id || i} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && <span className="absolute left-4 top-8 h-full w-px bg-slate-200" />}
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actorStyle(h.actor)}`}
              >
                <Icon size={16} />
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium">{h.action}</span>
                  {(h.from || h.to) && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {h.from && <span className="rounded bg-slate-100 px-1.5 py-0.5">{h.from}</span>}
                      {h.from && h.to && <ArrowRight size={12} />}
                      {h.to && <span className="rounded bg-slate-100 px-1.5 py-0.5">{h.to}</span>}
                    </span>
                  )}
                </div>
                {h.reason && <p className="mt-0.5 text-sm text-slate-600">{h.reason}</p>}
                <p className="mt-0.5 text-xs text-slate-400">
                  {actorLabel(h.actor)} &middot; {formatDateTime(h.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}