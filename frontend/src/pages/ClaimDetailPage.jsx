import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { getClaim } from "../services/claimService";
import { getErrorMessage } from "../services/api";
import { formatMoney } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import ClaimDetailsCard from "../components/ClaimDetailsCard";
import PolicyCheckCard from "../components/PolicyCheckCard";
import AIClassificationCard from "../components/AIClassificationCard";
import PolicyEvidenceCard from "../components/PolicyEvidenceCard";
import ReviewTimeline from "../components/ReviewTimeline";
import ClarificationCard from "../components/ClarificationCard";
import ReviewerActions from "../components/ReviewerActions";

function StatusBanner({ claim, isReviewer }) {
  const d = claim.decision || {};

  if (claim.status === "Approved") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <BadgeCheck size={18} className="mt-0.5 shrink-0" />
        <div>
          Approved{d.byName ? ` by ${d.byName}` : ""}.
          {d.reason && (
            <div className="mt-0.5 text-emerald-700">Reason: {d.reason}</div>
          )}
        </div>
      </div>
    );
  }

  if (claim.status === "Rejected") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <XCircle size={18} className="mt-0.5 shrink-0" />
        <div>
          Rejected{d.byName ? ` by ${d.byName}` : ""}.
          {d.reason && (
            <div className="mt-0.5 text-rose-700">Reason: {d.reason}</div>
          )}
        </div>
      </div>
    );
  }

  if (isReviewer) return null;

  const text =
    claim.status === "Compliant"
      ? "Passed the automatic checks. Waiting for the reviewer’s final decision."
      : claim.status === "Needs Review"
        ? "Waiting for a reviewer."
        : null;

  return text ? (
    <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
      <Clock size={18} className="shrink-0" /> {text}
    </div>
  ) : null;
}

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setClaim(await getClaim(id));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this claim"));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isReviewer = user.role === "reviewer";
  const backTo = isReviewer ? "/review" : "/claims";

  const back = (
    <Link
      to={backTo}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft size={16} /> Back to {isReviewer ? "dashboard" : "my claims"}
    </Link>
  );

  if (error) {
    return (
      <div>
        {back}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  const isOwner = claim.claimant?._id === user.id;

  return (
    <div className="space-y-5">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {claim.finalCategory || claim.category} &middot;{" "}
            {formatMoney(claim.amount, claim.currency)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Claim ID: {claim._id}</p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <StatusBanner claim={claim} isReviewer={isReviewer} />

      <ClarificationCard claim={claim} isOwner={isOwner} onResponded={load} />

      {isReviewer && (
        <ReviewerActions claim={claim} isOwner={isOwner} onDone={load} />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <ClaimDetailsCard claim={claim} showClaimant={isReviewer} />
          <PolicyCheckCard results={claim.validationResults} />
        </div>
        <div className="space-y-5">
          <AIClassificationCard claim={claim} />
          <PolicyEvidenceCard
            evidence={claim.aiClassification?.policyEvidence}
          />
        </div>
      </div>

      <ReviewTimeline history={claim.decisionHistory} />
    </div>
  );
}
