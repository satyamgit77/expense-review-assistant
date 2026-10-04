import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ClaimForm from '../components/ClaimForm';
import SubmitResult from '../components/SubmitResult';
import { createClaim } from '../services/claimService';
import { getErrorMessage } from '../services/api';

export default function SubmitClaimPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [formKey, setFormKey] = useState(0); // naya form (khali) dikhane ke liye

  const handleSubmit = async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      const claim = await createClaim(data);
      setResult(claim);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError({
        message: getErrorMessage(err, 'Could not submit the claim'),
        details: (err.response?.data?.errors || []).map((e) => e.message),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startAnother = () => {
    setResult(null);
    setError(null);
    setFormKey((k) => k + 1);
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <SubmitResult claim={result} onAnother={startAnother} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold">Submit a claim</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your claim is checked against the expense policy as soon as you submit it.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <div>{error.message}</div>
            {error.details.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {error.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ClaimForm key={formKey} onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}