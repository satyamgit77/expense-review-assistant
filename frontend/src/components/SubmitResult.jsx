import { Link } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  ListChecks,
  PlusCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

const STATUS_MESSAGE = {
  Compliant:
    "Your claim passed the automatic checks. A reviewer still makes the final decision.",
  "Needs Review": "A reviewer will look at this claim.",
  Clarification: "Some more information is needed for this claim.",
};

export default function SubmitResult({ claim, onAnother }) {
  const failed = claim.validationResults.filter((r) => !r.passed);
  const ai = claim.aiClassification || {};
  const statusReason = [...claim.decisionHistory]
    .reverse()
    .find((h) => h.action === "Status set");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Claim submitted</h2>
          <StatusBadge status={claim.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {STATUS_MESSAGE[claim.status] || "Your claim has been recorded."}
        </p>
        {statusReason?.reason && (
          <p className="mt-1 text-sm text-slate-500">
            Reason: {statusReason.reason}
          </p>
        )}
      </div>

      {failed.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <XCircle size={16} /> Checks that did not pass
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-rose-700">
            {failed.map((r) => (
              <li key={r._id || r.check}>
                {r.message}
                {r.sectionId && (
                  <span className="text-rose-500">
                    {" "}
                    (Section {r.sectionId})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ai.explanation && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-violet-600" /> AI review
            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs font-normal text-violet-700">
              AI-generated
            </span>
          </h3>
          <p className="mt-2 text-sm text-slate-700">{ai.explanation}</p>
          {ai.isUncertain && (
            <p className="mt-2 text-sm text-amber-700">
              The AI is not confident about the category of this claim.
            </p>
          )}
        </div>
      )}

      {ai.questions?.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-800">
            <HelpCircle size={16} /> Information that would help
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sky-800">
            {ai.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.policyEvidence && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen size={16} className="text-indigo-600" /> Policy evidence
          </h3>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {ai.policyEvidence.split("\n").map((line) => (
              <p key={line} className="border-l-2 border-indigo-200 pl-3">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAnother}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <PlusCircle size={16} /> Submit another claim
        </button>
        <Link
          to="/claims"
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
        >
          <ListChecks size={16} /> View my claims
        </Link>
        <Link
          to={`/claims/${claim._id}`}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
