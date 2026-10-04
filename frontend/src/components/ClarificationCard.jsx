import { useState } from 'react';
import { AlertCircle, HelpCircle, Loader2, MessageSquare, Send } from 'lucide-react';
import { respondToClarification } from '../services/claimService';
import { getErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/format';

export default function ClarificationCard({ claim, isOwner, onResponded }) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const c = claim.clarification || {};
  const awaiting = claim.status === 'Clarification';
  const reviewerMessage = c.message;
  const aiQuestions = claim.aiClassification?.questions || [];

  // Dikhane ko kuch na ho to card mat dikhao
  if (!awaiting && !c.message && !c.response) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await respondToClarification(claim._id, response.trim());
      await onResponded();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send your response'));
    } finally {
      setSubmitting(false);
    }
  };

  // Abhi jawab ka intezaar hai
  if (awaiting) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-900">
          <HelpCircle size={16} /> {isOwner ? 'More information needed' : 'Waiting for the employee'}
        </h3>

        {reviewerMessage ? (
          <div className="mt-2 text-sm text-sky-900">
            <div className="text-xs text-sky-700">
              {c.requestedByName} asked{c.requestedAt ? ` · ${formatDateTime(c.requestedAt)}` : ''}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{reviewerMessage}</p>
          </div>
        ) : (
          aiQuestions.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sky-900">
              {aiQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )
        )}

        {isOwner && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              maxLength={1000}
              required
              disabled={submitting}
              placeholder="Type your response here"
              className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !response.trim()}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send response
            </button>
          </form>
        )}
      </div>
    );
  }

  // Jawab aa chuka: baatcheet sirf padhne ke liye
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare size={16} className="text-sky-600" /> Clarification
      </h3>
      <div className="mt-3 space-y-3 text-sm">
        {c.message && (
          <div>
            <div className="text-xs text-slate-500">
              {c.requestedByName} asked{c.requestedAt ? ` · ${formatDateTime(c.requestedAt)}` : ''}
            </div>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2">{c.message}</p>
          </div>
        )}
        {c.response && (
          <div>
            <div className="text-xs text-slate-500">
              Employee replied{c.respondedAt ? ` · ${formatDateTime(c.respondedAt)}` : ''}
            </div>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-sky-50 px-3 py-2">{c.response}</p>
          </div>
        )}
      </div>
    </div>
  );
}