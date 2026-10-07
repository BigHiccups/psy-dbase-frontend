# CONTEXT.md — psy-dbase-front

> **Leia isto antes de tocar no código.**
> Este documento é a fonte de verdade para qualquer IA ou dev que entre no projeto.
> Ele registra **decisões já tomadas** para evitar retrabalho e perguntas repetidas.

---

## 1. O que é este projeto

Interface web do **psy-dbase**, sistema de gestão para psicólogo autônomo.
Cobre cadastro de pacientes, agenda (Google Calendar + Meet), prontuário com
evolução SOAP, financeiro e relatórios.

**Repositório irmão:** `psy-dbase` (backend Node + integrações).
**Um psicólogo por conta.** Não é multi-tenant compartilhado — cada conta é
isolada por `auth.uid()`.

---

## 2. Stack e versões

| Camada        | Tecnologia                                  | Versão       |
|---------------|---------------------------------------------|--------------|
| Build         | Vite                                        | 7.x          |
| UI            | React                                       | 19.x         |
| Tipagem       | TypeScript                                  | 5.9.x        |
| Estilo        | **Tailwind CSS v4** (plugin `@tailwindcss/vite`) | 4.3.x  |
| Roteamento    | React Router                                | 7.x          |
| Ícones        | lucide-react                                | última       |
| Auth          | Supabase Auth (Google OAuth)                | —            |
| Dados         | `@supabase/supabase-js`                     | 2.x          |
| HTTP          | fetch nativo (via `src/lib/api.ts`)         | —            |
| Gerenciador   | npm                                         | —            |
| Deploy        | Vercel                                      | —            |

**Node:** 20.x (o backend usa `ws` por causa disso — ver CONTEXT do backend).

---

## 3. Estrutura de pastas

```
src/
├── components/
│   ├── layout/          # Sidebar, Header, AppLayout
│   └── ui/              # Button, Input, Card, Badge, Modal, EmptyState, Spinner, index.ts
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── usePatients.ts
├── lib/
│   ├── supabase.ts      # cliente único do Supabase
│   └── api.ts           # fetch autenticado para o backend Node
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Patients.tsx
│   └── PublicForm.tsx
├── types/
│   └── index.ts         # Patient, InviteResponse, …
├── App.tsx
├── index.css            # Tailwind v4 + @theme
└── main.tsx
```

---

## 4. Decisões de arquitetura

### 4.1 Dados vão direto para o Supabase

O frontend **não** passa pelo backend Node para ler/escrever dados de aplicação.
Ele fala direto com o Supabase via `@supabase/supabase-js`, e o **RLS** garante
isolamento.

O backend Node só é usado para operações que exigem **segredos**:

- Google Calendar / Meet (Fase 3)
- Envio de WhatsApp / e-mail (Fase 6)
- Geração de PDF de recibo (Fase 5)
- Transcrição de áudio (a decidir)

### 4.2 Cliente HTTP autenticado

Toda chamada ao backend passa por `src/lib/api.ts`, que:

1. Pega o `access_token` da sessão Supabase (`supabase.auth.getSession()`)
2. Injeta `Authorization: Bearer <token>`
3. Lança erro se não houver sessão

**Nunca** chamar `fetch` direto para o backend. Sempre via `apiFetch`.

### 4.3 RLS + GRANT obrigatórios em toda tabela nova

Toda tabela no Supabase precisa de **duas coisas**:

1. `alter table … enable row level security;` + **policies** (`auth.uid() = user_id`)
2. `grant select, insert, update, delete on … to authenticated;`

**Sem o GRANT, o Postgres barra antes da RLS** — o erro é
`42501 permission denied for table`. Já aconteceu uma vez com `profiles` e outra
com `patient_invites`. Sempre incluir GRANT nas migrations.

O backend usa `service_role` (ignora RLS e GRANT), mas o frontend usa `anon` +
`authenticated`, então as duas camadas importam.

### 4.4 Tailwind v4 — não é v3

- **Não existe** `tailwind.config.js`
- **Não existe** `postcss.config.js`
- Plugin registrado em `vite.config.ts` via `@tailwindcss/vite`
- Tema (cores, fontes) vai em `src/index.css` dentro de `@theme { … }`
- Cor primária é `brand-*` (mapeada para teal-600 do Tailwind)

Se precisar adicionar cor/fonte nova, edite o `@theme` no `src/index.css`,
**não** crie `tailwind.config.js`.

### 4.5 Design system próprio em `components/ui/`

Componentes base a serem reutilizados em todas as telas:

- `Button` — variantes: `primary` (brand), `secondary`, `ghost`, `danger`
- `Input` — com `label`, `error`, `hint`
- `Card` — container com borda e sombra sutil
- `Badge` — variantes: `success`, `warning`, `danger`, `neutral`, `brand`
- `Modal` — overlay + Esc para fechar, com título opcional
- `EmptyState` — ícone + título + descrição + ação
- `Spinner` — loading circular

**Regra:** telas novas devem usar esses componentes, não recriar botões/inputs
do zero.

### 4.6 Layout de app autenticado

Rotas protegidas são envelopadas por `<AppLayout />`, que fornece:

- `Sidebar` fixa em desktop (>= `lg`), drawer em mobile
- `Header` sticky no topo com avatar/nome + botão de logout

Estrutura no `App.tsx`:

```
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" … />
    <Route path="/patients" … />
  </Route>
</Route>
```

### 4.7 Rotas públicas fora do ProtectedRoute

`/login` e `/form/:token` ficam **antes** do `<ProtectedRoute>` no `App.tsx`.
O formulário público não exige sessão — o paciente não tem conta.

**Atenção:** qualquer rota nova que não esteja explicitamente declarada cai no
fallback `*` → redireciona para `/dashboard` → `ProtectedRoute` → `/login`.
Foi isso que fez o link do formulário cair na tela de login na primeira vez.

---

## 5. Fluxos principais

### 5.1 Login

1. Usuário clica em "Entrar com Google" na `/login`
2. `supabase.auth.signInWithOAuth({ provider: "google" })`
3. Redireciona para o Google → volta para `/dashboard`
4. `AuthContext` mantém a sessão via `onAuthStateChange`
5. Trigger no banco (`on_auth_user_created`) cria linha em `profiles`
   automaticamente no signup

### 5.2 Convite de paciente

1. Psicólogo vai em `/patients` → botão "Convidar paciente"
2. `InvitePatientModal` coleta nome (opcional) + telefone (obrigatório)
3. Chama `POST /invites` no backend Node via `apiFetch`
4. Backend:
   - Cria registro em `patient_invites` com token UUID
   - Gera URL curta via TinyURL (com fallback para URL longa se falhar)
   - Monta link `wa.me/<phone>?text=<mensagem>`
5. Backend devolve `{ inviteId, token, publicUrl, shortUrl, whatsappUrl, phone }`
6. Frontend abre `whatsappUrl` em nova aba

### 5.3 Formulário público

1. Paciente recebe link `https://…/form/<token>` via WhatsApp
2. `PublicForm` valida o token via RPC `get_invite_by_token`
3. Se válido: mostra formulário com dados cadastrais + checkbox do termo
4. Ao enviar, chama RPC `submit_patient_form`
5. RPC:
   - Valida o token de novo (não usado, não expirado)
   - Cria linha em `patient_form_submissions` com `status='pending'`
   - Marca o convite como `used_at = now()`
6. Paciente vê tela de sucesso

### 5.4 Aprovação (pendente de UI)

RPC `approve_submission` já existe no banco. Cria `patient` a partir da
submissão e marca `status='approved'`. **Falta a tela no frontend** para o
psicólogo revisar e aprovar.

---

## 6. Convenções de código

- **Idioma:** variáveis, funções, tipos, arquivos em **inglês**. Comentários em
  **português**.
- **Componentes:** função nomeada (`export function Foo()`), não arrow function
  anônima.
- **Tipos:** usar `type`, não `interface` (exceto quando precisar de extensão).
- **Estados de fetch:** sempre tratar `loading`, `error` e `empty`.
- **Rotas:** PascalCase para arquivos de página (`Patients.tsx`), kebab-case
  para componentes utilitários (`invite-patient-modal.tsx` quando for o caso).
- **Nada de `any`:** exceto em integrações de bibliotecas com tipos divergentes
  (ex: `transport: ws as any` no backend).

---

## 7. Armadilhas conhecidas

| Sintoma                                             | Causa                                           | Solução                                                     |
|-----------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `42501 permission denied for table`                 | Faltou GRANT                                    | `grant … to authenticated;` na migration                    |
| `Unsupported provider: provider is not enabled`     | Google OAuth não salvo no Supabase              | Salvar em Authentication → Providers                        |
| `redirect_uri_mismatch`                             | Callback do Google ≠ do Supabase                | `https://<ref>.supabase.co/auth/v1/callback` no Google Cloud |
| Link `/form/:token` cai em `/login`                 | Rota pública ausente ou fallback errado         | Declarar rota **antes** do `ProtectedRoute`                 |
| Tailwind não aplica estilos novos                   | Config de v3 em projeto v4, ou dev server não reiniciado | Usar `@theme` no CSS e plugin Vite; reiniciar           |
| `Token inválido` no curl do backend                 | Colou a `service_role` em vez do `access_token` | Usar o token do usuário (payload `"role":"authenticated"`)  |
| `permission denied` no backend mesmo com GRANT      | `.env` do backend com `anon` em vez de `service_role` | Decodificar o JWT e conferir o campo `role`             |

---

## 8. Segurança

- **`anon key`:** vai no `.env.local` do frontend. É segura ali **porque o RLS
  protege**. Nunca comitar `.env.local`.
- **`service_role key`:** exclusiva do backend Node. Nunca no frontend, nunca em
  log, nunca em chat. Se vazar, rotacionar imediatamente.
- **`access_token` do usuário:** vai no header `Authorization`. Expira em 1h e
  é renovado automaticamente pelo SDK.
- **Links de prontuário:** hash expirável, sem indexação (Fase 4).
- **LGPD:** dado sensível de saúde. Consentimento explícito, direito ao
  esquecimento, auditoria de acesso ao prontuário.

---

## 9. O que está fora do escopo deste repositório

- Lógica de negócio pesada (cálculos financeiros complexos, geração de PDF,
  integração Google Calendar, envio de WhatsApp) → **backend `psy-dbase`**
- Migrations SQL → **rodadas manualmente no SQL Editor do Supabase** por
  enquanto (não há versionamento ainda; a decidir se vale usar `supabase/migrations`)
- Deploy do backend → **a definir** (Render / Railway / Fly.io)

---

## 10. Estado atual (última atualização)

- ✅ Fase 1 concluída: Auth Google, `profiles` com trigger, RLS, deploy Vercel
- ✅ Fase 2 parcial: convite de paciente, formulário público, submissão
- ⏳ Pendente Fase 2: tela de submissões pendentes + botão de aprovação
- ⏳ Pendente Fase 2: captura de horários das sessões no convite (obrigatório),
  leitura no formulário, checkbox de orientação sobre o local
- ⏳ Pendente Fase 2: telas redesenhadas com o design system (Login, Dashboard,
  Patients, PublicForm)
- ⏳ Fase 3+: Agenda, Prontuário, Financeiro, Notificações

**Branches ativas:**
- Frontend: `feat/design-imp`
- Backend: `feature/form-creation`

---

## 11. Como usar este documento

Ao entrar no projeto, leia na ordem:

1. Este `CONTEXT.md` (decisões e armadilhas)
2. `README.md` (como rodar)
3. `TODO.md` (o que falta)
4. Código em `src/`

Se algo aqui estiver desatualizado, **atualize antes de codar**. Contexto
desatualizado é pior que contexto ausente.