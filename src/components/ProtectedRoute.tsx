import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Bloqueia acesso se não houver sessão; redireciona para /login
export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}