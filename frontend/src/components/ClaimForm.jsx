import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { CATEGORIES, CURRENCIES } from '../utils/constants';
import { todayISO } from '../utils/format';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50';

function Label({ children, hint }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

const MAX_DESCRIPTION = 500;

export default function ClaimForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    date: todayISO(),
    category: '',
    amount: '',
    currency: 'INR',
    description: '',
    receiptAvailable: '',
  });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      description: form.description.trim(),
      receiptAvailable: form.receiptAvailable === 'yes',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Expense date</Label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={update}
            max={todayISO()}
            required
            disabled={submitting}
            className={inputCls}
          />
        </div>

        <div>
          <Label>Category</Label>
          <select
            name="category"
            value={form.category}
            onChange={update}
            required
            disabled={submitting}
            className={inputCls}
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
        <div>
          <Label>Amount</Label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={update}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            disabled={submitting}
            className={inputCls}
          />
        </div>
        <div>
          <Label>Currency</Label>
          <select
            name="currency"
            value={form.currency}
            onChange={update}
            disabled={submitting}
            className={inputCls}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label hint="(what was it for, who was involved, where)">Description</Label>
        <textarea
          name="description"
          value={form.description}
          onChange={update}
          rows={4}
          maxLength={MAX_DESCRIPTION}
          required
          disabled={submitting}
          placeholder="e.g. Cab from Pune office to Mumbai client site for a contract meeting"
          className={inputCls}
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {form.description.length}/{MAX_DESCRIPTION}
        </div>
      </div>

      <div>
        <Label>Do you have a receipt?</Label>
        <div className="flex gap-3">
          {[
            ['yes', 'Yes'],
            ['no', 'No'],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
                form.receiptAvailable === value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="receiptAvailable"
                value={value}
                checked={form.receiptAvailable === value}
                onChange={update}
                required
                disabled={submitting}
                className="accent-indigo-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Reviewing your claim against policy...
          </>
        ) : (
          <>
            <Send size={18} />
            Submit claim
          </>
        )}
      </button>
      {submitting && (
        <p className="text-center text-xs text-slate-500">This can take up to 10 seconds.</p>
      )}
    </form>
  );
}