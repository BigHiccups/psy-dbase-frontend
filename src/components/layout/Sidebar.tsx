import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText,
  Wallet,
  Settings,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/providers", label: "Prestadores", icon: Building2 },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/records", label: "Prontuário", icon: FileText, disabled: true },
  { to: "/finance", label: "Financeiro", icon: Wallet, disabled: true },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ open, onClose }: Props) {
  const { user } = useAuth();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Verifica se o perfil está incompleto (sem CRP ou sem telefone)
  useEffect(() => {
    if (!user) return;

    async function check() {
      const { data } = await supabase
        .from("profiles")
        .select("crp, phone")
        .eq("id", user!.id)
        .maybeSingle();

      setProfileIncomplete(!!data && (!data.crp || !data.phone));
    }

    check();
  }, [user]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white
          transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              p
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
              psy-dbase
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSettings = item.to === "/settings";
            const showBadge = isSettings && profileIncomplete;

            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 dark:text-slate-600"
                  title="Em breve"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span
                    className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"
                    title="Complete seu perfil"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-600">
          v0.1.0
        </div>
      </aside>
    </>
  );
}