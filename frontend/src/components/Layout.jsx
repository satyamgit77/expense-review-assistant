import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlusCircle,
  ReceiptText,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

const EMPLOYEE_LINKS = [
  { to: "/claims", label: "My claims", icon: ListChecks },
  { to: "/claims/new", label: "New claim", icon: PlusCircle },
];

const REVIEWER_LINKS = [
  { to: "/review", label: "Dashboard", icon: LayoutDashboard },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const links = user.role === "reviewer" ? REVIEWER_LINKS : EMPLOYEE_LINKS;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
                <ReceiptText size={18} />
              </span>
              <span className="hidden sm:inline">Expense Review</span>
            </Link>

            <nav className="flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs capitalize text-slate-500">
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
