import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkBase =
  "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition";
const linkInactive = "text-slate-300 hover:bg-slate-800 hover:text-white";
const linkActive = "bg-blue-600 text-white shadow";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-slate-950 text-white shadow-2xl">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
          DAI Platform
        </p>
        <h1 className="mt-3 text-2xl font-bold">Anesthesia Intelligence</h1>
        <p className="mt-2 text-sm text-slate-400">
          Perioperative clinical workflow
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/cases"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          Cases
        </NavLink>
      </nav>

      <div className="border-t border-slate-800 px-4 py-5">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}