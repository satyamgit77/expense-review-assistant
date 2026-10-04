import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ReceiptText,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getErrorMessage } from '../services/api';
import { homePathFor } from '../utils/constants';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Login hote hi user set hota hai aur yahin se role ke hisaab se sahi page par chala jata hai
  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const isLogin = mode === 'login';

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
            <ReceiptText size={28} />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Expense Review Assistant</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? 'Sign in to continue' : 'Create an employee account'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-md py-1.5 transition ${isLogin ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-md py-1.5 transition ${!isLogin ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <Field
                icon={UserIcon}
                name="name"
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={update}
                required
                autoComplete="name"
              />
            )}
            <Field
              icon={Mail}
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={update}
              required
              autoComplete="email"
            />
            <Field
              icon={Lock}
              name="password"
              type="password"
              placeholder={isLogin ? 'Password' : 'Password (min 6 characters)'}
              value={form.password}
              onChange={update}
              required
              minLength={isLogin ? undefined : 6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isLogin ? (
                <LogIn size={18} />
              ) : (
                <UserPlus size={18} />
              )}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}