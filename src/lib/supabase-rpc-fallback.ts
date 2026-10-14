import { supabase } from "./supabase";

// =========================================================
// Helper: chama uma RPC tentando a versão nova primeiro.
// Se o Postgres responder que a função não existe (ou não encontrar
// combinação de argumentos), cai pra versão antiga (fallback).
//
// Motivo: durante a migração da Frequência Configurável, existem 2
// versões das RPCs no banco (a antiga de 3/4 args, e a nova de
// 5 args). O frontend prefere a nova. Se por algum motivo a nova
// não existir no ambiente (ex: staging sem migration aplicada),
// o fallback garante que tudo continue funcionando.
//
// Depois da Migration 3 (dropar as antigas), esse helper é
// removido e as chamadas viram diretas.
// =========================================================

// Mensagens típicas quando uma função não existe no Postgres:
// - "function public.X(...) does not exist"
// - "Could not find the function public.X(...) in the schema cache"  (PostgREST)
// - "PGRST202"
function isFunctionNotFoundError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find the function") ||
    m.includes("pgrst202")
  );
}

export type RpcFallbackResult<T> = {
  data: T | null;
  error: { message: string } | null;
  usedFallback: boolean;
};

export async function callRpcWithFallback<T = unknown>(
  fnName: string,
  newParams: Record<string, unknown>,
  fallbackParams: Record<string, unknown>
): Promise<RpcFallbackResult<T>> {
  // Tenta a versão nova (5 args)
  const { data, error } = await supabase.rpc(fnName, newParams);

  if (error && isFunctionNotFoundError(error.message)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[rpc-fallback] ${fnName} não encontrada na versão nova — caindo pra versão antiga.`,
        error.message
      );
    }

    const fallbackRes = await supabase.rpc(fnName, fallbackParams);
    return {
      data: (fallbackRes.data as T) ?? null,
      error: fallbackRes.error
        ? { message: fallbackRes.error.message }
        : null,
      usedFallback: true,
    };
  }

  return {
    data: (data as T) ?? null,
    error: error ? { message: error.message } : null,
    usedFallback: false,
  };
}