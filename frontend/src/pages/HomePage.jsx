import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogIn,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { homePathFor } from '../utils/constants';

function AuthButtons({ large = false }) {
  const { user, loading } = useAuth();
  const size = large ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm';

  if (loading) return <div className={large ? 'h-12' : 'h-9'} />;

  if (user) {
    return (
      <Link
        to={homePathFor(user.role)}
        className={`flex items-center gap-2 rounded-lg bg-indigo-600 font-medium text-white transition hover:bg-indigo-700 ${size}`}
      >
        <LayoutDashboard size={large ? 20 : 16} />
        {user.role === 'reviewer' ? 'Go to dashboard' : 'Go to my claims'}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/login"
        className={`flex items-center gap-2 rounded-lg bg-indigo-600 font-medium text-white transition hover:bg-indigo-700 ${size}`}
      >
        <LogIn size={large ? 20 : 16} /> Sign in
      </Link>
      <Link
        to="/login?mode=register"
        className={`flex items-center gap-2 rounded-lg border border-slate-300 bg-white font-medium transition hover:bg-slate-50 ${size}`}
      >
        <UserPlus size={large ? 20 : 16} /> Create account
      </Link>
    </div>
  );
}

const STEPS = [
  {
    icon: FileText,
    title: 'Submit a claim',
    text: 'Enter the date, category, amount and a short description of the expense.',
  },
  {
    icon: ListChecks,
    title: 'Automatic checks',
    text: 'Receipt, category limit, submission window and duplicates are checked with exact rules.',
  },
  {
    icon: Sparkles,
    title: 'AI review',
    text: 'The AI reads the description, explains the finding and asks for any missing details.',
  },
  {
    icon: ShieldCheck,
    title: 'Reviewer decides',
    text: 'A reviewer approves, rejects or asks for clarification. Every step is recorded.',
  },
];

const PRINCIPLES = [
  {
    icon: ListChecks,
    title: 'Rules are exact',
    text: 'Limits, receipts, dates and duplicates are checked by normal code, never guessed by AI.',
  },
  {
    icon: BookOpen,
    title: 'Every finding shows its policy',
    text: 'The AI points to the exact policy section behind its explanation, so it can be verified.',
  },
  {
    icon: Search,
    title: 'People make the final call',
    text: 'The AI only explains. A reviewer makes the decision, and uncertain results are clearly marked.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
              <ReceiptText size={18} />
            </span>
            Expense Review
          </div>
          <AuthButtons />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles size={14} /> Policy-aware expense review
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Expense claims, checked against policy in seconds
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Submit a claim and get instant feedback. Reviewers see the checks, the AI explanation and
            the policy evidence in one place.
          </p>
          <div className="mt-8 flex justify-center">
            <AuthButtons large />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-center text-xl font-semibold">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                      <Icon size={20} />
                    </span>
                    <span className="text-xs font-medium text-slate-400">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-xl font-semibold">Built to be trusted</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="inline-block rounded-xl bg-violet-50 p-2.5 text-violet-600">
                  <Icon size={20} />
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              Ready to start <ArrowRight size={14} />
            </p>
            <AuthButtons />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        Internal tool &middot; Expense Claim Policy Review Assistant
      </footer>
    </div>
  );
}


































// import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
// import { useAuth } from '../context/useAuth';

// export default function HomePage() {
//   const { user, logout } = useAuth();
//   const isReviewer = user.role === 'reviewer';

//   return (
//     <div className="flex min-h-screen items-center justify-center p-6">
//       <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className={`rounded-xl p-3 ${isReviewer ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'}`}>
//             {isReviewer ? <ShieldCheck size={26} /> : <UserRound size={26} />}
//           </div>
//           <div>
//             <h1 className="text-lg font-semibold">Welcome, {user.name}</h1>
//             <p className="text-sm capitalize text-slate-500">
//               {user.role} &middot; {user.email}
//             </p>
//           </div>
//         </div>

//         <p className="mt-5 text-sm text-slate-500">
//           Login is working. Claim pages will appear here in the next steps.
//         </p>

//         <button
//           onClick={logout}
//           className="mt-6 flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
//         >
//           <LogOut size={16} />
//           Sign out
//         </button>
//       </div>
//     </div>
//   );
// }