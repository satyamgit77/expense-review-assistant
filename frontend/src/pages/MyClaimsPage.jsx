import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, FileX, Loader2, PlusCircle } from "lucide-react";
import ClaimTable from "../components/ClaimTable";
import { getSummary, listClaims } from "../services/claimService";
import SummaryCards from "../components/SummaryCards";
import { getErrorMessage } from "../services/api";

export default function MyClaimsPage() {
  const [claims, setClaims] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listClaims(), getSummary()])
      .then(([list, totals]) => {
        setClaims(list);
        setSummary(totals);
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Could not load your claims")),
      );
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My claims</h1>
          {claims && (
            <p className="mt-1 text-sm text-slate-500">
              {claims.length} {claims.length === 1 ? "claim" : "claims"}
            </p>
          )}
        </div>
        <Link
          to="/claims/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <PlusCircle size={16} /> New claim
        </Link>
      </div>
      {claims && claims.length > 0 && (
        <div className="mt-6">
          <SummaryCards summary={summary} />
        </div>
      )}

      <div className="mt-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!claims && !error && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        )}

        {claims && claims.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileX size={32} className="text-slate-300" />
            <p className="mt-3 font-medium">No claims yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Submit your first expense claim to get started.
            </p>
          </div>
        )}

        {claims && claims.length > 0 && <ClaimTable claims={claims} />}
      </div>
    </div>
  );
}
