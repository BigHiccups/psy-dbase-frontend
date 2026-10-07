import { createClient } from "@supabase/supabase-js";

// Variáveis de ambiente do Vite (precisam do prefixo VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Falha cedo se algo estiver faltando — evita erros silenciosos
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias."
  );
}

// Cliente único compartilhado por toda a aplicação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // mantém sessão no localStorage
    autoRefreshToken: true,     // renova o token automaticamente
    detectSessionInUrl: true,   // lê tokens devolvidos na URL após OAuth
  },
});