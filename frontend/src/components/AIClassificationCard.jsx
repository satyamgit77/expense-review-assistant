import { AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';

export default function AIClassificationCard({ claim }) {
  const ai = claim.aiClassification || {};
  const hasAI = ai.category || ai.explanation;
  const pct = Math.round((ai.confidence || 0) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} className="text-violet-600" /> AI review
        <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs font-normal text-violet-700">
          AI-generated
        </span>
      </h3>

      {!hasAI && (
        <p className="mt-3 text-sm text-slate-500">
          The AI review was not available for this claim. It needs a manual check.
        </p>
      )}

      {ai.category && (
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">AI suggests category:</span>
            <span className="font-medium">{ai.category}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                ai.isUncertain ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {ai.isUncertain ? 'Uncertain' : 'Confident'}
            </span>
          </div>
          <div className="text-slate-500">
            Confidence: <b className="font-medium text-slate-700">{pct}%</b>
            <span className="text-xs text-slate-400"> (the AI’s own estimate, not a guarantee)</span>
          </div>
        </div>
      )}

      {ai.category && ai.category !== claim.category && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            This differs from the category chosen by the employee (<b>{claim.category}</b>).
          </span>
        </div>
      )}

      {ai.explanation && <p className="mt-3 text-sm text-slate-700">{ai.explanation}</p>}

      {ai.questions?.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sky-700">
            <HelpCircle size={14} /> Missing information
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {ai.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {hasAI && (
        <p className="mt-4 text-xs text-slate-400">
          This is the AI finding at submission time. A reviewer makes the final decision.
        </p>
      )}
    </div>
  );
}