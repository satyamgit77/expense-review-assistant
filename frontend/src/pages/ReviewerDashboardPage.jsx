import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileX, Loader2, RefreshCw } from "lucide-react";
import ClaimTable from "../components/ClaimTable";
import { getSummary, listClaims } from "../services/claimService";
import { getErrorMessage } from "../services/api";
import SummaryCards from "../components/SummaryCards";

const TABS = [
  {
    key: "attention",
    label: "Needs attention",
    match: (c) => ["Needs Review", "Compliant"].includes(c.status),
  },
  {
    key: "clarification",
    label: "Clarification",
    match: (c) => c.status === "Clarification",
  },
  { key: "approved", label: "Approved", match: (c) => c.status === "Approved" },
  { key: "rejected", label: "Rejected", match: (c) => c.status === "Rejected" },
  { key: "all", label: "All", match: () => true },
];

export default function ReviewerDashboardPage() {
  const [claims, setClaims] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("attention");

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [list, totals] = await Promise.all([listClaims(), getSummary()]);
      setClaims(list);
      setSummary(totals);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load claims"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result = {};
    for (const t of TABS) result[t.key] = (claims || []).filter(t.match).length;
    return result;
  }, [claims]);

  const activeTab = TABS.find((t) => t.key === tab);
  const visible = (claims || []).filter(activeTab.match);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reviewer dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review claims and make the final decision.
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
            <div className="mt-6">
        <SummaryCards summary={summary} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-xs ${
                tab === t.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {claims ? counts[t.key] : "–"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5">
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

        {claims && visible.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileX size={32} className="text-slate-300" />
            <p className="mt-3 font-medium">No claims here</p>
            <p className="mt-1 text-sm text-slate-500">
              Nothing in “{activeTab.label}” right now.
            </p>
          </div>
        )}

        {claims && visible.length > 0 && (
          <ClaimTable claims={visible} showEmployee />
        )}
      </div>
    </div>
  );
}
