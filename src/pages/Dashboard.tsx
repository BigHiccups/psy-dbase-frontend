import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";


export function Dashboard() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("TOKEN:", data.session?.access_token);
      console.log("EXPIRA EM:", new Date((data.session?.expires_at ?? 0) * 1000));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={signOut}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sair
          </button>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-14 w-14 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">
              {user?.user_metadata?.full_name ?? "Sem nome"}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Login funcionando. Próximo passo: Fase 2 — pacientes e formulário público.
        </p>
      </div>

      <Link
        to="/patients"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Ver pacientes
      </Link>
    </div>
  );
}