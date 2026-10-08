import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { session, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Erro ao iniciar login:", err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-white to-gray-50">
      {/* Conteúdo central */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo + nome */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/20">
              p
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              psy-dbase
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestão de consultório de psicologia
            </p>
          </div>

          {/* Card de login */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-medium text-gray-900">
              Entrar na sua conta
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              Use sua conta Google para acessar.
            </p>

            <button
              onClick={handleLogin}
              className="group flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                aria-hidden="true"
                className="transition group-hover:scale-105"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.5 5.5C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"
                />
              </svg>
              Entrar com Google
            </button>

            {/* Aviso de segurança */}
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 text-brand-600"
              />
              <p className="text-xs leading-relaxed text-gray-500">
                Acesso restrito ao psicólogo responsável. Seus dados e dos
                pacientes são protegidos por sigilo profissional e LGPD.
              </p>
            </div>
          </div>

          {/* Rodapé */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Ao entrar, você concorda com os termos de uso e a política de
            privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}